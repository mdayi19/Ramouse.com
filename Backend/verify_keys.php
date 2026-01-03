<?php

require __DIR__ . '/vendor/autoload.php';

use Minishlink\WebPush\Vapid;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 Autoloading Debug:\n";
$loader = require __DIR__ . '/vendor/autoload.php';
$prefixes = $loader->getPrefixesPsr4();
if (isset($prefixes['Minishlink\\WebPush\\'])) {
    echo "✅ Namespace 'Minishlink\\WebPush\\' is registered to: " . implode(', ', $prefixes['Minishlink\\WebPush\\']) . "\n";
} else {
    echo "❌ Namespace 'Minishlink\\WebPush\\' IS NOT REGISTERED.\n";
}

if (class_exists('Minishlink\WebPush\Vapid')) {
    echo "✅ Class 'Minishlink\WebPush\Vapid' exists.\n";
} else {
    echo "❌ Class 'Minishlink\WebPush\Vapid' DOES NOT EXIST.\n";
}
echo "--------------------------------------------------\n";

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

    echo "\n🔍 Checking PHP Extensions for Web Push:\n";
    $extensions = ['gmp', 'bcmath', 'curl', 'openssl', 'mbstring'];
    foreach ($extensions as $ext) {
        if (extension_loaded($ext)) {
            echo "✅ Extension '$ext' is loaded.\n";
        } else {
            echo "⚠️ [WARNING] Extension '$ext' is MISSING. (WebPush may fallback or fail)\n";
        }
    }

} catch (\Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}
