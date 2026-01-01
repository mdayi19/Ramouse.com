<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Checking latest token:\n";
$token = DB::select("SELECT id, tokenable_type, tokenable_id, name FROM personal_access_tokens ORDER BY id DESC LIMIT 1");
if ($token) {
    $t = $token[0];
    echo "ID: {$t->id}\n";
    echo "Type: {$t->tokenable_type}\n";
    echo "Tokenable ID: '{$t->tokenable_id}'\n";
    echo "Length: " . strlen($t->tokenable_id) . "\n";
    if (strlen($t->tokenable_id) > 0) {
        echo "First char: '{$t->tokenable_id[0]}'\n";
        echo "Starts with +: " . (str_starts_with($t->tokenable_id, '+') ? 'YES' : 'NO') . "\n";
    }
    echo "Name: {$t->name}\n";
}
