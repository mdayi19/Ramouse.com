<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Customer;

echo "Checking customer IDs:\n";
$customers = DB::table('customers')
    ->where('id', 'like', '%5308400480%')
    ->get(['id', 'unique_id', 'name']);

foreach ($customers as $customer) {
    echo "ID: '{$customer->id}'\n";
    echo "Unique ID: {$customer->unique_id}\n";
    echo "Name: {$customer->name}\n";
    echo "---\n";
}

echo "\nChecking using Eloquent:\n";
$customer = Customer::where('id', 'like', '%5308400480%')->first();
if ($customer) {
    echo "Found via Eloquent - ID: '{$customer->id}'\n";
    echo "Primary Key Value: '{$customer->getKey()}'\n";
}
