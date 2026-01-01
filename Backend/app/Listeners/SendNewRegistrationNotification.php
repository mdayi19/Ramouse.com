<?php

namespace App\Listeners;

use App\Events\UserRegistered;
use App\Events\UserNotification;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Str;

class SendNewRegistrationNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(UserRegistered $event): void
    {
        // Get all admin users
        $admins = User::where('is_admin', true)->get();

        if ($admins->isEmpty()) {
            return;
        }

        $userData = $event->userData;
        $userType = $event->userType;

        // Define notification content based on user type
        $title = 'طلب انضمام جديد';
        $message = '';
        $type = 'NEW_PROVIDER_REQUEST'; // Default
        $link = [];

        switch ($userType) {
            case 'technician':
                $title = 'طلب انضمام فني جديد';
                $name = $userData['name'] ?? 'فني';
                $phone = $userData['phone'] ?? '';
                $message = "سجل الفني {$name} ({$phone}) وينتظر المراجعة والتوثيق.";
                $type = 'NEW_TECHNICIAN_REQUEST';
                $link = ['view' => 'adminDashboard', 'params' => ['tab' => 'technicians']];
                break;

            case 'tow_truck':
                $title = 'طلب انضمام سائق سطحة جديد';
                $name = $userData['name'] ?? 'سائق';
                $phone = $userData['phone'] ?? '';
                $message = "سجل {$name} ({$phone}) وينتظر المراجعة والتوثيق.";
                $type = 'NEW_TOW_TRUCK_REQUEST';
                $link = ['view' => 'adminDashboard', 'params' => ['adminView' => 'towTruckManagement']];
                break;

            case 'customer':
                $title = 'مستخدم جديد: عميل';
                $name = $userData['name'] ?? 'عميل';
                $phone = $userData['phone'] ?? '';
                $message = "{$name} ({$phone})";
                $type = 'NEW_PROVIDER_REQUEST';
                $link = ['view' => 'adminDashboard', 'params' => ['tab' => 'users']];
                break;

            case 'provider':
                $title = 'مستخدم جديد: مزود خدمة';
                $name = $userData['name'] ?? 'مزود';
                $phone = $userData['phone'] ?? '';
                $message = "{$name} ({$phone})";
                $type = 'NEW_PROVIDER_REQUEST';
                $link = ['view' => 'adminDashboard', 'params' => ['tab' => 'users']];
                break;
        }

        foreach ($admins as $admin) {
            // 1. Create Database Notification
            $notificationData = [
                'id' => (string) Str::uuid(), // Generate UUID for the notification
                'user_id' => $admin->id, // Admin's User ID
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'link' => $link,
                'read' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            // Use the model to create (ensures correct uuid casting if needed, though we passed string above)
            // But since ID is not auto-incrementing in the model, we can rely on model's HasUuids or pass it manually.
            // Let's rely on create() to handle UUID if the model setup is correct, or pass it if fillable.
            // The model `Notification` has `HasUuids` trait, so we can omit ID usually, but for array broadcasting we might want it consistent.

            $notification = Notification::create([
                'user_id' => $admin->id,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'link' => $link,
                'read' => false,
            ]);

            // 2. Broadcast Real-time event
            // We reuse the UserNotification event which expects the notification data array
            event(new UserNotification($admin->id, $notification->toArray()));
        }
    }
}
