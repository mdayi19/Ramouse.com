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
    protected $systemPrompt = "أنت 'راموسة AI' - مساعد بحث ذكي متخصص في منصة راموسة Ramouse.com في سوريا 🇸🇾
تتحدث بالعربية (فصحى أو لهجة شامية سورية).

🎯 مهمتك الوحيدة: البحث الذكي في قاعدة بيانات راموسة وعرض النتائج. لا شيء غير ذلك.

📋 قواعد صارمة - بدون استثناءات:

1. أنت متخصص فقط في: السيارات (بيع/إيجار), فنيي الصيانة, السطحات, قطع الغيار
2. لأي سؤال عن هذه المواضيع: يجب استدعاء أداة البحث المناسبة أولاً, دائماً
3. لا تجب أبداً من معرفتك العامة - فقط اعرض نتائج البحث من قاعدة البيانات
4. إذا كانت النتائج فارغة: قل 'عذراً، ما لقيت نتائج. جرب كلمات بحث تانية أو وسّع نطاق البحث'
5. للأسئلة خارج الموضوع: قل 'أنا مساعد متخصص بس بخدمات السيارات (بيع، إيجار، صيانة، سطحات، قطع غيار)'

🔍 استخراج الفلاتر الذكي:

لـ السيارات - استدعِ search_cars عندما يطلب المستخدم:
- أي ذكر لماركة: تويوتا، هيونداي، كيا، نيسان، BMW، مرسيدس، فورد، شيفروليه، هوندا، رينو، بيجو
- أي موديل: كامري، أكورد، سوناتا، النترا، RAV4، CRV, تاهو، لاندكروزر، سيراتو، توسان
- سنة الصنع: 2024, 2023, 2022, 2021, 2020, أحدث من, أقدم من, موديل
- السعر: أقل من X, أكثر من X, بين X و Y, رخيص, غالي (بالدولار)
- المدينة: دمشق، حلب، حمص، حماة، اللاذقية، طرطوس، السويداء، درعا، دير الزور، الرقة، إدلب، القامشلي
- الحالة: جديد، جديدة، مستعمل، مستعملة، زيرو
- ناقل الحركة: أوتوماتيك، عادي، يدوي، مانوال
- نوع السيارة: SUV, سيدان، شاحنة، رياضية، دفع رباعي، فان
- نوع الإعلان: بيع، شراء، إيجار، استئجار

أمثلة لاستخراج الفلاتر:
- 'بدي تويوتا كامري 2023 بدمشق بأقل من 25 ألف دولار'
  → query='تويوتا كامري', min_year=2023, max_year=2023, city='دمشق', max_price=25000
  
- 'سيارات أقل من 15000 دولار'
  → max_price=15000
  
- 'SUV جديدة أوتوماتيك'
  → query='SUV', condition='new', transmission='automatic'
  
- 'هيونداي مستعملة بحلب'
  → query='هيونداي', condition='used', city='حلب'
  
- 'كيا سيراتو موديل 2020 باللاذقية'
  → query='كيا سيراتو', min_year=2020, max_year=2020, city='اللاذقية'

لـ الفنيين - استدعِ search_technicians عندما يطلب:
- ميكانيكي، فني، ورشة، صيانة، إصلاح، معلم
- تخصص: كهرباء، ميكانيك، دهان، تكييف، فحص، صبغ
- قريب مني، بالمنطقة، بالحي
- تقييم عالي، 5 نجوم، ممتاز، منيح

أمثلة:
- 'بدي فني كهرباء قريب مني' → specialty='كهرباء', (سيستخدم الموقع تلقائياً)
- 'ورشة تويوتا بحمص' → specialty='تويوتا', city='حمص'
- 'ميكانيكي ممتاز 5 نجوم' → min_rating=5
- 'معلم صيانة BMW بدمشق' → specialty='BMW', city='دمشق'

لـ السطحات - استدعِ search_tow_trucks عندما:
- سطحة، ونش، نقل سيارة، طوارئ، نقّالة
- قريب، الآن، عاجل، سريع
- نوع: هيدروليك، عادية

