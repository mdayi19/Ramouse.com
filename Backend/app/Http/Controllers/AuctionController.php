<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\AuctionCar;
use App\Models\AuctionRegistration;
use App\Models\AuctionReminder;
use App\Models\UserWalletHold;
use App\Models\Notification;
use App\Events\UserNotification;
use App\Models\UserTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Services\AuctionWalletService;
use App\Http\Controllers\Traits\GetUserProfileTrait;

class AuctionController extends Controller
{
    use GetUserProfileTrait;

    protected $auctionWalletService;

    public function __construct(AuctionWalletService $auctionWalletService)
    {
        $this->auctionWalletService = $auctionWalletService;
    }

    /**
     * List auctions (public)
     */
    public function index(Request $request)
    {
        $query = Auction::with(['car'])
            ->whereIn('status', ['scheduled', 'live', 'extended', 'ended']);

        // Filter by status
        if ($request->has('status')) {
            $status = $request->status;
            if ($status === 'upcoming') {
                $query->where('status', 'scheduled')->where('scheduled_start', '>', now());
            } elseif ($status === 'live') {
                $query->whereIn('status', ['live', 'extended']);
            } elseif ($status === 'ended') {
                $query->whereIn('status', ['ended', 'completed']);
            }
        }

        // Sort
        $query->orderBy('scheduled_start', 'asc');

        $auctions = $query->paginate($request->get('per_page', 12));

        // If authenticated, add registration status
        $user = $request->user();
        if ($user) {
            [$profile, $userType] = $this->getUserProfile($user);
            if ($profile) {
                $auctions->getCollection()->transform(function ($auction) use ($profile, $userType) {
                    $auction->is_registered = $auction->isUserRegistered($profile->id, $userType);
                    $auction->has_reminder = $auction->hasUserReminder($profile->id, $userType);
                    return $auction;
                });
            }
        }

        return response()->json($auctions);
    }

    /**
     * Get single auction details
     */
    public function show(Request $request, $id)
    {
        $auction = Auction::with([
            'car',
            'bids' => function ($q) {
                $q->orderBy('bid_time', 'desc')->limit(20);
            }
        ])->findOrFail($id);

        $data = $auction->toArray();
        $data['participant_count'] = $auction->participant_count;
        $data['time_remaining'] = $auction->time_remaining;
        $data['minimum_bid'] = $auction->minimum_bid;

        // If authenticated, add user-specific data
        $user = $request->user();
        if ($user) {
            [$profile, $userType] = $this->getUserProfile($user);
            if ($profile) {
                $data['is_registered'] = $auction->isUserRegistered($profile->id, $userType);
                $data['has_reminder'] = $auction->hasUserReminder($profile->id, $userType);
                $data['can_bid'] = $auction->canBid($profile->id, $userType);

                // Get user's highest bid
                $userBid = $auction->bids()
                    ->where('user_id', $profile->id)
                    ->where('user_type', $userType)
                    ->orderBy('amount', 'desc')
                    ->first();
                $data['my_highest_bid'] = $userBid ? (float) $userBid->amount : null;
            }
        }

        return response()->json($data);
    }

