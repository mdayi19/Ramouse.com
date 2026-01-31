<?php

namespace App\Services;

use Gemini\Laravel\Facades\Gemini;
use Gemini\Data\Content;
use Gemini\Enums\Role;
use Gemini\Data\Tool;
use Gemini\Data\FunctionDeclaration;
use App\Models\CarListing;
use App\Models\Technician;
use App\Models\TowTruck;
use App\Models\Product;
use Gemini\Data\Schema;
use Gemini\Enums\DataType;
use Illuminate\Support\Facades\Log;

class AiSearchService
{
    protected $systemPrompt = "You are 'Ramouse AI' (راموسة), an intelligent assistant for Ramouse.com. 
    You speak Arabic (Standard or Syrian dialect).
    Your goal is to help users find services on the platform: Cars (Sale/Rent), Technicians, Tow Trucks, and Spare Parts.
    
    RULES:
    1. ONLY answer questions related to cars, automotive services, and the Ramouse platform.
    2. If asked about general topics (weather, politics, sports), politely refuse and guide them back to cars/services.
    3. Use the provided TOOLS to search for real data. DO NOT hallucinate listings.
    4. If the user wants to perform an action (Call, Buy, Book) and is NOT logged in, tell them they need to login first.
    5. Be friendly, concise, and helpful. 
    6. When showing results, summarize the key details (Price, Model, Location).
    7. ALWAYS use the search tools when a user asks for 'cars', 'mechanics', 'towing', or 'parts'.
    ";

    /**
     * Send a message to Gemini and handle tool calls.
     */
    public function sendMessage(array $history, string $message, ?float $userLat = null, ?float $userLng = null)
    {
        // 1. Initialize Chat with History
        // Switching to 'gemini-2.5-flash' as requested by user.
        $chat = Gemini::generativeModel(model: 'models/gemini-2.5-flash')->startChat(history: []);

        // 2. Define Tools
        $tools = new Tool(
            functionDeclarations: [
                $this->toolSearchCars(),
                $this->toolSearchTechnicians(),
                $this->toolSearchTowTrucks(),
                $this->toolSearchProducts(),
            ]
        );

        // 3. First Call: Send User Message
        // We incorporate the system prompt as the first message or instruction if possible, 
        // but `startChat` usually handles it via history or config. 
        // Since we can't easily inject system prompt in `startChat` without a specific object, 
        // we'll prepend it to the message or use a config if available.
        // Workaround: Prepend system prompt to the strict first message of the session.

        $fullMessage = $message;
        if (empty($history)) {
            $fullMessage = $this->systemPrompt . "\n\nUser: " . $message;
        }

        $response = $chat->sendMessage($fullMessage, tools: $tools);

        // 4. Handle Tool Calls
        // Gemini might return a function call. We need to loop until we get a text response.

        $functionCall = $response->functionCall(); // Check if there's a function call

        while ($functionCall) {
            $name = $functionCall->name;
            $args = $functionCall->args;

            Log::info("Gemini Tool Call: $name", $args);

            // Execute Tool
            $toolResult = $this->executeTool($name, $args, $userLat, $userLng);

            // Send Result back to Gemini
            $response = $chat->sendMessage(
                part: [
                    'functionResponse' => [
                        'name' => $name,
                        'response' => ['result' => $toolResult]
                    ]
                ]
            );

            $functionCall = $response->functionCall();
        }

        return $response->text();
    }

    protected function executeTool(string $name, array $args, ?float $userLat, ?float $userLng)
    {
        switch ($name) {
            case 'search_cars':
                return $this->searchCars($args);
            case 'search_technicians':
                return $this->searchTechnicians($args, $userLat, $userLng);
            case 'search_tow_trucks':
                return $this->searchTowTrucks($args, $userLat, $userLng);
            case 'search_products':
                return $this->searchProducts($args);
            default:
                return "Error: Unknown tool '$name'.";
        }
    }

    // --- SEARCH LOGIC ---

    protected function searchCars($args)
    {
        $query = $args['query'] ?? '';
        $type = $args['type'] ?? 'sale';
        $minPrice = $args['min_price'] ?? null;
        $maxPrice = $args['max_price'] ?? null;

        $q = CarListing::query()
            ->with(['brand', 'carModel', 'city', 'user'])
            ->where('status', 'active')
            ->where('listing_type', $type);

        if ($query) {
            $q->where(function ($sub) use ($query) {
                $sub->where('title', 'like', "%$query%")
                    ->orWhere('description', 'like', "%$query%")
                    ->orWhereHas('brand', fn($b) => $b->where('name', 'like', "%$query%"))
                    ->orWhereHas('carModel', fn($m) => $m->where('name', 'like', "%$query%"));
            });
        }

        if ($minPrice)
            $q->where('price', '>=', $minPrice);
        if ($maxPrice)
            $q->where('price', '<=', $maxPrice);

        $results = $q->limit(5)->get();

        return $results->map(function ($car) {
            return [
                'id' => $car->id,
                'title' => $car->title,
                'price' => $car->price,
                'year' => $car->year,
                'city' => $car->city,
                'slug' => $car->slug,
                'image' => $car->photos[0] ?? null, // Simplified
            ];
        })->toArray();
    }

