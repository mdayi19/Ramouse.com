<?php

use App\Models\Customer;
use Laravel\Sanctum\PersonalAccessToken;

// Find customer
$customer = Customer::where('id', '+905308400480')->orWhere('id', '905308400480')->first();

if (!$customer) {
    echo "Customer not found\n";
    exit;
}

echo "Customer found: {$customer->name}\n";
echo "Customer ID: {$customer->id}\n";

// Create a test token
$token = $customer->createToken('test_token');
echo "\nToken created: {$token->plainTextToken}\n";

// Try to find the token
$accessToken = PersonalAccessToken::findToken($token->plainTextToken);
if ($accessToken) {
    echo "Token found in database\n";
    echo "Tokenable type: " . get_class($accessToken->tokenable) . "\n";
    echo "Tokenable ID: {$accessToken->tokenable->id}\n";
} else {
    echo "Token NOT found in database\n";
}
