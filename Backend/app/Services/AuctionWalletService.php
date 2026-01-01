<?php

namespace App\Services;

use App\Models\Auction;
use App\Models\Customer;
use App\Models\Technician;
use App\Models\TowTruck;
use App\Models\UserTransaction;
use App\Models\UserWalletHold;
use Illuminate\Support\Facades\DB;

class AuctionWalletService
{
    /**
     * Charge winner for auction final price
     */
    public function chargeWinner(Auction $auction): bool
    {
        return DB::transaction(function () use ($auction) {
            // 1. Get winner's profile and wallet
            $winner = $this->getWinnerProfile($auction);

            if (!$winner) {
                throw new \Exception('Winner profile not found');
            }

            // 2. Validate balance (including active holds)
            $availableBalance = $this->getAvailableBalance($winner, $auction->winner_type);

            if ($availableBalance < $auction->final_price) {
                throw new \Exception('Insufficient balance. Required: ' . $auction->final_price . ', Available: ' . $availableBalance);
            }

            // 3. Deduct final price from winner
            $winner->wallet_balance -= $auction->final_price;
            $winner->save();

            // 4. Create debit transaction
            UserTransaction::create([
                'user_id' => $winner->id,
                'user_type' => $auction->winner_type,
                'type' => 'debit',
                'amount' => $auction->final_price,
                'description' => 'دفع مزاد: ' . $auction->title,
                'reference_type' => 'auction_payment',
                'reference_id' => $auction->id,
                'balance_after' => $winner->wallet_balance,
            ]);

            // 5. Calculate net amount after commission
            $netAmount = $auction->final_price;

            if ($auction->commission_amount && $auction->commission_amount > 0) {
                $netAmount -= $auction->commission_amount;

                // Commission stays with system/admin - no need to credit
                // Can be tracked via transactions table
            }

            // 6. Credit seller if user-submitted car
            if ($auction->car->seller_type === 'user' && $auction->car->seller_id) {
                $this->creditSeller($auction, $netAmount);
            }
            // If seller_type is 'admin', money stays in system

            // 7. Release winner's deposit hold
            $winnerReg = $auction->registrations()
                ->where('status', 'winner')
                ->first();

            if ($winnerReg && $winnerReg->wallet_hold_id) {
                $hold = UserWalletHold::find($winnerReg->wallet_hold_id);
                if ($hold) {
                    $hold->update(['status' => 'released']);
                }
            }

            return true;
        });
    }

    /**
     * Get winner's profile
     */
    private function getWinnerProfile(Auction $auction)
    {
        switch ($auction->winner_type) {
            case 'customer':
                return Customer::find($auction->winner_id);
            case 'technician':
                return Technician::find($auction->winner_id);
            case 'tow_truck':
                return TowTruck::find($auction->winner_id);
        }
        return null;
    }

    /**
     * Get seller's profile
     */
    private function getSellerProfile($car)
    {
        if ($car->seller_type !== 'user' || !$car->seller_id) {
            return null;
        }

        switch ($car->seller_user_type) {
            case 'customer':
                return Customer::find($car->seller_id);
            case 'technician':
                return Technician::find($car->seller_id);
            case 'tow_truck':
                return TowTruck::find($car->seller_id);
        }
        return null;
    }

    /**
     * Get available balance (balance - active holds)
     */
    public function getAvailableBalance($profile, string $userType): float
    {
        $holds = UserWalletHold::where('user_id', $profile->id)
            ->where('user_type', $userType)
            ->where('status', 'active')
            ->sum('amount');

        return $profile->wallet_balance - $holds;
    }

    /**
     * Credit seller with auction proceeds
     */
    private function creditSeller(Auction $auction, float $amount): void
    {
        $seller = $this->getSellerProfile($auction->car);

        if (!$seller) {
            return;
        }

        $seller->wallet_balance += $amount;
        $seller->save();

        UserTransaction::create([
            'user_id' => $seller->id,
            'user_type' => $auction->car->seller_user_type,
            'type' => 'credit',
            'amount' => $amount,
            'description' => 'مبيعات مزاد: ' . $auction->title,
            'reference_type' => 'auction_sale',
            'reference_id' => $auction->id,
            'balance_after' => $seller->wallet_balance,
        ]);
    }

    /**
     * Forfeit deposit and deduct from wallet
     */
    public function forfeitDeposit(Auction $auction, $registration): bool
    {
        if (!$registration->wallet_hold_id) {
            return false;
        }

        $hold = UserWalletHold::find($registration->wallet_hold_id);

        if (!$hold || $hold->status !== 'active') {
            return false;
        }

        return DB::transaction(function () use ($hold, $registration, $auction) {
            // Get user profile
            $profile = $this->getProfileById($registration->user_id, $registration->user_type);

            if (!$profile) {
                return false;
            }

            // Deduct deposit from wallet
            $profile->wallet_balance -= $hold->amount;
            $profile->save();

            // Create debit transaction
            UserTransaction::create([
                'user_id' => $profile->id,
                'user_type' => $registration->user_type,
                'type' => 'debit',
                'amount' => $hold->amount,
                'description' => 'مصادرة تأمين المزاد: ' . $auction->title,
                'reference_type' => 'deposit_forfeiture',
                'reference_id' => $auction->id,
                'balance_after' => $profile->wallet_balance,
            ]);

            // Mark hold as forfeited
            $hold->update(['status' => 'forfeited']);

            // Update registration status
            $registration->update(['status' => 'deposit_forfeited']);

            return true;
        });
    }

    /**
     * Get profile by ID and type
     */
    private function getProfileById($userId, $userType)
    {
        switch ($userType) {
            case 'customer':
                return Customer::find($userId);
            case 'technician':
                return Technician::find($userId);
            case 'tow_truck':
                return TowTruck::find($userId);
        }
        return null;
    }
}