    protected function searchTechnicians($args, $userLat, $userLng)
    {
        $specialty = $args['specialty'] ?? null;
        $city = $args['city'] ?? null;
        $nearMe = $args['near_me'] ?? false;

        $q = Technician::query()->where('is_active', true)->where('is_verified', true);

        if ($specialty)
            $q->where('specialty', 'like', "%$specialty%");
        if ($city)
            $q->where('city', 'like', "%$city%");

        // Geolocation Logic
        if ($nearMe && $userLat && $userLng) {
            // Simplified Haversine or similar if supported by DB, or basic ordering
            // For standard MySQL, usually separate query or raw DB expression.
            // Using basic approximation for this example:
            $q->selectRaw("*, ( 6371 * acos( cos( radians(?) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(?) ) + sin( radians(?) ) * sin( radians( latitude ) ) ) ) AS distance", [$userLat, $userLng, $userLat])
                ->having('distance', '<', 50)
                ->orderBy('distance');
        }

        $results = $q->limit(5)->get();

        return $results->map(function ($tech) {
            return [
                'id' => $tech->id,
                'name' => $tech->name,
                'specialty' => $tech->specialty,
                'rating' => $tech->average_rating,
                'city' => $tech->city,
                'distance' => $tech->distance ? round($tech->distance, 1) . ' km' : null
            ];
        })->toArray();
    }

    protected function searchTowTrucks($args, $userLat, $userLng)
    {
        $city = $args['city'] ?? null;
        $nearMe = $args['near_me'] ?? false;

        $q = TowTruck::query()->where('is_active', true)->where('is_verified', true);

        if ($city)
            $q->where('city', 'like', "%$city%");

        if ($nearMe && $userLat && $userLng) {
            $q->selectRaw("*, ( 6371 * acos( cos( radians(?) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(?) ) + sin( radians(?) ) * sin( radians( latitude ) ) ) ) AS distance", [$userLat, $userLng, $userLat])
                ->having('distance', '<', 50)
                ->orderBy('distance');
        }

        $results = $q->limit(5)->get();

        return $results->map(function ($tow) {
            return [
                'id' => $tow->id,
                'name' => $tow->name,
                'vehicle_type' => $tow->vehicle_type,
                'rating' => $tow->average_rating,
                'city' => $tow->city,
                'distance' => $tow->distance ? round($tow->distance, 1) . ' km' : null
            ];
        })->toArray();
    }

    protected function searchProducts($args)
    {
        $query = $args['query'] ?? '';

        $results = Product::query()
            ->where('name', 'like', "%$query%")
            ->orWhere('description', 'like', "%$query%")
            ->limit(5)
            ->get();

        return $results->map(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'price' => $p->price,
                'in_stock' => $p->total_stock > 0,
            ];
        })->toArray();
    }

    // --- TOOL DEFINITIONS (FunctionDeclarations) ---

    protected function toolSearchCars()
    {
        return new FunctionDeclaration(
            name: 'search_cars',
            description: 'Search for cars for sale or rent based on user criteria.',
            parameters: new Schema(
                type: DataType::OBJECT,
                properties: [
                    'query' => new Schema(type: DataType::STRING, description: 'Keywords (brand, model)'),
                    'type' => new Schema(type: DataType::STRING, enum: ['sale', 'rent']),
                    'min_price' => new Schema(type: DataType::NUMBER),
                    'max_price' => new Schema(type: DataType::NUMBER),
                ],
                required: ['query']
            )
        );
    }

    protected function toolSearchTechnicians()
    {
        return new FunctionDeclaration(
            name: 'search_technicians',
            description: 'Find mechanics and technicians.',
            parameters: new Schema(
                type: DataType::OBJECT,
                properties: [
                    'specialty' => new Schema(type: DataType::STRING, description: 'e.g. BMW, Electrician'),
                    'city' => new Schema(type: DataType::STRING),
                    'near_me' => new Schema(type: DataType::BOOLEAN, description: 'True if user asks for nearby'),
                ]
            )
        );
    }

    protected function toolSearchTowTrucks()
    {
        return new FunctionDeclaration(
            name: 'search_tow_trucks',
            description: 'Find tow trucks (Winch/Sat7a).',
            parameters: new Schema(
                type: DataType::OBJECT,
                properties: [
                    'city' => new Schema(type: DataType::STRING),
                    'near_me' => new Schema(type: DataType::BOOLEAN),
                ]
            )
        );
    }

    protected function toolSearchProducts()
    {
        return new FunctionDeclaration(
            name: 'search_products',
            description: 'Search for spare parts and products.',
            parameters: new Schema(
                type: DataType::OBJECT,
                properties: [
                    'query' => new Schema(type: DataType::STRING),
                ],
                required: ['query']
            )
        );
    }
}
