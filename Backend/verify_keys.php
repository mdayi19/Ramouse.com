<?php

require __DIR__ . '/vendor/autoload.php';

use Minishlink\WebPush\Vapid;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$publicKey = env('VAPID_PUBLIC_KEY');
$privateKey = env('VAPID_PRIVATE_KEY');

echo "🔍 Verifying VAPID Keys...\n";
echo "Public: " . substr($publicKey, 0, 10) . "...\n";
echo "Private: " . substr($privateKey, 0, 10) . "...\n";

try {
    $valid = Vapid::validate([
        'publicKey' => $publicKey,
        'privateKey' => $privateKey,
        'subject' => env('VAPID_SUBJECT')
    ]);

    // Check if derived public key matches
    $derivedPublic = Vapid::computePublicKey($privateKey);

    // Normalize both keys to remove padding/format diffs if any
    $cleanPublic = str_replace(['=', '+', '/'], ['', '-', '_'], $publicKey);
    $cleanDerived = str_replace(['=', '+', '/'], ['', '-', '_'], $derivedPublic);

    if ($cleanPublic === $cleanDerived) {
        echo "✅ SUCCESS: Private Key generates the configured Public Key correctly.\n";
    } else {
        echo "❌ FAILURE: Mismatch!\n";
        echo "Derived Public from Private Key: " . $derivedPublic . "\n";
        echo "Configured Public Key:         " . $publicKey . "\n";
    }

} catch (\Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}
