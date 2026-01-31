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
use App\Models\UserPreference;
use Gemini\Data\Schema;
use Gemini\Enums\DataType;
use Illuminate\Support\Facades\Log;
use Gemini\Data\Part;

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
     * Build a personalized system prompt based on user preferences
     */
    protected function buildPersonalizedPrompt(?int $userId = null): string
    {
        $basePrompt = $this->systemPrompt;

        if (!$userId) {
            return $basePrompt;
        }

        // Get user's top preferences
        $preferences = UserPreference::where('user_id', $userId)
            ->orderBy('frequency', 'desc')
            ->take(5)
            ->get();

        if ($preferences->isEmpty()) {
            return $basePrompt;
        }

        // Build personalization context
        $personalContext = "\n\nUSER CONTEXT (for better search relevance):";

        foreach ($preferences as $pref) {
            switch ($pref->preference_key) {
                case 'preferred_city':
                    $personalContext .= "\n- User frequently searches in city: {$pref->preference_value}";
                    break;
                case 'preferred_brand':
                    $personalContext .= "\n- User interested in brand: {$pref->preference_value}";
                    break;
                case 'price_range':
                    $personalContext .= "\n- User's budget range: {$pref->preference_value}";
                    break;
                case 'car_condition':
                    $personalContext .= "\n- Prefers: {$pref->preference_value} cars";
                    break;
            }
        }

        return $basePrompt . $personalContext;
    }

    /**
     * Learn from search parameters
     */
    protected function learnPreferences(?int $userId, array $searchParams)
    {
        if (!$userId || empty($searchParams)) {
            return;
        }

        // Track city preference
        if (!empty($searchParams['city'])) {
            $this->saveOrUpdatePreference($userId, 'preferred_city', $searchParams['city']);
        }

        // Track brand preference
        if (!empty($searchParams['brand'])) {
            $this->saveOrUpdatePreference($userId, 'preferred_brand', $searchParams['brand']);
        }

        // Track price range
        if (!empty($searchParams['min_price']) && !empty($searchParams['max_price'])) {
            $range = "{$searchParams['min_price']}-{$searchParams['max_price']}";
            $this->saveOrUpdatePreference($userId, 'price_range', $range);
        }

        // Track condition preference
        if (!empty($searchParams['condition'])) {
            $this->saveOrUpdatePreference($userId, 'car_condition', $searchParams['condition']);
        }
    }

    /**
     * Save or update a preference
     */
    protected function saveOrUpdatePreference(int $userId, string $key, string $value)
    {
        $pref = UserPreference::firstOrCreate(
            ['user_id' => $userId, 'preference_key' => $key],
            ['preference_value' => $value, 'frequency' => 0]
        );

        if ($pref->preference_value === $value) {
            $pref->incrementUsage();
        } else {
            // Value changed, reset with new value
            $pref->update([
                'preference_value' => $value,
                'frequency' => 1,
                'last_used_at' => now()
            ]);
        }
    }

    /**
     * Send a message to Gemini and handle tool calls.
     */
    public function sendMessage(array $history, string $message, ?float $userLat = null, ?float $userLng = null, ?int $userId = null)
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

        // Build personalized prompt
        $systemPrompt = $this->buildPersonalizedPrompt($userId);

        // IMPORTANT: Inject System Prompt into History to maintain context across turns
        if (!empty($history)) {
            $firstItem = $history[0];

            // Handle if history item is Content Object (preferred)
            if ($firstItem instanceof Content && $firstItem->role === Role::USER) {
                $text = $firstItem->parts[0]->text ?? '';
                $newText = $systemPrompt . "\n\n" . $text;
                // Re-create the first message with system prompt prepended
                $history[0] = new Content([new Part($newText)], Role::USER);
            }
            // Handle if history item is Array (fallback)
            elseif (is_array($firstItem) && isset($firstItem['parts'][0]['text']) && $firstItem['role'] === 'user') {
                $history[0]['parts'][0]['text'] = $systemPrompt . "\n\n" . $history[0]['parts'][0]['text'];
            }
        }

        $chat = Gemini::generativeModel(model: 'gemini-flash-latest')
            ->withTool($tools)
            ->startChat(history: $history);

        // 2. Send User Message
        // If history was empty, we need to add prompt here. If history existed, we added it above.
        $fullMessage = empty($history) ? $systemPrompt . "\n\nUser: " . $message : $message;
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

            // Execute Tool and return JSON directly to frontend
            $toolResult = $this->executeTool($name, $args, $userLat, $userLng, $userId);

            // Return the JSON result directly - no need to send back to Gemini
            // This preserves rich card functionality in frontend
            return $toolResult;
        }

        // Return text response for general chat (no tool calls)
        try {
            $textResponse = $response->text();
            return $textResponse ?: 'أهلاً بك، أنا راموسة. كيف يمكنني مساعدتك؟';
        } catch (\Exception $e) {
            Log::error("Failed to get text response: " . $e->getMessage());
            return 'أهلاً بك، أنا راموسة. كيف يمكنني مساعدتك؟';
        }
    }

    protected function executeTool(string $name, array $args, ?float $userLat, ?float $userLng, ?int $userId = null)
    {
        $result = null;

        switch ($name) {
            case 'search_cars':
                // Learn from car search preferences
                if ($userId) {
                    $this->learnPreferences($userId, $args);
                }
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

        // Price filters
        if ($minPrice)
            $q->where('price', '>=', $minPrice);
        if ($maxPrice)
            $q->where('price', '<=', $maxPrice);

        // Advanced filters
        if (!empty($args['brand_id']))
            $q->where('brand_id', $args['brand_id']);

        if (!empty($args['min_year']))
            $q->where('year', '>=', $args['min_year']);

        if (!empty($args['max_year']))
            $q->where('year', '<=', $args['max_year']);

        if (!empty($args['transmission']))
            $q->where('transmission', $args['transmission']);

        if (!empty($args['fuel_type']))
            $q->where('fuel_type', $args['fuel_type']);

        if (!empty($args['condition']))
            $q->where('condition', $args['condition']);

        if (!empty($args['city']))
            $q->where('city', 'like', "%{$args['city']}%");

        $results = $q->limit(5)->get();

        return $this->formatCarResults($results);
    }

    protected function searchTechnicians($args, $userLat, $userLng)
    {
        $specialty = $args['specialty'] ?? null;
        $city = $args['city'] ?? null;

        $q = Technician::query()->where('is_active', true)->where('is_verified', true);

        if ($specialty)
            $q->where('specialty', 'like', "%$specialty%");
        if ($city)
            $q->where('city', 'like', "%$city%");

        // Rating filter
        if (!empty($args['min_rating']))
            $q->where('average_rating', '>=', $args['min_rating']);

        // Geolocation Logic - automatically use if coordinates provided
        if ($userLat && $userLng) {
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

        $q = TowTruck::query()->where('is_active', true)->where('is_verified', true);

        if ($city)
            $q->where('city', 'like', "%$city%");

        // Vehicle type filter
        if (!empty($args['vehicle_type']))
            $q->where('vehicle_type', 'like', "%{$args['vehicle_type']}%");

        // Geolocation Logic - automatically use if coordinates provided
        if ($userLat && $userLng) {
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

        $q = Product::query();

        if ($query) {
            $q->where(function ($sub) use ($query) {
                $sub->where('name', 'like', "%$query%")
                    ->orWhere('description', 'like', "%$query%");
            });
        }

        // Price filters
        if (!empty($args['min_price']))
            $q->where('price', '>=', $args['min_price']);

        if (!empty($args['max_price']))
            $q->where('price', '<=', $args['max_price']);

        $results = $q->limit(5)->get();

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
                'items' => [],
                'suggestions' => [
                    'ابحث في جميع المدن',
                    'جرب ماركات مشابهة',
                    'ارفع حد السعر',
                    'اعرض السيارات المستعملة'
                ]
            ];
        }

        // Generate contextual suggestions based on results
        $suggestions = [
            'ابحث عن فني متخصص في هذه الماركة',
            'اعرض قطع غيار لهذه الماركة'
        ];

        // Add price-based suggestions
        if ($results->count() > 3) {
            $suggestions[] = 'اعرض خيارات أرخص';
            $suggestions[] = 'اعرض نفس الماركة في مدن أخرى';
        }

        return [
            'type' => 'car_listings',
            'count' => $results->count(),
            'items' => $results->map(function ($car) {
                // Explicitly create clean array without boolean attributes
                return [
                    'id' => (int) $car->id,
                    'title' => (string) $car->title,
                    'price' => number_format($car->price, 0) . ' $',
                    'year' => (int) $car->year,
                    'mileage' => number_format($car->mileage) . ' كم',
                    'city' => $car->city ?? 'غير محدد',
                    'brand' => $car->brand?->name ?? 'غير محدد',
                    'model' => (string) $car->model,
                    'image' => isset($car->photos[0]) ? (string) $car->photos[0] : null,
                    'url' => "/cars/{$car->slug}",
                    'condition' => (string) $car->condition,
                    'transmission' => (string) $car->transmission,
                ];
            })->values()->toArray(),
            'suggestions' => $suggestions
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
                    'isVerified' => $tech->is_verified ? 1 : 0, // Convert boolean to int
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
                    'min_price' => new Schema(type: DataType::NUMBER, description: 'Minimum price in dollars'),
                    'max_price' => new Schema(type: DataType::NUMBER, description: 'Maximum price in dollars'),
                    'brand_id' => new Schema(type: DataType::NUMBER, description: 'Brand ID to filter by specific brand'),
                    'min_year' => new Schema(type: DataType::NUMBER, description: 'Minimum manufacturing year (e.g. 2015)'),
                    'max_year' => new Schema(type: DataType::NUMBER, description: 'Maximum manufacturing year (e.g. 2023)'),
                    'transmission' => new Schema(type: DataType::STRING, enum: ['automatic', 'manual'], description: 'Transmission type'),
                    'fuel_type' => new Schema(type: DataType::STRING, enum: ['gas', 'diesel', 'electric', 'hybrid'], description: 'Fuel type'),
                    'condition' => new Schema(type: DataType::STRING, enum: ['new', 'used', 'certified_pre_owned'], description: 'Car condition'),
                    'city' => new Schema(type: DataType::STRING, description: 'City name in Arabic (e.g. دمشق, حلب)'),
                ],
                required: []
            )
        );
    }

    protected function toolSearchTechnicians()
    {
        return new FunctionDeclaration(
            name: 'search_technicians',
            description: 'REQUIRED TOOL: Call this for ANY user question about mechanics, technicians, or car repairs. Search the Ramouse database. If user asks for nearby technicians, the system will automatically use geolocation.',
            parameters: new Schema(
                type: DataType::OBJECT,
                properties: [
                    'specialty' => new Schema(type: DataType::STRING, description: 'e.g. BMW, Electrician'),
                    'city' => new Schema(type: DataType::STRING, description: 'City name in Arabic'),
                    'min_rating' => new Schema(type: DataType::NUMBER, description: 'Minimum average rating (1-5, e.g. 4 for 4+ stars)'),
                ]
            )
        );
    }

    protected function toolSearchTowTrucks()
    {
        return new FunctionDeclaration(
            name: 'search_tow_trucks',
            description: 'REQUIRED TOOL: Call this for ANY user question about tow trucks, winch services, or sat7a. Search the Ramouse database. If user asks for nearby tow trucks, the system will automatically use geolocation.',
            parameters: new Schema(
                type: DataType::OBJECT,
                properties: [
                    'city' => new Schema(type: DataType::STRING, description: 'City name in Arabic'),
                    'vehicle_type' => new Schema(type: DataType::STRING, description: 'Type of tow truck (e.g. سطحة, ونش)'),
                ]
            )
        );
    }

    protected function toolSearchProducts()
    {
        return new FunctionDeclaration(
            name: 'search_products',
            description: 'REQUIRED TOOL: Call this for ANY user question about spare parts, car parts, or products. Search the Ramouse database. Only active and available products are returned.',
            parameters: new Schema(
                type: DataType::OBJECT,
                properties: [
                    'query' => new Schema(type: DataType::STRING, description: 'Product name or keywords'),
                    'min_price' => new Schema(type: DataType::NUMBER, description: 'Minimum price in dollars'),
                    'max_price' => new Schema(type: DataType::NUMBER, description: 'Maximum price in dollars'),
                ],
                required: ['query']
            )
        );
    }
}
