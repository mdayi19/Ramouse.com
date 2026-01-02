<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\AuctionCar;
use App\Models\AuctionBid;
use App\Models\AuctionRegistration;
use App\Models\AuctionReminder;
use App\Models\Notification;
use App\Events\AuctionCreated; // [NEW]
use App\Events\AuctionStarted;
use App\Events\AuctionEnded;
use App\Events\AdminDashboardEvent; // [NEW]
use App\Events\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AuctionManagementController extends Controller
{
    // ========================
    // AUCTION CARS MANAGEMENT
    // ========================

    /**
     * List all auction cars
     */
    public function listCars(Request $request)
    {
        $query = AuctionCar::with('auction');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by seller type
        if ($request->has('seller_type')) {
            $query->where('seller_type', $request->seller_type);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('vin', 'like', "%{$search}%");
            });
        }

        $cars = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($cars);
    }

    /**
     * Create or update auction car
     */
    public function saveCar(Request $request, $id = null)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'condition' => 'required|in:new,used',
            'brand' => 'nullable|string',
            'model' => 'nullable|string',
            'year' => 'nullable|integer|min:1900|max:2100',
            'starting_price' => 'required|numeric|min:1',
            'deposit_amount' => 'nullable|numeric|min:0',
            'media' => 'nullable|array',
        ]);

        $data = $request->only([
            'title',
            'description',
            'condition',
            'brand',
            'model',
            'body_type',
            'year',
            'vin',
            'mileage',
            'engine_type',
            'transmission',
            'fuel_type',
            'exterior_color',
            'interior_color',
            'features',
            'media',
            'location',
            'starting_price',
            'reserve_price',
            'buy_now_price',
            'deposit_amount',
            'admin_notes'
        ]);

        // Admin seller
        $data['seller_type'] = 'admin';
        $data['status'] = $request->get('status', 'draft');

        try {
            DB::beginTransaction();

            if ($id) {
                $car = AuctionCar::findOrFail($id);
                $car->update($data);
                $message = 'تم تحديث السيارة بنجاح';
            } else {
                $car = AuctionCar::create($data);
                $car->refresh(); // Ensure UUID and timestamps are populated
                $message = 'تم إضافة السيارة بنجاح';
            }

            DB::commit();

            // Notify admin dashboard about cars update
            event(new AdminDashboardEvent('car.updated', []));
            event(new AdminDashboardEvent('auction.stats_updated', $this->getStatsData()));

            return response()->json([
                'success' => true,
                'message' => $message,
                'id' => $car->id, // Explicitly return ID at root level for frontend
                'car' => $car,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error saving auction car: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء حفظ السيارة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete auction car
     */
    public function deleteCar($id)
    {
        $car = AuctionCar::findOrFail($id);

        // Check if has active auction
        if ($car->auction && in_array($car->auction->status, ['live', 'extended'])) {
            return response()->json(['error' => 'لا يمكن حذف سيارة في مزاد نشط'], 400);
        }

        $car->delete();

        // Notify admin dashboard
        event(new AdminDashboardEvent('car.updated', []));
        event(new AdminDashboardEvent('auction.stats_updated', $this->getStatsData()));

        return response()->json(['message' => 'تم حذف السيارة بنجاح']);
    }

    /**
     * Approve user-submitted car
     */
    public function approveCar(Request $request, $id)
    {
        $car = AuctionCar::findOrFail($id);

        if ($car->status !== 'pending_approval') {
            return response()->json(['error' => 'السيارة ليست بانتظار الموافقة'], 400);
        }

        $car->update([
            'status' => 'approved',
            'admin_notes' => $request->get('admin_notes'),
        ]);

        // Notify seller
        if ($car->seller_id) {
            $notification = Notification::create([
                'user_id' => $car->seller_id,
                'title' => 'تمت الموافقة على سيارتك',
                'message' => 'تمت الموافقة على سيارتك: ' . $car->title . ' ويمكن الآن إدراجها في المزاد',
                'type' => 'CAR_APPROVED',
                'read' => false,
            ]);
        }

        // Notify admin dashboard
        event(new AdminDashboardEvent('car.updated', []));
        event(new AdminDashboardEvent('auction.stats_updated', $this->getStatsData()));

        return response()->json([
            'message' => 'تمت الموافقة على السيارة',
            'car' => $car,
        ]);
    }

    /**
     * Reject user-submitted car
     */
    public function rejectCar(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string',
        ]);

        $car = AuctionCar::findOrFail($id);

        $car->update([
            'status' => 'cancelled',
            'admin_notes' => $request->reason,
        ]);

        // Notify seller
        if ($car->seller_id) {
            $notification = Notification::create([
                'user_id' => $car->seller_id,
                'title' => 'تم رفض سيارتك',
                'message' => 'تم رفض سيارتك: ' . $car->title . '. السبب: ' . $request->reason,
                'type' => 'CAR_REJECTED',
                'read' => false,
            ]);
        }

        return response()->json([
            'message' => 'تم رفض السيارة',
            'car' => $car,
        ]);
    }

    // ========================
    // AUCTIONS MANAGEMENT
    // ========================

    /**
     * List all auctions
     */
    public function listAuctions(Request $request)
    {
        $query = Auction::with(['car', 'winningBid']);

        // Filter by status
        if ($request->has('status')) {
            $status = $request->status;
            if ($status === 'active') {
                $query->whereIn('status', ['scheduled', 'live', 'extended']);
            } else {
                $query->where('status', $status);
            }
        }

        $auctions = $query->orderBy('scheduled_start', 'desc')
            ->paginate($request->get('per_page', 15));

        // Add stats
        $auctions->getCollection()->transform(function ($auction) {
            $auction->participant_count = $auction->registrations()->where('status', 'registered')->count();
            $auction->reminder_count = $auction->reminders()->count();
            return $auction;
        });

        return response()->json($auctions);
    }

    /**
     * Create or update auction
     */
    public function saveAuction(Request $request, $id = null)
    {
        $request->validate([
            'auction_car_id' => 'required|uuid|exists:auction_cars,id',
            'title' => 'required|string|max:255',
            'scheduled_start' => 'required|date|after:now',
            'scheduled_end' => 'required|date|after:scheduled_start',
            'starting_bid' => 'required|numeric|min:1',
            'bid_increment' => 'required|numeric|min:1',
        ]);

        $data = $request->only([
            'auction_car_id',
            'title',
            'description',
            'scheduled_start',
            'scheduled_end',
            'starting_bid',
            'bid_increment',
            'extension_minutes',
            'extension_threshold_seconds',
            'max_extensions',
            'commission_percent',
            'commission_fixed',
        ]);

        // Explicitly parse dates to ensure correct format/timezone handling
        if (isset($data['scheduled_start'])) {
            $data['scheduled_start'] = \Carbon\Carbon::parse($data['scheduled_start']);
        }
        if (isset($data['scheduled_end'])) {
            $data['scheduled_end'] = \Carbon\Carbon::parse($data['scheduled_end']);
        }

        $data['status'] = $request->get('status', 'scheduled');
        $data['created_by'] = $request->user()->id;

        if ($id) {
            $auction = Auction::findOrFail($id);

            // Can't update live auction schedule
            if (in_array($auction->status, ['live', 'extended'])) {
                return response()->json(['error' => 'لا يمكن تعديل مزاد نشط'], 400);
            }

            $auction->update($data);
            $message = 'تم تحديث المزاد بنجاح';
        } else {
            // Check car not already in auction
            $existingAuction = Auction::where('auction_car_id', $data['auction_car_id'])
                ->whereNotIn('status', ['cancelled', 'completed'])
                ->first();

            if ($existingAuction) {
                return response()->json(['error' => 'هذه السيارة مدرجة بالفعل في مزاد'], 400);
            }

            $auction = Auction::create($data);
            $message = 'تم إنشاء المزاد بنجاح';

            // Broadcast new auction to public
            event(new AuctionCreated($auction)); // [NEW]

            // Update car status
            AuctionCar::where('id', $data['auction_car_id'])->update(['status' => 'in_auction']);
        }

        // Notify admin dashboard
        event(new AdminDashboardEvent('auction.created', [
            'auctionId' => $auction->id,
            'title' => $auction->title,
        ]));

        event(new AdminDashboardEvent('auction.stats_updated', $this->getStatsData()));

        return response()->json([
            'message' => $message,
            'auction' => $auction->load('car'),
        ]);
    }

    /**
     * Delete/Cancel auction
     */
    public function deleteAuction($id)
    {
        $auction = Auction::findOrFail($id);

        if (in_array($auction->status, ['live', 'extended'])) {
            return response()->json(['error' => 'لا يمكن حذف مزاد نشط، يمكنك إنهاؤه فقط'], 400);
        }

        // Release all deposits
        $this->releaseAllDeposits($auction);

        // Reset car status
        AuctionCar::where('id', $auction->auction_car_id)->update(['status' => 'approved']);

        $auction->update(['status' => 'cancelled']);

        event(new AdminDashboardEvent('auction.stats_updated', $this->getStatsData()));

        return response()->json(['message' => 'تم إلغاء المزاد بنجاح']);
    }

    /**
     * Manually start auction
     */
    public function startAuction($id)
    {
        $auction = Auction::with('car')->findOrFail($id);

        if ($auction->status !== 'scheduled') {
            return response()->json(['error' => 'المزاد ليس في حالة مجدولة'], 400);
        }

        $auction->start();

        // Broadcast
        event(new AuctionStarted($auction));

        // Notify registered users
        $this->notifyRegisteredUsers($auction, 'بدأ المزاد!', 'مزاد ' . $auction->title . ' قد بدأ الآن!');

        return response()->json([
            'message' => 'تم بدء المزاد',
            'auction' => $auction,
        ]);
    }

    /**
     * Manually end auction
     */
    public function endAuction($id)
    {
        $auction = Auction::with('car')->findOrFail($id);

        if (!in_array($auction->status, ['live', 'extended'])) {
            return response()->json(['error' => 'المزاد ليس نشطاً'], 400);
        }

        $auction->end();

        // Broadcast
        event(new AuctionEnded($auction->fresh()));

        // Release deposits for non-winners
        $this->releaseNonWinnerDeposits($auction);

        // Notify winner
        if ($auction->winner_id) {
            $notification = Notification::create([
                'user_id' => $auction->winner_id,
                'title' => 'مبروك! فزت بالمزاد 🎉',
                'message' => 'لقد فزت بمزاد ' . $auction->title . ' بمبلغ ' . number_format((float) $auction->final_price) . '. سيتم التواصل معك لإتمام عملية الدفع.',
                'type' => 'AUCTION_WON',
                'read' => false,
            ]);

            // Send via WebPush if available
            try {
                event(new UserNotification($auction->winner_id, $notification->toArray()));
            } catch (\Exception $e) {
                \Log::warning('Failed to send winner notification: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'تم إنهاء المزاد',
            'auction' => $auction,
        ]);
    }

    /**
     * Get auction details with all registrations and bids
     * Shows full participant details for admin including phone numbers
     */
    public function getAuctionDetails($id)
    {
        $auction = Auction::with([
            'car',
            'registrations',
            'bids' => function ($q) {
                $q->orderBy('bid_time', 'desc');
            },
            'winningBid',
        ])->findOrFail($id);

        $auction->participant_count = $auction->registrations()->where('status', 'registered')->count();
        $auction->reminder_count = $auction->reminders()->count();

        // Add winner details if auction has ended
        if ($auction->winner_id) {
            $winnerReg = $auction->registrations()
                ->where('user_id', $auction->winner_id)
                ->where('user_type', $auction->winner_type)
                ->first();

            $auction->winner_details = [
                'id' => $auction->winner_id,
                'name' => $auction->winner_name,
                'phone' => $winnerReg?->user_phone ?? $auction->winner_phone,
                'type' => $auction->winner_type,
                'final_price' => $auction->final_price,
                'commission_amount' => $auction->commission_amount,
                'deposit_amount' => $winnerReg?->deposit_amount,
                'deposit_status' => $winnerReg?->status,
                'registered_at' => $winnerReg?->registered_at,
            ];
        }

        return response()->json($auction);
    }

    /**
     * Update payment status for winner
     * Payment happens OFFLINE at company - no wallet deduction
     */
    public function updatePaymentStatus(Request $request, $id)
    {
        $request->validate([
            'payment_status' => 'required|in:pending,awaiting_payment,payment_received,completed,refunded',
            'payment_notes' => 'nullable|string',
        ]);

        $auction = Auction::findOrFail($id);

        // If marking as completed, update status and release deposit
        if ($request->payment_status === 'completed') {
            $auction->update([
                'status' => 'completed',
                'payment_status' => 'completed',
                'payment_notes' => $request->payment_notes,
            ]);

            // Release winner's deposit (payment received offline at company)
            $winnerReg = $auction->registrations()
                ->where('status', 'winner')
                ->first();

            if ($winnerReg) {
                $winnerReg->releaseDeposit();
            }

            // Notify winner
            if ($auction->winner_id) {
                $notification = Notification::create([
                    'user_id' => $auction->winner_id,
                    'title' => 'تم إتمام المزاد ✓',
                    'message' => 'تم استلام الدفع لمزاد: ' . $auction->title . '. شكراً لك!',
                    'type' => 'AUCTION_COMPLETED',
                    'read' => false,
                ]);
                event(new UserNotification($auction->winner_id, $notification->toArray()));
            }

            return response()->json([
                'message' => 'تم إتمام المزاد بنجاح - تم تحرير التأمين',
                'auction' => $auction,
            ]);
        }

        // Handle refund
        if ($request->payment_status === 'refunded') {
            $winnerReg = $auction->registrations()
                ->where('status', 'winner')
                ->first();

            if ($winnerReg) {
                $winnerReg->releaseDeposit();
            }
        }

        // Update status
        $auction->update([
            'payment_status' => $request->payment_status,
            'payment_notes' => $request->payment_notes,
        ]);

        return response()->json([
            'message' => 'تم تحديث حالة الدفع',
            'auction' => $auction,
        ]);
    }

    /**
     * Get auction statistics
     */
    public function getStats()
    {
        return response()->json($this->getStatsData());
    }

    private function getStatsData()
    {
        return [
            'total_cars' => AuctionCar::count(),
            'pending_approval' => AuctionCar::where('status', 'pending_approval')->count(),
            'total_auctions' => Auction::count(),
            'scheduled_auctions' => Auction::where('status', 'scheduled')->count(),
            'live_auctions' => Auction::whereIn('status', ['live', 'extended'])->count(),
            'ended_auctions' => Auction::where('status', 'ended')->count(),
            'completed_auctions' => Auction::where('status', 'completed')->count(),
            'total_bids' => AuctionBid::count(),
            'total_registrations' => AuctionRegistration::count(),
            'total_revenue' => Auction::where('status', 'completed')->sum('commission_amount'),
        ];
    }

    // ========================
    // HELPER METHODS
    // ========================

    private function releaseAllDeposits(Auction $auction)
    {
        $registrations = $auction->registrations()->whereNotNull('wallet_hold_id')->get();

        foreach ($registrations as $registration) {
            $registration->releaseDeposit();
        }
    }

    private function releaseNonWinnerDeposits(Auction $auction)
    {
        $registrations = $auction->registrations()
            ->where('status', 'registered')
            ->whereNotNull('wallet_hold_id')
            ->get();

        foreach ($registrations as $registration) {
            if ($registration->user_id != $auction->winner_id) {
                $registration->markParticipated();
                $registration->releaseDeposit();
            } else {
                $registration->markWinner();
            }
        }
    }

    private function notifyRegisteredUsers(Auction $auction, string $title, string $message)
    {
        $registrations = $auction->registrations()->where('status', 'registered')->get();

        foreach ($registrations as $registration) {
            try {
                $notification = Notification::create([
                    'user_id' => $registration->user_id,
                    'title' => $title,
                    'message' => $message,
                    'type' => 'AUCTION_STARTED',
                    'read' => false,
                ]);

                event(new UserNotification($registration->user_id, $notification->toArray()));
            } catch (\Exception $e) {
                \Log::warning('Failed to notify user: ' . $e->getMessage());
            }
        }
    }

    /**
     * Cancel an auction (including live auctions) - Full admin control
     */
    public function cancelAuction(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $auction = Auction::with('car')->findOrFail($id);

        if (in_array($auction->status, ['cancelled', 'completed'])) {
            return response()->json(['error' => 'لا يمكن إلغاء هذا المزاد'], 400);
        }

        try {
            DB::transaction(function () use ($auction, $request) {
                // Release all deposits
                $this->releaseAllDeposits($auction);

                // Update auction status
                $auction->update([
                    'status' => 'cancelled',
                    'actual_end' => now(),
                    'cancellation_reason' => $request->reason,
                ]);

                // Reset car status
                AuctionCar::where('id', $auction->auction_car_id)->update(['status' => 'approved']);

                // Notify all registered users
                $this->notifyRegisteredUsers(
                    $auction,
                    'تم إلغاء المزاد ⚠️',
                    'تم إلغاء المزاد: ' . $auction->title . '. السبب: ' . $request->reason
                );

                // Broadcast cancellation
                event(new AuctionEnded($auction));
            });

            event(new AdminDashboardEvent('auction.stats_updated', $this->getStatsData()));

            return response()->json([
                'message' => 'تم إلغاء المزاد بنجاح وتم إخطار المشاركين',
                'auction' => $auction->fresh(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to cancel auction: ' . $e->getMessage());
            return response()->json(['error' => 'حدث خطأ أثناء إلغاء المزاد'], 500);
        }
    }

    /**
     * Extend an ongoing auction manually
     */
    public function extendAuction(Request $request, $id)
    {
        $request->validate([
            'minutes' => 'required|integer|min:1|max:1440',
        ]);

        $auction = Auction::findOrFail($id);

        if (!in_array($auction->status, ['live', 'extended'])) {
            return response()->json(['error' => 'المزاد ليس نشطاً'], 400);
        }

        $auction->update([
            'scheduled_end' => $auction->scheduled_end->addMinutes($request->minutes),
            'status' => 'extended',
        ]);

        // Notify registered users
        $this->notifyRegisteredUsers(
            $auction,
            'تم تمديد المزاد ⏰',
            'تم تمديد مزاد ' . $auction->title . ' لمدة ' . $request->minutes . ' دقيقة إضافية.'
        );

        return response()->json([
            'message' => 'تم تمديد المزاد بنجاح',
            'auction' => $auction->fresh(),
        ]);
    }
}