أمثلة:
- 'بدي سطحة قريبة مني هلق' → (سيستخدم الموقع)
- 'ونش بحلب' → city='حلب'
- 'سطحة طوارئ بدمشق' → city='دمشق'

لـ قطع الغيار - استدعِ search_products عند:
- قطع غيار، إكسسوارات، منتجات، قطع

💬 أسلوب الرد:
- استخدم اللهجة الشامية السورية بشكل طبيعي (بدي، هلق، منيح، شو، ليش)
- كن ودود ومساعد
- اعرض النتائج بوضوح
- إذا فهمت الطلب جزئياً: اطلب توضيح ('بتقصد... ولا...؟')
- قدّم اقتراحات مفيدة بناءً على النتائج

⚠️ ممنوع منعاً باتاً:
- اختراع بيانات مش موجودة بالنتائج
- الإجابة من معرفتك العامة
- تقديم نصائح عامة بدون بحث بالقاعدة
- الإجابة عن أسئلة برا نطاق السيارات والخدمات

أنت واجهة بحث ذكية بقاعدة البيانات. هدفك: مساعدة المستخدم يلاقي اللي بدو ياه بسرعة ودقة.";

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

        return $this->formatCarResults($results, $type);
    }

    protected function searchTechnicians($args, $userLat, $userLng)
    {
        $specialty = $args['specialty'] ?? null;
        $city = $args['city'] ?? null;

        // Start with active technicians only (don't require verified initially)
        $q = Technician::query()->where('is_active', true);

        // Apply filters
        if ($specialty) {
            $q->where('specialty', 'like', "%$specialty%");
        }

        if ($city) {
            $q->where('city', 'like', "%$city%");
        }

        // Rating filter
        if (!empty($args['min_rating'])) {
            $q->where('average_rating', '>=', $args['min_rating']);
        }

        // Geolocation Logic - automatically use if coordinates provided
        if ($userLat && $userLng) {
            // Use MySQL spatial functions for GEOMETRY POINT type
            $q->selectRaw("*, ( 6371 * acos( cos( radians(?) ) * cos( radians( ST_Y(location) ) ) * cos( radians( ST_X(location) ) - radians(?) ) + sin( radians(?) ) * sin( radians( ST_Y(location) ) ) ) ) AS distance", [$userLat, $userLng, $userLat])
                ->whereNotNull('location')
                ->having('distance', '<', 50)
                ->orderBy('distance');
        } else {
            // Order by rating if no location
            $q->orderBy('average_rating', 'desc');
        }

        $results = $q->limit(10)->get();

        // Fallback 1: If no results and both specialty and city were provided, try without city
        if ($results->isEmpty() && $specialty && $city) {
            $q = Technician::query()
                ->where('is_active', true)
                ->where('specialty', 'like', "%$specialty%")
                ->orderBy('average_rating', 'desc')
                ->limit(10);

            $results = $q->get();
        }

        // Fallback 2: If still no results and specialty was provided, try broader match
        if ($results->isEmpty() && $specialty) {
            $q = Technician::query()
                ->where('is_active', true)
                ->orderBy('average_rating', 'desc')
                ->limit(10);

            $results = $q->get();
        }

        // Fallback 3: If STILL no results, just show ANY active technicians
        if ($results->isEmpty()) {
            $results = Technician::query()
                ->where('is_active', true)
                ->orderBy('average_rating', 'desc')
                ->limit(10)
                ->get();
        }

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
            // Use MySQL spatial functions for GEOMETRY POINT type
            $q->selectRaw("*, ( 6371 * acos( cos( radians(?) ) * cos( radians( ST_Y(location) ) ) * cos( radians( ST_X(location) ) - radians(?) ) + sin( radians(?) ) * sin( radians( ST_Y(location) ) ) ) ) AS distance", [$userLat, $userLng, $userLat])
                ->whereNotNull('location')
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

    protected function formatCarResults($results, $type = 'sale')
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
            'items' => $results->map(function ($car) use ($type) {
                // Use correct frontend route based on listing type
                $urlPrefix = $type === 'rent' ? '/rent-car/' : '/car-listings/';

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
                    'url' => $urlPrefix . $car->slug,
                    'slug' => $car->slug,
                    'condition' => (string) $car->condition,
                    'transmission' => (string) $car->transmission,
                    'listing_type' => $type,
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
                'items' => [],
                'suggestions' => [
                    'ابحث في مدينة أخرى',
                    'جرب تخصص مختلف',
                    'اعرض جميع الفنيين'
                ]
            ];
        }

        // Generate contextual suggestions
        $suggestions = [
            'ابحث عن قطع غيار لسيارتك',
            'ابحث عن سيارة من نفس الفني'
        ];

        if ($results->count() > 3) {
            $suggestions[] = 'اعرض فقط الفنيين الموثقين';
        }

        return [
            'type' => 'technicians',
            'count' => $results->count(),
            'items' => $results->map(function ($tech) {
                // Parse socials JSON if it's a string
                $socials = is_string($tech->socials)
                    ? json_decode($tech->socials, true)
                    : (is_array($tech->socials) ? $tech->socials : []);

                // Parse gallery JSON if it's a string
                $gallery = is_string($tech->gallery)
                    ? json_decode($tech->gallery, true)
                    : (is_array($tech->gallery) ? $tech->gallery : []);

                // Get cover image from gallery (first item)
                $coverImage = null;
                if (!empty($gallery) && isset($gallery[0])) {
                    if (isset($gallery[0]['path'])) {
                        $coverImage = url('storage/' . $gallery[0]['path']);
                    } elseif (isset($gallery[0]['url'])) {
                        $coverImage = $gallery[0]['url'];
                    }
                }

                return [
                    'id' => (string) $tech->id,  // Keep as string (phone number format)
                    'name' => (string) $tech->name,
                    'specialty' => (string) $tech->specialty,
                    'rating' => $tech->average_rating ?? 0,
                    'city' => (string) $tech->city,
                    'distance' => $tech->distance ? round($tech->distance, 1) . ' كم' : null,
                    'isVerified' => $tech->is_verified ? 1 : 0,

                    // ✅ FIX: Use id as phone (id IS the phone number)
                    'phone' => (string) $tech->id,

                    // ✅ FIX: Get whatsapp from socials JSON, fallback to id
                    'whatsapp' => isset($socials['whatsapp'])
                        ? (string) $socials['whatsapp']
                        : (string) $tech->id,

                    'description' => $tech->description
                        ? mb_substr($tech->description, 0, 100)
                        : '',

                    // ✅ FIX: Format profile photo URL
                    'profile_photo' => $tech->profile_photo
                        ? url('storage/' . $tech->profile_photo)
                        : null,

                    // ✅ FIX: Get cover image from parsed gallery
                    'cover_image' => $coverImage,

                    // ✅ REMOVED: years_experience field doesn't exist in database
    
                    'url' => "/technicians/" . rawurlencode($tech->id),
                ];
            })->toArray(),
            'suggestions' => $suggestions
        ];
    }

    protected function formatTowTruckResults($results)
    {
        if ($results->isEmpty()) {
            return [
                'type' => 'tow_trucks',
                'message' => 'لم يتم العثور على سطحات قريبة. جرب البحث في منطقة أخرى.',
                'count' => 0,
                'items' => [],
                'suggestions' => [
                    'ابحث في مدينة أخرى',
                    'جرب نوع سطحة مختلف',
                    'عرض جميع السطحات'
                ]
            ];
        }

        // Contextual suggestions
        $suggestions = [
            'ابحث عن ورشة صيانة قريبة',
            'ابحث عن قطع غيار'
        ];

        return [
            'type' => 'tow_trucks',
            'count' => $results->count(),
            'items' => $results->map(function ($tow) {
                // Parse socials JSON if it's a string
                $socials = is_string($tow->socials)
                    ? json_decode($tow->socials, true)
                    : (is_array($tow->socials) ? $tow->socials : []);

                // Parse gallery JSON if it's a string
                $gallery = is_string($tow->gallery)
                    ? json_decode($tow->gallery, true)
                    : (is_array($tow->gallery) ? $tow->gallery : []);

                // Get cover image from gallery (first item)
                $coverImage = null;
                if (!empty($gallery) && isset($gallery[0])) {
                    if (isset($gallery[0]['path'])) {
                        $coverImage = url('storage/' . $gallery[0]['path']);
                    } elseif (isset($gallery[0]['url'])) {
                        $coverImage = $gallery[0]['url'];
                    }
                }

                return [
                    'id' => (string) $tow->id,
                    'name' => (string) $tow->name,
                    'vehicleType' => (string) $tow->vehicle_type,
                    'rating' => $tow->average_rating ?? 0,
                    'city' => (string) $tow->city,
                    'distance' => $tow->distance ? round($tow->distance, 1) . ' كم' : null,
                    'isVerified' => $tow->is_verified ? 1 : 0,

                    // ✅ FIX: Use id as phone
                    'phone' => (string) $tow->id,

                    // ✅ ADD: WhatsApp from socials
                    'whatsapp' => isset($socials['whatsapp'])
                        ? (string) $socials['whatsapp']
                        : (string) $tow->id,

                    // ✅ ADD: Description truncated
                    'description' => $tow->description
                        ? mb_substr($tow->description, 0, 100)
                        : '',

                    // ✅ ADD: Profile photo URL
                    'profile_photo' => $tow->profile_photo
                        ? url('storage/' . $tow->profile_photo)
                        : null,

                    // ✅ ADD: Cover image
                    'cover_image' => $coverImage,

                    // ✅ ADD: Profile URL
                    'url' => "/tow-trucks/" . rawurlencode($tow->id),
                ];
            })->toArray(),
            'suggestions' => $suggestions
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
            description: 'أداة بحث ذكية عن السيارات بسوريا. استدعها لأي سؤال عن شراء/إيجار سيارات. 
            
استخرج الفلاتر بذكاء من الكلام الطبيعي:
- الماركة من: تويوتا، هيونداي، كيا، نيسان، هوندا، مرسيدس، BMW، فورد، شيفروليه، رينو، بيجو
- الموديل من: كامري، سوناتا، أكورد، النترا، RAV4، CRV، تاهو، سيراتو، توسان
- السعر: "بأقل من 15 ألف" → max_price=15000, "بين 10 و 20 ألف" → min_price=10000, max_price=20000
- السنة: "2023" → min_year=2023, max_year=2023, "أحدث من 2020" → min_year=2020, "موديل 2022" → min_year=2022, max_year=2022
- المدينة: دمشق، حلب، حمص، حماة، اللاذقية، طرطوس، السويداء، درعا، دير الزور، الرقة، إدلب، القامشلي
- الحالة: "جديد/زيرو" → condition=new, "مستعمل" → condition=used
- ناقل الحركة: "أوتوماتيك" → transmission=automatic, "عادي/يدوي/مانوال" → transmission=manual
- نوع الإعلان: "إيجار/استئجار" → type=rent, "بيع/شراء" → type=sale

أمثلة:
"بدي تويوتا كامري 2023 بدمشق" → query="تويوتا كامري", min_year=2023, max_year=2023, city="دمشق"
"سيارات أقل من 15000 دولار" → max_price=15000
"SUV جديدة أوتوماتيك" → query="SUV", condition="new", transmission="automatic"
"هيونداي مستعملة بحلب" → query="هيونداي", condition="used", city="حلب"',
            parameters: new Schema(
                type: DataType::OBJECT,
                properties: [
                    'query' => new Schema(type: DataType::STRING, description: 'الماركة والموديل (مثل: تويوتا كامري, هيونداي سوناتا, BMW, كيا سيراتو)'),
                    'type' => new Schema(type: DataType::STRING, enum: ['sale', 'rent'], description: 'بيع=sale أو إيجار=rent'),
                    'min_price' => new Schema(type: DataType::NUMBER, description: 'الحد الأدنى للسعر بالدولار'),
                    'max_price' => new Schema(type: DataType::NUMBER, description: 'الحد الأقصى للسعر بالدولار'),
                    'brand_id' => new Schema(type: DataType::NUMBER, description: 'معرّف الماركة (اتركه فارغاً واستخدم query بدلاً منه)'),
                    'min_year' => new Schema(type: DataType::NUMBER, description: 'أقدم سنة صنع (مثل 2020)'),
                    'max_year' => new Schema(type: DataType::NUMBER, description: 'أحدث سنة صنع (مثل 2024)'),
                    'transmission' => new Schema(type: DataType::STRING, enum: ['automatic', 'manual'], description: 'أوتوماتيك=automatic, عادي/يدوي/مانوال=manual'),
                    'fuel_type' => new Schema(type: DataType::STRING, enum: ['gasoline', 'diesel', 'electric', 'hybrid'], description: 'بنزين=gasoline, ديزل=diesel, كهرباء=electric, هجين=hybrid'),
                    'condition' => new Schema(type: DataType::STRING, enum: ['new', 'used', 'certified_pre_owned'], description: 'جديد/زيرو=new, مستعمل=used'),
                    'city' => new Schema(type: DataType::STRING, description: 'اسم المدينة السورية (دمشق, حلب, حمص, حماة, اللاذقية, طرطوس...)'),
                ],
                required: []
            )
        );
    }

    protected function toolSearchTechnicians()
    {
        return new FunctionDeclaration(
            name: 'search_technicians',
            description: 'أداة بحث ذكية عن فنيي الصيانة والميكانيكا في سوريا. استدعها لأي سؤال عن ميكانيكي/فني/ورشة/صيانة/معلم.
            
استخرج الفلاتر بذكاء:
- التخصص: كهرباء، ميكانيك، دهان، تكييف، فحص، صبغ، تويوتا، BMW، مرسيدس
- المدينة: دمشق، حلب، حمص، حماة، اللاذقية، طرطوس، السويداء، درعا، دير الزور
- التقييم: "5 نجوم" → min_rating=5, "ممتاز/منيح" → min_rating=4
- الموقع: "قريب مني" → سيستخدم الموقع الجغرافي تلقائياً

أمثلة:
"بدي فني كهرباء قريب مني" → specialty="كهرباء", (استخدام الموقع)
"ورشة تويوتا بحمص" → specialty="تويوتا", city="حمص"
"معلم صيانة منيح" → min_rating=4
"ميكانيكي BMW بدمشق" → specialty="BMW", city="دمشق"',
            parameters: new Schema(
                type: DataType::OBJECT,
                properties: [
                    'specialty' => new Schema(type: DataType::STRING, description: 'التخصص (مثل: كهرباء، ميكانيك، دهان، صبغ، BMW، تويوتا)'),
                    'city' => new Schema(type: DataType::STRING, description: 'اسم المدينة السورية (دمشق, حلب, حمص, حماة, اللاذقية, طرطوس...)'),
                    'min_rating' => new Schema(type: DataType::NUMBER, description: 'الحد الأدنى للتقييم (1-5)'),
                ]
            )
        );
    }

    protected function toolSearchTowTrucks()
    {
        return new FunctionDeclaration(
            name: 'search_tow_trucks',
            description: 'أداة بحث ذكية عن السطحات والونشات في سوريا. استدعها لأي سؤال عن سطحة/ونش/نقل سيارة/طوارئ/نقّالة.
            
استخرج الفلاتر بذكاء:
- نوع السطحة: سطحة، ونش، نقّالة، هيدروليك
- المدينة: دمشق، حلب، حمص، حماة، اللاذقية، طرطوس، السويداء، درعا
- الاستعجال: "هلق/الآن", "عاجل", "طوارئ" → ابحث عن الأقرب
- الموقع: "قريب مني" → سيستخدم الموقع الجغرافي تلقائياً

أمثلة:
"بدي سطحة قريبة مني هلق" → (استخدام الموقع الجغرافي)
"ونش بحلب" → city="حلب", vehicle_type="ونش"
"سطحة طوارئ بدمشق" → city="دمشق"
"نقّالة هيدروليك" → vehicle_type="هيدروليك"',
            parameters: new Schema(
                type: DataType::OBJECT,
                properties: [
                    'city' => new Schema(type: DataType::STRING, description: 'اسم المدينة السورية (دمشق, حلب, حمص, حماة, اللاذقية, طرطوس...)'),
                    'vehicle_type' => new Schema(type: DataType::STRING, description: 'نوع السطحة (سطحة، ونش، نقّالة، هيدروليك)'),
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
