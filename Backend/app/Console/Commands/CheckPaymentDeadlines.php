<?php

namespace App\Console\Commands;

use App\Models\Auction;
use App\Models\AuctionBid;
use App\Models\Notification;
use App\Events\UserNotification;
use App\Services\AuctionWalletService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckPaymentDeadlines extends Command
{
    protected $signature = 'auction:check-payment-deadlines';
    protected $description = 'Check and process payment deadlines for ended auctions';

    public function handle(): int
    {
        $overdueAuctions = Auction::where('status', 'ended')
            ->where('payment_status', 'awaiting_payment')
            ->where('payment_deadline', '<', now())
            ->whereNotNull('winner_id')
            ->get();

        $this->info("Found {$overdueAuctions->count()} overdue auctions");

        foreach ($overdueAuctions as $auction) {
            try {
                DB::transaction(function () use ($auction) {
                    $this->processOverdueAuction($auction);
                });

                $this->info("✓ Processed auction: {$auction->title}");
                Log::info("Processed overdue payment for auction {$auction->id}");
            } catch (\Exception $e) {
                $this->error("✗ Failed to process auction {$auction->id}: " . $e->getMessage());
                Log::error("Failed to process overdue auction {$auction->id}: " . $e->getMessage());
            }
        }

        return Command::SUCCESS;
    }

    private function processOverdueAuction(Auction $auction)
    {
        // Step 1: Forfeit winner's deposit
        $this->forfeitWinnerDeposit($auction);

        // Step 2: Try to offer to second-highest bidder
        $secondChanceOffered = $this->offerToSecondBidder($auction);

        if (!$secondChanceOffered) {
            // No second bidder - mark as unsold
            $auction->update([
                'status' => 'ended',
                'payment_status' => 'cancelled',
                'winner_id' => null,
                'winner_type' => null,
                'winner_name' => null,
                'final_price' => null,
            ]);

            $auction->car->update(['status' => 'unsold']);

            // Release all remaining deposits
            $this->releaseAllDeposits($auction);
        }
    }

    private function forfeitWinnerDeposit(Auction $auction): void
    {
        $winnerReg = $auction->registrations()
            ->where('status', 'winner')
            ->first();

        if (!$winnerReg) {
            return;
        }

        $walletService = new AuctionWalletService();
        $forfeited = $walletService->forfeitDeposit($auction, $winnerReg);

        if ($forfeited) {
            $this->info("  → Forfeited deposit for winner");

            // Notify winner
            $this->notifyUser(
                $winnerReg->user_id,
                'مصادرة التأمين',
                'تم مصادرة تأمين المزاد بسبب عدم الدفع خلال المهلة المحددة: ' . $auction->title,
                'AUCTION_DEPOSIT_FORFEITED',
                $auction->id
            );
        }
    }

    private function offerToSecondBidder(Auction $auction): bool
    {
        // Get second-highest valid/outbid bid
        $secondBid = $auction->bids()
            ->whereIn('status', ['valid', 'outbid'])
            ->where('user_id', '!=', $auction->winner_id) // Not the original winner
            ->orderBy('amount', 'desc')
            ->first();

        if (!$secondBid) {
            return false;
        }

        // Check if reserve price is still met
        $car = $auction->car;
        $reserveMet = !$car->reserve_price || $secondBid->amount >= $car->reserve_price;

        if (!$reserveMet) {
            $this->info("  → Second bid doesn't meet reserve price");
            return false;
        }

        // Update auction with new winner
        $auction->update([
            'winner_id' => $secondBid->user_id,
            'winner_type' => $secondBid->user_type,
            'winner_name' => $secondBid->bidder_name,
            'winner_phone' => $secondBid->bidder_phone,
            'final_price' => $secondBid->amount,
            'payment_status' => 'awaiting_payment',
            'payment_deadline' => now()->addDays(2), // Shorter deadline for second chance
        ]);

        // Mark new winning bid
        $secondBid->update(['status' => 'winning']);

        // Update registration status
        $newWinnerReg = $auction->registrations()
            ->where('user_id', $secondBid->user_id)
            ->where('user_type', $secondBid->user_type)
            ->first();

        if ($newWinnerReg) {
            $newWinnerReg->update(['status' => 'winner']);
        }

        $this->info("  → Offered to second bidder: {$secondBid->bidder_name}");

        // Notify new winner
        $this->notifyUser(
            $secondBid->user_id,
            'فرصة ثانية للفوز! 🎉',
            "الفائز الأول لم يدفع. أصبحت الفائز في المزاد: {$auction->title}. المبلغ: {$secondBid->amount}$. يجب الدفع خلال يومين.",
            'AUCTION_SECOND_CHANCE',
            $auction->id
        );

        return true;
    }

    private function releaseAllDeposits(Auction $auction): void
    {
        $registrations = $auction->registrations()
            ->whereNotNull('wallet_hold_id')
            ->whereIn('status', ['registered', 'participated'])
            ->get();

        foreach ($registrations as $registration) {
            if ($registration->walletHold && $registration->walletHold->status === 'active') {
                $registration->walletHold->update(['status' => 'released']);
                $registration->update([
                    'status' => 'deposit_released',
                    'deposit_released_at' => now(),
                ]);
            }
        }

        $this->info("  → Released all remaining deposits");
    }

    private function notifyUser($userId, $title, $message, $type, $auctionId): void
    {
        $notification = Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'data' => json_encode(['auction_id' => $auctionId]),
            'read' => false,
        ]);

        event(new UserNotification($userId, $notification->toArray()));
    }
}
