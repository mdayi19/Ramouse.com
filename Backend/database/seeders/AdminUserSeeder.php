<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\User::create([
            'name' => 'Admin User',
            'email' => 'admin@ramouse.com',
            'phone' => '+905319624826',
            'password' => \Illuminate\Support\Facades\Hash::make('640680'),
            'is_admin' => true,
        ]);

        \App\Models\User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@ramouse.com',
            'phone' => '+905319624827', // Different phone for super admin
            'password' => \Illuminate\Support\Facades\Hash::make('640680'),
            'is_admin' => true,
        ]);
    }
}
