<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\AuctionBid;
use App\Models\AuctionRegistration;
use App\Models\UserWalletHold;
use App\Models\UserTransaction;
use App\Events\AuctionBidPlaced;
use App\Events\AuctionExtended;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Http\Controllers\Traits\GetUserProfileTrait;

class BidController extends Controller
{
    use GetUserProfileTrait;

    /**
     * Place a bid on an auction
     */
    public function placeBid(Request $request, $auctionId)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        // Providers cannot bid
        if ($user->role === 'provider') {
            return response()->json(['error' => 'مقدمي الخدمات لا يمكنهم المزايدة'], 403);
        }

        // Rate limiting: 1 bid per second per user
        $rateLimitKey = "bid_rate:{$user->id}:{$auctionId}";
        if (Cache::has($rateLimitKey)) {
            return response()->json(['error' => 'يرجى الانتظار قبل تقديم مزايدة جديدة'], 429);
        }

        // Use pessimistic locking for the auction
        $bid = DB::transaction(function () use ($request, $auctionId, $user, $profile, $userType, $rateLimitKey) {
            $auction = Auction::lockForUpdate()->findOrFail($auctionId);

            // Check auction is live
            if (!$auction->isLive) {
                throw new \Exception('المزاد غير مباشر حالياً');
            }

            // Check user is registered
            $registration = AuctionRegistration::where('auction_id', $auction->id)
                ->where('user_id', $profile->id)
                ->where('user_type', $userType)
                ->where('status', 'registered')
                ->first();

            if (!$registration) {
                throw new \Exception('يجب التسجيل أولاً للمشاركة في المزاد');
            }

            // Prevent seller from bidding on their own car
            if (
                $auction->car->seller_type === 'user' &&
                $auction->car->seller_id === $profile->id &&
                $auction->car->seller_user_type === $userType
            ) {
                throw new \Exception('لا يمكن للبائع المزايدة على سيارته الخاصة');
            }

            $bidAmount = (float) $request->amount;
            $minimumBid = (float) $auction->minimum_bid;

            // Validate bid amount with detailed response
            if ($bidAmount < $minimumBid) {
                throw new \Exception(json_encode([
                    'error' => "الحد الأدنى للمزايدة هو {$minimumBid}",
                    'error_code' => 'BID_TOO_LOW',
                    'details' => [
                        'minimum_bid' => $minimumBid,
                        'your_bid' => $bidAmount,
                        'suggested_bid' => $minimumBid,
                    ]
                ]));
            }

            // Verify user has sufficient balance for this bid
            $walletService = new \App\Services\AuctionWalletService();
            $availableBalance = $walletService->getAvailableBalance($profile, $userType);

            if ($availableBalance < $bidAmount) {
                throw new \Exception(json_encode([
                    'error' => 'رصيد المحفظة غير كافي للمزايدة',
                    'error_code' => 'INSUFFICIENT_BALANCE',
                    'details' => [
                        'required' => $bidAmount,
                        'available' => $availableBalance,
                    ]
                ]));
            }

            // FIXED: Get auto-bid candidate BEFORE creating new bid and marking others as outbid
            $autoBidCandidate = AuctionBid::where('auction_id', $auction->id)
                ->where('user_id', '!=', $profile->id)
                ->whereNotNull('max_auto_bid')
                ->where('max_auto_bid', '>', $bidAmount)
                ->orderBy('max_auto_bid', 'desc')
                ->first();

            // Mark previous highest bid as outbid
            $previousBid = AuctionBid::where('auction_id', $auction->id)
                ->where('status', 'valid')
                ->first();

            if ($previousBid) {
                $previousBid->markOutbid();

                // Notify user they've been outbid
                event(new \App\Events\UserOutbid($previousBid, $auction, $bidAmount));
            }

            // Create the new bid
            $bid = AuctionBid::create([
                'auction_id' => $auction->id,
                'user_id' => $profile->id,
                'user_type' => $userType,
                'bidder_name' => $profile->name,
                'bidder_phone' => $user->phone,
                'amount' => $bidAmount,
                'max_auto_bid' => $request->input('max_auto_bid'),
                'bid_time' => now(),
                'wallet_hold_id' => $registration->wallet_hold_id,
                'status' => 'valid',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            // Update auction current bid
            $auction->update([
                'current_bid' => $bidAmount,
                'bid_count' => $auction->bid_count + 1,
            ]);

            // AUTO-BIDDING LOGIC (FIXED - using pre-fetched candidate)
            if ($autoBidCandidate) {
                $increment = $auction->bid_increment ?? 50;
                $nextBidAmount = $bidAmount + $increment;

                if ($nextBidAmount <= $autoBidCandidate->max_auto_bid) {
                    // Place automatic counter-bid
                    $autoBid = AuctionBid::create([
                        'auction_id' => $auction->id,
                        'user_id' => $autoBidCandidate->user_id,
                        'user_type' => $autoBidCandidate->user_type,
                        'bidder_name' => $autoBidCandidate->bidder_name,
                        'bidder_phone' => $autoBidCandidate->bidder_phone,
                        'amount' => $nextBidAmount,
                        'max_auto_bid' => $autoBidCandidate->max_auto_bid,
                        'bid_time' => now(),
                        'wallet_hold_id' => $autoBidCandidate->wallet_hold_id,
                        'status' => 'valid',
                        'is_auto_bid' => true,
                    ]);

                    // Mark user's bid as outbid
                    $bid->markOutbid();
                    event(new \App\Events\UserOutbid($bid, $auction, $nextBidAmount));

                    // Update auction
                    $auction->update([
                        'current_bid' => $nextBidAmount,
                        'bid_count' => $auction->bid_count + 1,
                    ]);

                    // Broadcast the auto-bid
                    event(new AuctionBidPlaced($auction->fresh(), $autoBid));
                }
            }

            // Check if should auto-extend
            if ($auction->shouldAutoExtend()) {
                $auction->extend();
                event(new AuctionExtended($auction, $auction->time_remaining));
            }

            // Set rate limit
            Cache::put($rateLimitKey, true, 1);

            // Broadcast the bid
            event(new AuctionBidPlaced($auction->fresh(), $bid));

            return $bid;
        });

        return response()->json([
            'message' => 'تم تقديم المزايدة بنجاح',
            'bid' => $bid,
        ]);
    }

    /**
     * Get bid history for an auction
     */
    public function getBids(Request $request, $auctionId)
    {
        $auction = Auction::findOrFail($auctionId);

        $bids = AuctionBid::where('auction_id', $auctionId)
            ->orderBy('bid_time', 'desc')
            ->paginate($request->get('per_page', 20));

        // Anonymize bidder names for non-owners
        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        $bids->getCollection()->transform(function ($bid) use ($profile, $userType) {
            // Show full details only if it's the user's own bid
            if ($profile && $bid->user_id == $profile->id && $bid->user_type === $userType) {
                $bid->display_name = $bid->bidder_name . ' (أنت)';
                $bid->is_mine = true;
                // Keep full phone for own bids
            } else {
                $bid->display_name = $bid->anonymized_name;
                $bid->is_mine = false;
            }
            // Keep bidder_phone for display (frontend masks it)
            // Remove truly sensitive data only
            unset($bid->ip_address);
            unset($bid->user_agent);
            return $bid;
        });

        return response()->json($bids);
    }

    /**
     * Instant Buy Now purchase
     */
    public function buyNow(Request $request, $auctionId)
    {
        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        // Providers cannot buy
        if ($user->role === 'provider') {
            return response()->json(['error' => 'مقدمي الخدمات لا يمكنهم الشراء'], 403);
        }

        $auction = Auction::lockForUpdate()->findOrFail($auctionId);
        $car = $auction->car;

        // Prevent seller from buying their own car
        if (
            $car->seller_type === 'user' &&
            $car->seller_id === $profile->id &&
            $car->seller_user_type === $userType
        ) {
            return response()->json(['error' => 'لا يمكن للبائع شراء سيارته الخاصة'], 403);
        }

        // Validate buy-now is available
        if (!$car->buy_now_price || !$auction->isLive) {
            return response()->json(['error' => 'خيار الشراء الفوري غير متاح حالياً'], 400);
        }

        // Check user is registered
        if (!$auction->isUserRegistered($profile->id, $userType)) {
            return response()->json(['error' => 'يجب التسجيل أولاً للمشاركة'], 400);
        }

        // Check balance
        $walletService = new \App\Services\AuctionWalletService();
        $available = $walletService->getAvailableBalance($profile, $userType);

        if ($available < $car->buy_now_price) {
            return response()->json(['error' => 'رصيد المحفظة غير كافي للشراء الفوري'], 400);
        }

        DB::transaction(function () use ($auction, $profile, $userType, $car) {
            // End auction immediately
            $auction->update([
                'status' => 'ended',
                'actual_end' => now(),
                'winner_id' => $profile->id,
                'winner_type' => $userType,
                'winner_name' => $profile->name,
                'final_price' => $car->buy_now_price,
                'payment_status' => 'awaiting_payment',
                'payment_deadline' => now()->addHours(24),
            ]);

            // Broadcast auction ended
            event(new \App\Events\AuctionEnded($auction));

            // Update winner's registration
            AuctionRegistration::where('auction_id', $auction->id)
                ->where('user_id', $profile->id)
                ->where('user_type', $userType)
                ->update(['status' => 'winner']);

            // Release all other participants' deposits
            $this->releaseNonWinnerDeposits($auction, $profile->id, $userType);
        });

        return response()->json(['message' => 'تم شراء السيارة بنجاح!']);
    }

    /**
     * Release deposits for non-winning users
     */
    private function releaseNonWinnerDeposits(Auction $auction, string $winnerId, string $winnerType): void
    {
        $registrations = $auction->registrations()
            ->where(function ($query) use ($winnerId, $winnerType) {
                $query->where('user_id', '!=', $winnerId)
                    ->orWhere('user_type', '!=', $winnerType);
            })
            ->whereIn('status', ['registered', 'participated'])
            ->get();

        foreach ($registrations as $registration) {
            try {
                DB::transaction(function () use ($registration) {
                    if ($registration->wallet_hold_id) {
                        $hold = UserWalletHold::find($registration->wallet_hold_id);
                        if ($hold && $hold->status === 'active') {
                            $hold->release();

                            // Add to wallet history (transaction record for release)
                            UserTransaction::create([
                                'user_id' => $registration->user_id,
                                'user_type' => $registration->user_type,
                                'type' => 'release',
                                'amount' => $hold->amount,
                                'description' => 'تحرير تأمين المزاد (شراء فوري)',
                                'reference_type' => 'wallet_hold',
                                'reference_id' => $hold->id,
                                'balance_after' => null,
                            ]);
                        }
                    }

                    $registration->update([
                        'status' => 'deposit_released',
                        'deposit_released_at' => now(),
                    ]);
                });
            } catch (\Exception $e) {
                \Log::warning("Failed to release deposit for registration {$registration->id}: " . $e->getMessage());
            }
        }
    }
}
