<?php

namespace App\Jobs;

use App\Models\InternationalLicenseRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class VerifyManualPaymentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public InternationalLicenseRequest $licenseRequest)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Logic to verify manual payment
        // For now, we might just log it or send a notification to admin
        // e.g. Notification::send($admins, new ManualPaymentSubmitted($this->licenseRequest));

        // Example: Log for now
        \Log::info("Manual payment verification required for Order: {$this->licenseRequest->order_number}");
    }
}
