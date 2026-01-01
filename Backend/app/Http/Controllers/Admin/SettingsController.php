<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SystemSettings;

class SettingsController extends Controller
{
    public function getSettings()
    {
        // Return all settings as a single JSON object using the model's getAllFlat method
        $settings = SystemSettings::getAllFlat();

        // Ensure limitSettings includes the latest international_license_settings
        if (isset($settings['limitSettings']) && isset($settings['international_license_settings'])) {
            $settings['limitSettings']['international_license_settings'] = $settings['international_license_settings'];
        }

        // Inject WhatsApp Env Status
        $settings['whatsapp_env_status'] = [
            'has_env_keys' => !empty(env('WHATSAPP_APP_KEY')) && !empty(env('WHATSAPP_AUTH_KEY')),
            'env_app_key_preview' => \Illuminate\Support\Str::mask(env('WHATSAPP_APP_KEY'), '*', 4, -4),
        ];

        // Inject Default Message Templates from Lang file
        $settings['default_message_templates'] = [
            'otp' => __('notifications.otp_message'),
            'welcome' => __('notifications.welcome_message'),
            'new_order' => __('notifications.new_order'),
            'quote_received' => __('notifications.quote_received'),
            'status_update' => __('notifications.order_status_update'),
            'store_confirmation' => __('notifications.store_order_confirmation'),
        ];

        return response()->json($settings);
    }

    public function updateSettings(Request $request)
    {
        $data = $request->all();

        foreach ($data as $key => $value) {
            // Handle seoSettings specially for image uploads
            if ($key === 'seoSettings' && is_array($value)) {
                // Handle ogImage base64 upload
                if (isset($value['ogImage']) && $this->isBase64Image($value['ogImage'])) {
                    $value['ogImage'] = $this->saveBase64Image($value['ogImage'], 'seo');
                }

                // Handle twitterImage base64 upload
                if (isset($value['twitterImage']) && $this->isBase64Image($value['twitterImage'])) {
                    $value['twitterImage'] = $this->saveBase64Image($value['twitterImage'], 'seo');
                }
            }

            // Special handling for limitSettings to extract international_license_settings
            if ($key === 'limitSettings' && is_array($value)) {
                if (isset($value['international_license_settings'])) {
                    // Save international_license_settings to its own key
                    SystemSettings::setSetting('international_license_settings', $value['international_license_settings']);

                    // Sync legacy keys for backward compatibility
                    if (isset($value['international_license_settings']['syrian_price'])) {
                        SystemSettings::setSetting('international_license_syrian_price', $value['international_license_settings']['syrian_price']);
                    }
                    if (isset($value['international_license_settings']['non_syrian_price'])) {
                        SystemSettings::setSetting('international_license_non_syrian_price', $value['international_license_settings']['non_syrian_price']);
                    }

                    // Optional: You can remove it from limitSettings if you don't want duplication
                    // or keep it. Let's keep it in limitSettings for now if the frontend expects it there on reload
                    // but the source of truth for the API will be the separate key.
                    // Actually, to ensure consistency, let's just save it.
                }
            }

            // Use the model's setSetting method
            SystemSettings::setSetting($key, $value);
        }

        // Return updated settings
        $settings = SystemSettings::getAllFlat();

        return response()->json([
            'success' => true,
            'settings' => $settings
        ]);
    }

    /**
     * Check if a string is a base64 encoded image
     */
    private function isBase64Image($string)
    {
        if (!is_string($string)) {
            return false;
        }

        return preg_match('/^data:image\/(\w+);base64,/', $string);
    }

    /**
     * Save a base64 encoded image to storage
     */
    private function saveBase64Image($base64String, $folder = 'uploads')
    {
        // Check if it's a base64 string
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
            return $base64String; // Return as-is if not base64
        }

        // Extract base64 data
        $imageData = substr($base64String, strpos($base64String, ',') + 1);
        $type = strtolower($type[1]); // jpg, png, gif

        // Decode base64
        $imageData = base64_decode($imageData);

        if ($imageData === false) {
            return $base64String; // Return original on decode failure
        }

        // Generate unique filename
        $filename = $folder . '/' . \Illuminate\Support\Str::uuid() . '.' . $type;

        // Save to storage/app/public
        \Illuminate\Support\Facades\Storage::disk('public')->put($filename, $imageData);

        // Return storage URL
        return '/storage/' . $filename;
    }
}

