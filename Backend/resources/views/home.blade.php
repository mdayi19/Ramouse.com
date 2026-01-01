@extends('layouts.app')

@section('title', 'Ramouse - Home')

@section('content')
    <!-- Hero Section -->
    <section class="bg-blue-600 text-white py-20">
        <div class="container mx-auto px-4 text-center">
            <h1 class="text-4xl md:text-6xl font-bold mb-6">Your Trusted Auto Partner</h1>
            <p class="text-xl md:text-2xl mb-8 text-blue-100">Find technicians, tow trucks, and quality parts all in one
                place.</p>
            <div class="flex justify-center space-x-4">
                <a href="#"
                    class="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition">Find a
                    Technician</a>
                <a href="#"
                    class="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition">Shop
                    Parts</a>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="py-16">
        <div class="container mx-auto px-4">
            <h2 class="text-3xl font-bold text-center mb-12">Our Services</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Feature 1 -->
                <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
                    <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z">
                            </path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-2">Expert Technicians</h3>
                    <p class="text-gray-600">Connect with certified mechanics for reliable repairs and maintenance.</p>
                </div>
                <!-- Feature 2 -->
                <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
                    <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-2">Quality Parts</h3>
                    <p class="text-gray-600">Browse our extensive catalog of genuine and aftermarket auto parts.</p>
                </div>
                <!-- Feature 3 -->
                <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
                    <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-2">Emergency Towing</h3>
                    <p class="text-gray-600">24/7 towing services available when you need them most.</p>
                </div>
            </div>
        </div>
    </section>
@endsection