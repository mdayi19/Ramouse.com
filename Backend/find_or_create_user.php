<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Customer;
use App\Models\User;
use App\Models\Provider;
use App\Models\Technician;
use App\Models\TowTruck;

$phone = '+905319624826';

echo "=== SEARCHING FOR USER: {$phone} ===\n\n";

// Check Customer
$customer = Customer::where('id', $phone)->first();
if ($customer) {
    echo "✅ Found as CUSTOMER\n";
    echo "   Name: {$customer->name}\n";
    exit;
}

// Check Admin (users table)
$admin = User::where('phone', $phone)->orWhere('email', $phone)->first();
if ($admin) {
    echo "✅ Found as ADMIN\n";
    echo "   Email: {$admin->email}\n";
    exit;
}

// Check Provider
$provider = Provider::where('id', $phone)->first();
if ($provider) {
    echo "✅ Found as PROVIDER\n";
    echo "   Name: {$provider->name}\n";
    exit;
}

// Check Technician
$technician = Technician::where('id', $phone)->first();
if ($technician) {
    echo "✅ Found as TECHNICIAN\n";
    echo "   Name: {$technician->name}\n";
    exit;
}

// Check Tow Truck
$towTruck = TowTruck::where('id', $phone)->first();
if ($towTruck) {
    echo "✅ Found as TOW TRUCK\n";
    echo "   Name: {$towTruck->company_name}\n";
    exit;
}

echo "❌ USER NOT FOUND in any table!\n\n";
echo "This means you're either:\n";
echo "1. Not actually logged in (just on the welcome page)\n";
echo "2. Need to create an account with this number\n\n";
echo "Let me create a test customer account for you...\n\n";

// Create customer
try {
    $customer = Customer::create([
        'id' => $phone,
        'unique_id' => 'CUST-' . time(),
        'name' => 'Test User',
        'password' => bcrypt('password'), // Default password: 'password'
        'is_active' => true,
    ]);

    echo "✅ Customer account created!\n";
    echo "   Phone: {$customer->id}\n";
    echo "   Name: {$customer->name}\n";
    echo "   Password: password\n\n";
    echo "Now login with:\n";
    echo "   Phone: {$phone}\n";
    echo "   Password: password\n";
} catch (\Exception $e) {
    echo "❌ Error creating customer: " . $e->getMessage() . "\n";
}