    /**
     * Register for an auction (with deposit)
     */
    public function register(Request $request, $id)
    {
        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        // Providers cannot participate
        if ($user->role === 'provider') {
            return response()->json(['error' => 'مقدمي الخدمات لا يمكنهم المشاركة في المزادات'], 403);
        }

        $auction = Auction::with('car')->findOrFail($id);

        // Check auction is available for registration
        if (!in_array($auction->status, ['scheduled', 'live', 'extended'])) {
            return response()->json(['error' => 'المزاد غير متاح للتسجيل'], 400);
        }

        // Check not already registered
        if ($auction->isUserRegistered($profile->id, $userType)) {
            return response()->json(['error' => 'أنت مسجل بالفعل في هذا المزاد'], 400);
        }

        // Prevent seller from registering in their own auction
        if (
            $auction->car->seller_type === 'user' &&
            $auction->car->seller_id === $profile->id &&
            $auction->car->seller_user_type === $userType
        ) {
            return response()->json(['error' => 'لا يمكن للبائع المشاركة في مزاد سيارته'], 403);
        }

        $depositAmount = $auction->car->deposit_amount ?? 0;

        // Log deposit info for debugging (only in non-production)
        if (config('app.debug')) {
            \Log::debug("Auction registration attempt", [
                'auction_id' => $auction->id,
                'user_id' => $profile->id,
                'user_type' => $userType,
                'deposit_amount' => $depositAmount,
            ]);
        }

        // Check wallet balance if deposit required
        if ($depositAmount > 0) {
            $totalHolds = UserWalletHold::where('user_id', $profile->id)
                ->where('user_type', $userType)
                ->validHolds()
                ->sum('amount');

            $availableBalance = $profile->wallet_balance - $totalHolds;

            if (config('app.debug')) {
                \Log::debug("Deposit check", compact('totalHolds', 'availableBalance', 'depositAmount'));
            }

            if ($availableBalance < $depositAmount) {
                return response()->json([
                    'error' => 'رصيد المحفظة غير كافي للتأمين',
                    'required' => $depositAmount,
                    'available' => $availableBalance,
                ], 400);
            }
        }

        DB::transaction(function () use ($auction, $profile, $userType, $user, $depositAmount, &$registration) {
            $walletHoldId = null;

            // FIXED: Create wallet hold using $profile->id, not $user->id
            if ($depositAmount > 0) {
                $walletHold = UserWalletHold::create([
                    'user_id' => $profile->id,
                    'user_type' => $userType,
                    'amount' => $depositAmount,
                    'reason' => 'تأمين المزاد: ' . $auction->title,
                    'reference_type' => 'auction',
                    'reference_id' => $auction->id,
                    'status' => 'active',
                    'expires_at' => $auction->scheduled_end->addDays(3),
                ]);
                $walletHoldId = $walletHold->id;

                // Add to wallet history (transaction record for hold)
                UserTransaction::create([
                    'user_id' => $profile->id,
                    'user_type' => $userType,
                    'type' => 'hold',
                    'amount' => $depositAmount,
                    'description' => 'تجميد تأمين المزاد: ' . $auction->title,
                    'reference_type' => 'wallet_hold',
                    'reference_id' => $walletHold->id,
                    'balance_after' => $profile->wallet_balance, // Balance unchanged, just held
                ]);

                \Log::debug("Wallet hold created", ['hold_id' => $walletHoldId, 'amount' => $depositAmount]);
            }

            // Create registration
            $registration = AuctionRegistration::create([
                'auction_id' => $auction->id,
                'user_id' => $profile->id,
                'user_type' => $userType,
                'user_name' => $profile->name,
                'user_phone' => $user->phone,
                'deposit_amount' => $depositAmount,
                'wallet_hold_id' => $walletHoldId,
                'status' => 'registered',
                'registered_at' => now(),
            ]);

            \Log::debug("Registration created", ['id' => $registration->id, 'hold_id' => $walletHoldId]);

            // Create notification
            $notification = Notification::create([
                'user_id' => $user->id,
                'title' => 'تم التسجيل في المزاد',
                'message' => 'تم تسجيلك بنجاح في مزاد: ' . $auction->title,
                'type' => 'AUCTION_REGISTRATION',
                'data' => json_encode(['auction_id' => $auction->id]),
                'read' => false,
            ]);

            event(new UserNotification($user->id, $notification->toArray()));
        });

        return response()->json([
            'message' => 'تم التسجيل بنجاح',
            'registration' => $registration,
        ]);
    }

