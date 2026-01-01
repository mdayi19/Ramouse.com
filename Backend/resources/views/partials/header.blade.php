<header class="bg-white shadow-sm sticky top-0 z-50">
    <nav class="container mx-auto px-4 py-4 flex justify-between items-center">
        <a href="{{ route('home') }}" class="text-2xl font-bold text-blue-600">Ramouse</a>
        <div class="hidden md:flex space-x-6">
            <a href="{{ route('home') }}" class="text-gray-600 hover:text-blue-600 transition">Home</a>
            <a href="#" class="text-gray-600 hover:text-blue-600 transition">Services</a>
            <a href="#" class="text-gray-600 hover:text-blue-600 transition">Store</a>
            <a href="#" class="text-gray-600 hover:text-blue-600 transition">About</a>
            <a href="#" class="text-gray-600 hover:text-blue-600 transition">Contact</a>
        </div>
        <div class="flex space-x-4">
            <a href="#"
                class="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition">Login</a>
            <a href="#" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Register</a>
        </div>
    </nav>
</header>