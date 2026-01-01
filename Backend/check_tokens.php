<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Latest 5 tokens:\n";
$tokens = DB::table('personal_access_tokens')
    ->latest()
    ->limit(5)
    ->get(['id', 'tokenable_type', 'tokenable_id', 'name']);

foreach ($tokens as $token) {
    echo "ID: {$token->id}\n";
    echo "Type: {$token->tokenable_type}\n";
    echo "Tokenable ID: {$token->tokenable_id}\n";
    echo "Name: {$token->name}\n";
    echo "---\n";
}