    /**
     * Set reminder for auction
     */
    public function setReminder(Request $request, $id)
    {
        $request->validate([
            'minutes_before' => 'sometimes|integer|in:15,30,60',
            'channels' => 'sometimes|array',
        ]);

        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        $auction = Auction::findOrFail($id);

        // Check auction is upcoming
        if (!in_array($auction->status, ['scheduled'])) {
            return response()->json(['error' => 'لا يمكن تعيين تذكير لهذا المزاد'], 400);
        }

        // Check not already has reminder
        $existingReminder = AuctionReminder::where('auction_id', $auction->id)
            ->where('user_id', $profile->id)
            ->where('user_type', $userType)
            ->first();

        if ($existingReminder) {
            // Update existing
            $minutesBefore = $request->get('minutes_before', 30);
            $existingReminder->update([
                'remind_minutes_before' => $minutesBefore,
                'remind_at' => AuctionReminder::calculateRemindAt($auction->scheduled_start, $minutesBefore),
                'channels' => $request->get('channels', ['push']),
            ]);

            return response()->json([
                'message' => 'تم تحديث التذكير',
                'reminder' => $existingReminder,
            ]);
        }

        // Create new reminder
        $minutesBefore = $request->get('minutes_before', 30);
        $reminder = AuctionReminder::create([
            'auction_id' => $auction->id,
            'user_id' => $profile->id,
            'user_type' => $userType,
            'remind_minutes_before' => $minutesBefore,
            'remind_at' => AuctionReminder::calculateRemindAt($auction->scheduled_start, $minutesBefore),
            'channels' => $request->get('channels', ['push']),
        ]);

        return response()->json([
            'message' => 'تم تعيين التذكير',
            'reminder' => $reminder,
        ]);
    }

    /**
     * Cancel reminder
     */
    public function cancelReminder(Request $request, $id)
    {
        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        $deleted = AuctionReminder::where('auction_id', $id)
            ->where('user_id', $profile->id)
            ->where('user_type', $userType)
            ->delete();

        if (!$deleted) {
            return response()->json(['error' => 'لا يوجد تذكير لإلغائه'], 404);
        }

        return response()->json(['message' => 'تم إلغاء التذكير']);
    }

    /**
     * Get user's registered auctions
     */
    public function myAuctions(Request $request)
    {
        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        $registrations = AuctionRegistration::with(['auction.car'])
            ->where('user_id', $profile->id)
            ->where('user_type', $userType)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($registrations);
    }

    /**
     * Pay for won auction - Informs winner about offline payment process
     * Payment happens at company, not from wallet
     */
    public function pay(Request $request, $id)
    {
        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        $auction = Auction::with(['car', 'winner'])->findOrFail($id);

        // Verify winner
        if ($auction->winner_id != $profile->id || $auction->winner_type != $userType) {
            return response()->json(['error' => 'لست الفائز في هذا المزاد'], 403);
        }

        // Verify payment status
        if ($auction->payment_status === 'paid' || $auction->status === 'completed') {
            return response()->json(['error' => 'تم الدفع مسبقاً'], 400);
        }

        // Return payment instructions (offline payment at company)
        return response()->json([
            'message' => 'سيتم التواصل معك من قبل الإدارة لإتمام عملية الشراء في الشركة',
            'instructions' => [
                'step1' => 'انتظر اتصال الإدارة',
                'step2' => 'توجه للشركة لإتمام الدفع',
                'step3' => 'إحضار هويتك ومبلغ الشراء',
            ],
            'final_price' => $auction->final_price,
            'payment_deadline' => $auction->payment_deadline,
            'auction' => $auction,
        ]);
    }

    /**
     * Check and update auction status (manually triggered when timer ends)
     */
    public function checkStatus($id)
    {
        $auction = Auction::findOrFail($id);

        // If auction is live/extended and passed end time, end it immediately
        if (in_array($auction->status, ['live', 'extended']) && $auction->scheduled_end <= now()) {
            try {
                // Use the service to end it properly
                $auctionService = app(\App\Services\AuctionService::class);
                $auctionService->endAuction($auction);

                // Refresh to get updated data
                $auction->refresh();
            } catch (\Exception $e) {
                \Log::error("Failed to force end auction {$id}: " . $e->getMessage());
            }
        }

        return response()->json([
            'status' => $auction->status,
            'is_live' => $auction->is_live,
            'has_ended' => $auction->has_ended,
            'auction' => $auction
        ]);
    }
}
