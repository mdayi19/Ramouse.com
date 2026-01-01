<?php

namespace App\Notifications;

use App\Models\InternationalLicenseRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class InternationalLicenseNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The international license request instance.
     */
    public InternationalLicenseRequest $request;

    /**
     * The type of notification (new, reupload, status_changed, created).
     */
    public string $type;

    /**
     * The old status (for status_changed type).
     */
    public ?string $oldStatus;

    /**
     * Create a new notification instance.
     */
    public function __construct(InternationalLicenseRequest $request, string $type = 'new', ?string $oldStatus = null)
    {
        $this->request = $request;
        $this->type = $type;
        $this->oldStatus = $oldStatus;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['broadcast'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $data = [
            'request_id' => $this->request->id,
            'order_number' => $this->request->order_number,
            'full_name' => $this->request->full_name,
            'status' => $this->request->status,
            'type' => $this->type,
        ];

        // Build notification message based on type
        $message = $this->buildNotificationMessage($notifiable);
        $data['message'] = $message['message'];
        $data['title'] = $message['title'];
        $data['action_url'] = $message['action_url'];

        if ($this->type === 'status_changed' && $this->oldStatus) {
            $data['old_status'] = $this->oldStatus;
        }

        return $data;
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    /**
     * Build notification message based on type and recipient.
     */
    private function buildNotificationMessage(object $notifiable): array
    {
        $isAdmin = $notifiable->role === 'admin';

        return match ($this->type) {
            'new' => [
                'title' => $isAdmin ? 'طلب رخصة دولية جديد' : 'تم استلام طلبك',
                'message' => $isAdmin
                    ? "طلب رخصة دولية جديد من {$this->request->full_name} - رقم الطلب: {$this->request->order_number}"
                    : "تم استلام طلبك بنجاح. رقم الطلب: {$this->request->order_number}",
                'action_url' => $isAdmin
                    ? '/admin/international-licenses'
                    : '/dashboard/international-license',
            ],
            'reupload' => [
                'title' => 'إعادة رفع المستندات',
                'message' => $isAdmin
                    ? "تم إعادة رفع المستندات للطلب رقم: {$this->request->order_number}"
                    : "تم إعادة رفع المستندات بنجاح. جاري المراجعة.",
                'action_url' => $isAdmin
                    ? '/admin/international-licenses'
                    : '/dashboard/international-license',
            ],
            'status_changed' => [
                'title' => 'تحديث حالة الطلب',
                'message' => $this->getStatusChangeMessage(),
                'action_url' => $isAdmin
                    ? '/admin/international-licenses'
                    : '/dashboard/international-license',
            ],
            'created' => [
                'title' => 'تم إنشاء الطلب',
                'message' => "تم إنشاء طلبك بنجاح. رقم الطلب: {$this->request->order_number}",
                'action_url' => '/dashboard/international-license',
            ],
            default => [
                'title' => 'إشعار رخصة دولية',
                'message' => "تحديث على طلب الرخصة الدولية رقم: {$this->request->order_number}",
                'action_url' => '/dashboard/international-license',
            ],
        };
    }

    /**
     * Get status change message in Arabic.
     */
    private function getStatusChangeMessage(): string
    {
        $statusMessages = [
            'pending' => 'قيد الانتظار',
            'payment_check' => 'جاري التحقق من الدفع',
            'documents_check' => 'جاري مراجعة المستندات',
            'in_work' => 'قيد العمل',
            'ready_to_handle' => 'جاهزة للاستلام',
            'rejected' => 'مرفوض',
        ];

        $newStatusText = $statusMessages[$this->request->status] ?? $this->request->status;
        $message = "تم تحديث حالة طلب الرخصة الدولية رقم {$this->request->order_number} إلى: {$newStatusText}";

        if ($this->request->status === 'rejected' && $this->request->admin_note) {
            $message .= "\n\nسبب الرفض: {$this->request->admin_note}";
        }

        return $message;
    }
}
