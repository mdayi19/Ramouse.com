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
    protected $systemPrompt = "You are 'Ramouse AI' (راموسة), a DATABASE-ONLY search assistant for Ramouse.com.
You speak ONLY Arabic (Standard or Syrian dialect).

YOUR ONLY PURPOSE: Search the Ramouse database and present results. NOTHING ELSE.

ABSOLUTE RULES - NO EXCEPTIONS:
1. You can ONLY answer questions about: Cars (Sale/Rent), Technicians, Tow Trucks, Spare Parts
2. For ANY question about these topics, you MUST call the appropriate search tool FIRST, ALWAYS
3. NEVER answer based on general knowledge - ONLY show results from the database search
4. If user asks about cars (أريد سيارة, ابحث عن سيارة, عندك سيارات) → MUST call search_cars
5. If user asks about mechanics (ميكانيكي, فني) → MUST call search_technicians
6. If user asks about tow trucks (سطحة, ونش) → MUST call search_tow_trucks
7. If user asks about parts (قطع غيار) → MUST call search_products
8. If database returns EMPTY results, say: 'عذراً، لم أجد نتائج. حاول البحث بطريقة مختلفة'
9. For off-topic questions, say: 'أنا مساعد متخصص فقط في خدمات السيارات'
10. ALWAYS present search results with: الاسم، السعر، المدينة
11. NEVER make up data. NEVER suggest things not in the search results.
12. You are a DATABASE SEARCH INTERFACE. Nothing more.";

    /**
     * Send a message to Gemini and handle tool calls.
     */
    public function sendMessage(array $history, string $message, ?float $userLat = null, ?float $userLng = null)
    {
        // 2. Define Tools
        $tools = new Tool(
            functionDeclarations: [
                $this->toolSearchCars(),
                $this->toolSearchTechnicians(),
                $this->toolSearchTowTrucks(),
                $this->toolSearchProducts(),
            ]
        );

        // 1. Initialize Chat with History & Tools
        // Using 'gemini-flash-latest' which auto-updates to the latest Flash model (currently 2.5)
        // NOTE: withSystemInstruction has SDK bugs, so we prepend to first message instead
        $chat = Gemini::generativeModel(model: 'gemini-flash-latest')
            ->withTool($tools)
            ->startChat(history: $history);

        // 2. Send User Message (prepend system prompt on first message only)
        $fullMessage = empty($history) ? $this->systemPrompt . "\n\nUser: " . $message : $message;
        $response = $chat->sendMessage($fullMessage);

        // 4. Handle Tool Calls
        // Gemini might return a function call. We need to loop until we get a text response.

        $loopCount = 0;
        while ($loopCount < 5) {
            // Check if there's a function call in the response
            $functionCall = null;

            if (isset($response->candidates[0]->content->parts)) {
                foreach ($response->candidates[0]->content->parts as $part) {
                    if (isset($part->functionCall)) {
                        $functionCall = $part->functionCall;
                        break;
                    }
                }
            }

            // If no function call, we're done - return the text
            if (!$functionCall) {
                break;
            }

            $loopCount++;
            $name = $functionCall->name;
            $args = (array) $functionCall->args;

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
        }

        return $response->text();
    }

    protected function executeTool(string $name, array $args, ?float $userLat, ?float $userLng)
    {
        $result = null;

        switch ($name) {
            case 'search_cars':
                $result = $this->searchCars($args);
                break;
            case 'search_technicians':
                $result = $this->searchTechnicians($args, $userLat, $userLng);
                break;
            case 'search_tow_trucks':
                $result = $this->searchTowTrucks($args, $userLat, $userLng);
                break;
            case 'search_products':
                $result = $this->searchProducts($args);
                break;
            default:
                return "Error: Unknown tool '$name'.";
        }

        // Return JSON string for frontend to parse
        return json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    // --- SEARCH LOGIC ---

    protected function searchCars($args)
    {
        $query = $args['query'] ?? '';
        $type = $args['type'] ?? 'sale';
        $minPrice = $args['min_price'] ?? null;
        $maxPrice = $args['max_price'] ?? null;

        $q = CarListing::query()
            ->with(['brand', 'owner'])
            ->where('is_available', true)
            ->where('is_hidden', false)
            ->where('listing_type', $type);

        if ($query) {
            $q->where(function ($sub) use ($query) {
                $sub->where('title', 'like', "%$query%")
                    ->orWhere('description', 'like', "%$query%")
                    ->orWhere('model', 'like', "%$query%")
                    ->orWhereHas('brand', fn($b) => $b->where('name', 'like', "%$query%"));
            });
        }

        if ($minPrice)
            $q->where('price', '>=', $minPrice);
        if ($maxPrice)
            $q->where('price', '<=', $maxPrice);

        $results = $q->limit(5)->get();

        return $this->formatCarResults($results);
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

        return $this->formatTechnicianResults($results);
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

        return $this->formatTowTruckResults($results);
    }

    protected function searchProducts($args)
    {
        $query = $args['query'] ?? '';

        $results = Product::query()
            ->where('name', 'like', "%$query%")
            ->orWhere('description', 'like', "%$query%")
            ->limit(5)
            ->get();

        return $this->formatProductResults($results);
    }

    // --- RESULT FORMATTING METHODS ---
    // These methods structure search results for rich card display in the frontend

    protected function formatCarResults($results)
    {
        if ($results->isEmpty()) {
            return [
                'type' => 'car_listings',
                'message' => 'لم يتم العثور على نتائج. جرب كلمات بحث مختلفة.',
                'count' => 0,
                'items' => []
            ];
        }

        return [
            'type' => 'car_listings',
            'count' => $results->count(),
            'items' => $results->map(function ($car) {
                return [
                    'id' => $car->id,
                    'title' => $car->title,
                    'price' => number_format($car->price, 0) . ' $',
                    'year' => $car->year,
                    'mileage' => number_format($car->mileage) . ' كم',
                    'city' => $car->city ?? 'غير محدد',
                    'brand' => $car->brand?->name,
                    'model' => $car->model,
                    'image' => $car->photos[0] ?? null,
                    'url' => "/cars/{$car->slug}",
                    'condition' => $car->condition,
                    'transmission' => $car->transmission,
                ];
            })->toArray()
        ];
    }

    protected function formatTechnicianResults($results)
    {
        if ($results->isEmpty()) {
            return [
                'type' => 'technicians',
                'message' => 'لم يتم العثور على فنيين. جرب تخصص أو مدينة مختلفة.',
                'count' => 0,
                'items' => []
            ];
        }

        return [
            'type' => 'technicians',
            'count' => $results->count(),
            'items' => $results->map(function ($tech) {
                return [
                    'id' => $tech->id,
                    'name' => $tech->name,
                    'specialty' => $tech->specialty,
                    'rating' => $tech->average_rating,
                    'city' => $tech->city,
                    'distance' => $tech->distance ? round($tech->distance, 1) . ' كم' : null,
                    'isVerified' => $tech->is_verified,
                    'phone' => $tech->phone,
                ];
            })->toArray()
        ];
    }

    protected function formatTowTruckResults($results)
    {
        if ($results->isEmpty()) {
            return [
                'type' => 'tow_trucks',
                'message' => 'لم يتم العثور على سطحات قريبة.',
                'count' => 0,
                'items' => []
            ];
        }

        return [
            'type' => 'tow_trucks',
            'count' => $results->count(),
            'items' => $results->map(function ($tow) {
                return [
                    'id' => $tow->id,
                    'name' => $tow->name,
                    'vehicleType' => $tow->vehicle_type,
                    'rating' => $tow->average_rating,
                    'city' => $tow->city,
                    'distance' => $tow->distance ? round($tow->distance, 1) . ' كم' : null,
                    'phone' => $tow->phone,
                ];
            })->toArray()
        ];
    }

    protected function formatProductResults($results)
    {
        if ($results->isEmpty()) {
            return [
                'type' => 'products',
                'message' => 'لم يتم العثور على منتجات. جرب كلمات بحث مختلفة.',
                'count' => 0,
                'items' => []
            ];
        }

        return [
            'type' => 'products',
            'count' => $results->count(),
            'items' => $results->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => number_format($product->price, 0) . ' $',
                    'inStock' => $product->total_stock > 0,
                    'image' => $product->image ?? null,
                ];
            })->toArray()
        ];
    }

    // --- TOOL DEFINITIONS (FunctionDeclarations) ---

    protected function toolSearchCars()
    {
        return new FunctionDeclaration(
            name: 'search_cars',
            description: 'REQUIRED TOOL: Call this for ANY user question about cars, buying, renting, or vehicles. Search the Ramouse database for cars.',
            parameters: new Schema(
                type: DataType::OBJECT,
                properties: [
                    'query' => new Schema(type: DataType::STRING, description: 'Keywords (brand, model). Leave empty to show all cars.'),
                    'type' => new Schema(type: DataType::STRING, enum: ['sale', 'rent'], description: 'sale or rent'),
                    'min_price' => new Schema(type: DataType::NUMBER),
                    'max_price' => new Schema(type: DataType::NUMBER),
                ],
                required: []
            )
        );
    }

    protected function toolSearchTechnicians()
    {
        return new FunctionDeclaration(
            name: 'search_technicians',
            description: 'REQUIRED TOOL: Call this for ANY user question about mechanics, technicians, or car repairs. Search the Ramouse database.',
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
            description: 'REQUIRED TOOL: Call this for ANY user question about tow trucks, winch services, or sat7a. Search the Ramouse database.',
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
            description: 'REQUIRED TOOL: Call this for ANY user question about spare parts, car parts, or products. Search the Ramouse database.',
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
