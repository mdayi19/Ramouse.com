<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Updating token 90...\n";
$result = DB::statement("UPDATE personal_access_tokens SET tokenable_id = '+905308400480' WHERE id = 90");
echo "Update result: " . ($result ? 'success' : 'failed') . "\n\n";

echo "Checking token 90 after update:\n";
$token = DB::selectOne("SELECT tokenable_id FROM personal_access_tokens WHERE id = 90");
echo "Tokenable ID: '{$token->tokenable_id}'\n";
echo "Length: " . strlen($token->tokenable_id) . "\n";
