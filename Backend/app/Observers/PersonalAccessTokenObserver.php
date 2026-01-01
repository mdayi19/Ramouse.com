<?php

namespace App\Observers;

use Laravel\Sanctum\PersonalAccessToken;

class PersonalAccessTokenObserver
{
    /**
     * Handle the PersonalAccessToken "created" event.
     */
    public function created(PersonalAccessToken $token): void
    {
        // Fix tokenable_id for models with phone numbers (starting with + sign issues)
        if (
            in_array($token->tokenable_type, [
                'App\\Models\\Customer',
                'App\\Models\\Provider',
                'App\\Models\\Technician',
                'App\\Models\\TowTruck'
            ])
        ) {
            // If tokenable_id doesn't start with + but should (phone numbers)
            if ($token->tokenable_id && !str_starts_with($token->tokenable_id, '+')) {
                // Try to find the actual model
                $modelClass = $token->tokenable_type;
                $model = $modelClass::where('id', '+' . $token->tokenable_id)
                    ->orWhere('id', $token->tokenable_id)
                    ->first();

                if ($model && str_starts_with($model->id, '+')) {
                    // Update the tokenable_id with the correct format
                    $token->tokenable_id = $model->id;
                    $token->saveQuietly(); // Save without triggering events again
                }
            }
        }
    }
}
