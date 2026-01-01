<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\StoreCategory;
use App\Models\StoreOrder;
use App\Models\ProductReview;
use App\Events\AdminDashboardEvent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class StoreController extends Controller
{
    /**
     * Transform media paths to accessible URLs
     */
    private function transformMediaPaths($media)
    {
        if (!is_array($media)) {
            return [];
        }

        return array_map(function ($item) {
            if (isset($item['data']) && is_string($item['data'])) {
                // If it's already a full URL (http/https) or base64, keep it
                if (preg_match('/^(https?:\/\/|data:)/', $item['data'])) {
                    return $item;
                }

                // If it starts with /storage/, it's correct
                if (str_starts_with($item['data'], '/storage/')) {
                    return $item;
                }

                // If it doesn't have /storage/, add it
                if (!str_starts_with($item['data'], '/')) {
                    $item['data'] = '/storage/' . $item['data'];
                } else {
                    $item['data'] = '/storage' . $item['data'];
                }
            }
            return $item;
        }, $media);
    }

    /**
     * Transform product data for client consumption
     */
    private function transformProduct($product)
    {
        if (!$product) {
            return null;
        }

        $productArray = $product->toArray();

        // Transform media paths
        if (isset($productArray['media'])) {
            $productArray['media'] = $this->transformMediaPaths($productArray['media']);
        }

        return $productArray;
    }

    public function listProducts(Request $request)
    {
        try {
            $query = Product::query()->with(['category', 'reviews']);

            // Filter by category
            if ($request->has('category_id') && $request->category_id !== 'all') {
                $query->where('store_category_id', $request->category_id);
            }

            // Filter by flash status
            if ($request->has('is_flash')) {
                $query->where('is_flash', $request->boolean('is_flash'));
            }

            // Filter by availability
            if ($request->has('in_stock') && $request->boolean('in_stock')) {
                $query->where('total_stock', '>', 0);
            }

            // Search by name or description
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Filter by target audience
            if ($request->has('target_audience') && $request->target_audience !== 'all') {
                $audience = $request->target_audience;
                $query->where(function ($q) use ($audience) {
                    $q->where('target_audience', $audience)
                        ->orWhere('target_audience', 'all');
                });
            }

            // Order by
            $orderBy = $request->get('order_by', 'created_at');
            $orderDir = $request->get('order_dir', 'desc');
            $query->orderBy($orderBy, $orderDir);

            // Pagination support
            $perPage = $request->get('per_page', null);
            $cursor = $request->get('cursor', null);

            if ($perPage) {
                $perPage = min((int) $perPage, 50); // Max 50 items per page

                // Apply cursor if provided (for cursor-based pagination)
                if ($cursor) {
                    $query->where('id', '<', $cursor);
                }

                $products = $query->limit($perPage + 1)->get();
                $hasMore = $products->count() > $perPage;

                if ($hasMore) {
                    $products = $products->slice(0, $perPage);
                }

                $nextCursor = $hasMore && $products->isNotEmpty() ? $products->last()->id : null;

                // Transform all products
                $transformedProducts = $products->map(function ($product) {
                    return $this->transformProduct($product);
                });

                return response()->json([
                    'data' => $transformedProducts->values(),
                    'next_cursor' => $nextCursor,
                    'has_more' => $hasMore
                ]);
            }

            // No pagination - return all (backward compatibility)
            $products = $query->get();

            // Transform all products
            $transformedProducts = $products->map(function ($product) {
                return $this->transformProduct($product);
            });

            return response()->json(['data' => $transformedProducts]);
        } catch (\Exception $e) {
            \Log::error('Store listProducts error: ' . $e->getMessage());
            return response()->json([
                'message' => 'فشل تحميل المنتجات',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function getProduct($id)
    {
        try {
            $product = Product::with(['reviews', 'category'])->findOrFail($id);
            $transformedProduct = $this->transformProduct($product);

            return response()->json(['data' => $transformedProduct]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'المنتج غير موجود'], 404);
        } catch (\Exception $e) {
            \Log::error('Store getProduct error: ' . $e->getMessage());
            return response()->json([
                'message' => 'فشل تحميل المنتج',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function listCategories()
    {
        try {
            $categories = StoreCategory::all();
            return response()->json(['data' => $categories]);
        } catch (\Exception $e) {
            \Log::error('Store listCategories error: ' . $e->getMessage());
            return response()->json([
                'message' => 'فشل تحميل الفئات',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function purchase(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'delivery_method' => 'required|in:shipping,pickup',
            'shipping_address' => 'required_if:delivery_method,shipping|string|nullable',
            'selected_city' => 'nullable|string',
            'contact_phone' => 'required|string|max:20',
            'payment_method_id' => 'required|string',
            'payment_method_name' => 'nullable|string',
            'payment_receipt' => 'nullable|string', // Base64 encoded image
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'يجب تسجيل الدخول أولاً'], 401);
        }

        $orders = [];
        $totalAmount = 0;

        try {
            \DB::beginTransaction();

            // Pre-validate all products and stock
            foreach ($validated['items'] as $item) {
                $product = Product::lockForUpdate()->findOrFail($item['product_id']);

                // Check if product is available for purchase
                if ($product->total_stock < $item['quantity']) {
                    \DB::rollBack();
                    return response()->json([
                        'message' => "عذراً، المنتج '{$product->name}' غير متوفر بالكمية المطلوبة. المتوفر: {$product->total_stock}"
                    ], 400);
                }

                // Check purchase limit
                if ($item['quantity'] > $product->purchase_limit_per_buyer) {
                    \DB::rollBack();
                    return response()->json([
                        'message' => "عذراً، الحد الأقصى للشراء من '{$product->name}' هو {$product->purchase_limit_per_buyer} قطعة"
                    ], 400);
                }

                // Check if product is expired (for flash products)
                if ($product->is_flash && $product->expires_at && $product->expires_at < now()) {
                    \DB::rollBack();
                    return response()->json([
                        'message' => "عذراً، العرض على المنتج '{$product->name}' قد انتهى"
                    ], 400);
                }
            }

            // Process receipt if provided
            $receiptUrl = null;
            if ($request->has('payment_receipt') && $request->payment_receipt) {
                $receiptData = $request->payment_receipt;

                // Check if it's base64 encoded
                if (preg_match('/^data:image\/(\w+);base64,/', $receiptData, $type)) {
                    $receiptData = substr($receiptData, strpos($receiptData, ',') + 1);
                    $fileType = strtolower($type[1]);
                    $decodedData = base64_decode($receiptData);

                    if ($decodedData !== false) {
                        $filename = 'receipts/' . Str::uuid() . '.' . $fileType;
                        \Storage::disk('public')->put($filename, $decodedData);
                        $receiptUrl = '/storage/' . $filename;
                    }
                } else {
                    // Already a URL
                    $receiptUrl = $receiptData;
                }
            }

            // Create orders and update stock
            $orderGroupId = 'ORG-' . strtoupper(Str::random(10));

            foreach ($validated['items'] as $item) {
                $product = Product::lockForUpdate()->findOrFail($item['product_id']);

                // Calculate shipping cost
                // Calculate shipping cost
                $shippingCost = 0;
                if ($validated['delivery_method'] === 'shipping') {
                    // 1. Static shipping cost
                    if ($product->static_shipping_cost !== null) {
                        $shippingCost = $product->static_shipping_cost;
                    } else {
                        // 2. Dynamic shipping based on city and size
                        $city = $request->input('selected_city', 'Damascus');

                        $limitSettings = \App\Models\SystemSettings::getSetting('limitSettings');
                        $shippingPrices = $limitSettings['shippingPrices'] ?? [];

                        // Find city prices
                        $cityPrices = null;
                        foreach ($shippingPrices as $price) {
                            if ($price['city'] === $city) {
                                $cityPrices = $price;
                                break;
                            }
                        }

                        // Fallback to 'Other' if city not found
                        if (!$cityPrices) {
                            foreach ($shippingPrices as $price) {
                                if ($price['city'] === 'أخرى') {
                                    $cityPrices = $price;
                                    break;
                                }
                            }
                        }

                        if ($cityPrices) {
                            $size = $product->shipping_size ?? 'm';
                            $shippingCost = $cityPrices[$size] ?? 0;
                        }
                    }
                }

                $itemTotal = ($product->price * $item['quantity']) + $shippingCost;
                $totalAmount += $itemTotal;

                // Determine initial status based on payment method
                $isCOD = str_contains(strtolower($validated['payment_method_id']), 'cod');
                $initialStatus = $isCOD ? 'pending' : 'payment_verification';

                $order = StoreOrder::create([
                    'id' => 'STR-' . strtoupper(Str::random(8)),
                    'order_group_id' => $orderGroupId,
                    'product_id' => $product->id,
                    'buyer_id' => $user->phone ?? $user->id, // Use phone number for notifications
                    'buyer_type' => $this->getUserType($user),
                    'buyer_name' => $user->name,
                    'buyer_unique_id' => $user->unique_id ?? $user->id,
                    'quantity' => $item['quantity'],
                    'total_price' => $itemTotal,
                    'shipping_cost' => $shippingCost,
                    'status' => $initialStatus,
                    'delivery_method' => $validated['delivery_method'],
                    'shipping_address' => $validated['shipping_address'] ?? null,
                    'contact_phone' => $validated['contact_phone'],
                    'payment_method_id' => $validated['payment_method_id'],
                    'payment_method_name' => $validated['payment_method_name'] ?? $validated['payment_method_id'],
                    'payment_receipt_url' => $receiptUrl,
                    'request_date' => now(),
                ]);

                // Decrement total stock immediately to prevent overselling
                $product->decrement('total_stock', $item['quantity']);

                // Increment reserved stock to track pending orders
                $product->increment('reserved_stock', $item['quantity']);

                $orders[] = $order;

                // Send notification to customer for flash product request
                if ($product->is_flash) {
                    try {
                        if ($user) {
                            \App\Models\Notification::create([
                                'user_id' => $user->id,
                                'title' => 'تم إرسال طلب المنتج الفوري',
                                'message' => "تم استلام طلبك للمنتج {$product->name}. سيتم مراجعته من قبل الإدارة قريباً.",
                                'type' => 'FLASH_PRODUCT_REQUEST_SUBMITTED',
                                'link' => json_encode(['view' => 'store', 'params' => ['tab' => 'orders']]),
                                'read' => false,
                            ]);

                            event(new \App\Events\UserNotification($user->id, [
                                'title' => 'تم إرسال طلب المنتج الفوري',
                                'message' => "تم استلام طلبك للمنتج {$product->name}. سيتم مراجعته من قبل الإدارة قريباً.",
                                'type' => 'FLASH_PRODUCT_REQUEST_SUBMITTED',
                                'link' => json_encode(['view' => 'store', 'params' => ['tab' => 'orders']]),
                            ]));
                        }
                    } catch (\Exception $e) {
                        \Log::warning('Failed to send flash product request notification: ' . $e->getMessage());
                    }
                }
            }

            // Save address to user profile if shipping method is used
            if (
                $validated['delivery_method'] === 'shipping' &&
                isset($validated['shipping_address']) &&
                isset($validated['contact_phone'])
            ) {

                // Extract city from the request (it should be in validated data)
                $city = $request->input('selected_city', 'Damascus'); // default to Damascus if not provided

                try {
                    $user->saveAddress(
                        $city,
                        $validated['shipping_address'],
                        $validated['contact_phone']
                    );
                } catch (\Exception $e) {
                    // Log but don't fail the order if address saving fails
                    \Log::warning('Failed to save user address: ' . $e->getMessage());
                }
            }

            \DB::commit();

            // Send notification to admin
            try {
                $adminPhone = \App\Models\SystemSettings::getSetting('adminPhone', '+963999999999');
                \Log::info("Sending store order notification to admin: {$adminPhone}");

                // Check if order contains flash products
                $hasFlashProducts = collect($orders)->contains(function ($order) {
                    $product = Product::find($order->product_id);
                    return $product && $product->is_flash;
                });

                $notificationType = $hasFlashProducts ? 'NEW_FLASH_PRODUCT_REQUEST' : 'NEW_STORE_ORDER';
                $title = $hasFlashProducts ? 'طلب منتج فوري جديد' : 'طلب متجر جديد';

                $adminUser = \App\Models\User::where('phone', $adminPhone)->first();
                if ($adminUser) {
                    event(new \App\Events\UserNotification($adminUser->id, [
                        'title' => $title,
                        'message' => "طلب جديد من {$user->name} بقيمة \${$totalAmount}",
                        'type' => $notificationType,
                        'link' => json_encode(['view' => 'adminDashboard', 'params' => ['adminView' => 'store_orders']]),
                    ]));
                }
                \Log::info("Store order notification event dispatched successfully");
            } catch (\Exception $e) {
                \Log::warning('Failed to send store order notification: ' . $e->getMessage());
            }

            // Broadcast to admin dashboard for real-time refresh
            event(new AdminDashboardEvent('store_order.created', [
                'order_count' => count($orders),
                'total_amount' => $totalAmount,
                'buyer_name' => $user->name,
            ]));

            return response()->json([
                'message' => 'تم إنشاء الطلب بنجاح',
                'data' => $orders
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            \DB::rollBack();
            return response()->json([
                'message' => 'أحد المنتجات المطلوبة غير موجود'
            ], 404);
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Store purchase error: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'message' => 'حدث خطأ أثناء معالجة الطلب',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    private function getUserType($user)
    {
        // Determine user type based on the model class or attributes
        $class = get_class($user);
        if (str_contains($class, 'Customer'))
            return 'customer';
        if (str_contains($class, 'Provider'))
            return 'provider';
        if (str_contains($class, 'Technician'))
            return 'technician';
        if (str_contains($class, 'TowTruck'))
            return 'tow_truck';
        return 'customer'; // default
    }

    public function listOrders(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'يجب تسجيل الدخول أولاً'], 401);
            }

            $query = StoreOrder::query()
                ->where(function ($q) use ($user) {
                    // Match by phone (how orders are saved) or by id (fallback)
                    $q->where('buyer_id', $user->phone)
                        ->orWhere('buyer_id', $user->id);
                })
                ->with('product')
                ->orderBy('created_at', 'desc');

            // Filter by status if provided
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Pagination support
            $perPage = $request->get('per_page', null);
            $cursor = $request->get('cursor', null);

            if ($perPage) {
                $perPage = min((int) $perPage, 50); // Max 50 items per page

                // Apply cursor if provided (for cursor-based pagination)
                if ($cursor) {
                    $query->where('id', '<', $cursor);
                }

                $orders = $query->limit($perPage + 1)->get();
                $hasMore = $orders->count() > $perPage;

                if ($hasMore) {
                    $orders = $orders->slice(0, $perPage);
                }

                $nextCursor = $hasMore && $orders->isNotEmpty() ? $orders->last()->id : null;

                // Transform product media in orders
                $transformedOrders = $orders->map(function ($order) {
                    $orderArray = $order->toArray();
                    if (isset($orderArray['product']) && isset($orderArray['product']['media'])) {
                        $orderArray['product']['media'] = $this->transformMediaPaths($orderArray['product']['media']);
                    }
                    return $orderArray;
                });

                return response()->json([
                    'data' => $transformedOrders->values(),
                    'next_cursor' => $nextCursor,
                    'has_more' => $hasMore
                ]);
            }

            // No pagination - return all (backward compatibility)
            $orders = $query->get();

            // Transform product media in orders
            $transformedOrders = $orders->map(function ($order) {
                $orderArray = $order->toArray();
                if (isset($orderArray['product']) && isset($orderArray['product']['media'])) {
                    $orderArray['product']['media'] = $this->transformMediaPaths($orderArray['product']['media']);
                }
                return $orderArray;
            });

            return response()->json(['data' => $transformedOrders]);
        } catch (\Exception $e) {
            \Log::error('Store listOrders error: ' . $e->getMessage());
            return response()->json([
                'message' => 'فشل تحميل الطلبات',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function addReview(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'required|string|max:1000',
            ]);

            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'يجب تسجيل الدخول أولاً'], 401);
            }

            // Check if product exists
            $product = Product::findOrFail($id);

            // Check if user has purchased this product (check all buyer ID fields)
            $hasPurchased = StoreOrder::where(function ($q) use ($user) {
                $q->where('buyer_id', $user->phone)
                    ->orWhere('buyer_id', $user->id)
                    ->orWhere('buyer_unique_id', $user->id)
                    ->orWhere('buyer_unique_id', $user->unique_id ?? $user->id);
            })
                ->where('product_id', $id)
                ->whereIn('status', ['delivered', 'completed'])
                ->exists();

            if (!$hasPurchased) {
                return response()->json([
                    'message' => 'يجب شراء المنتج أولاً لتتمكن من تقييمه'
                ], 403);
            }

            // Check if user already reviewed this product
            $existingReview = ProductReview::where('product_id', $id)
                ->where('user_id', $user->id)
                ->first();

            if ($existingReview) {
                return response()->json([
                    'message' => 'لقد قمت بتقييم هذا المنتج مسبقاً'
                ], 400);
            }

            $review = ProductReview::create([
                'id' => Str::uuid(),
                'product_id' => $id,
                'user_id' => $user->id,
                'user_name' => $user->name,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'],
                'date' => now(),
            ]);

            // Update product average rating
            $this->updateProductAverageRating($product);

            // Notify admin about new review
            try {
                $adminPhone = env('ADMIN_PHONE', '+963999999999');
                $adminUser = \App\Models\User::where('phone', $adminPhone)->first();
                if ($adminUser) {
                    event(new \App\Events\UserNotification($adminUser->id, [
                        'title' => 'تقييم منتج جديد',
                        'message' => "قام {$user->name} بتقييم {$product->name} بـ {$validated['rating']} نجوم",
                        'type' => 'NEW_PRODUCT_REVIEW',
                        'link' => json_encode(['view' => 'adminDashboard', 'params' => ['adminView' => 'products']]),
                    ]));
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to send review notification: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'تم إضافة التقييم بنجاح',
                'data' => $review
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'المنتج غير موجود'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'بيانات غير صحيحة',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Store addReview error: ' . $e->getMessage());
            return response()->json([
                'message' => 'فشل إضافة التقييم',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update product average rating
     */
    private function updateProductAverageRating($product)
    {
        $averageRating = ProductReview::where('product_id', $product->id)
            ->avg('rating');

        $product->update(['average_rating' => round($averageRating, 2)]);
    }

    /**
     * Customer cancels their order
     */
    public function cancelOrder(Request $request, $orderId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'يجب تسجيل الدخول أولاً'], 401);
            }

            $order = StoreOrder::findOrFail($orderId);

            // Verify order belongs to user (check both phone and id)
            if ($order->buyer_id !== $user->phone && $order->buyer_id !== $user->id) {
                return response()->json(['message' => 'غير مصرح لك بإلغاء هذا الطلب'], 403);
            }

            // Only allow cancellation for pending or payment_verification orders
            if (!in_array($order->status, ['pending', 'payment_verification'])) {
                return response()->json([
                    'message' => 'لا يمكن إلغاء هذا الطلب في حالته الحالية'
                ], 400);
            }

            \DB::beginTransaction();
            try {
                // Restore total stock (make it available again)
                $product = Product::find($order->product_id);
                if ($product) {
                    $product->increment('total_stock', $order->quantity);
                    $product->decrement('reserved_stock', $order->quantity);
                }

                // Update order status
                $order->update([
                    'status' => 'cancelled',
                    'admin_notes' => 'تم الإلغاء من قبل العميل',
                    'decision_date' => now()
                ]);

                \DB::commit();

                // Notify admin
                try {
                    $adminPhone = env('ADMIN_PHONE', '+963999999999');
                    $adminUser = \App\Models\User::where('phone', $adminPhone)->first();
                    if ($adminUser) {
                        event(new \App\Events\UserNotification($adminUser->id, [
                            'title' => 'إلغاء طلب متجر',
                            'message' => "قام {$user->name} بإلغاء الطلب {$order->id}",
                            'type' => 'STORE_ORDER_CANCELLED',
                            'link' => json_encode(['view' => 'adminDashboard', 'params' => ['adminView' => 'store_orders']]),
                        ]));
                    }
                } catch (\Exception $e) {
                    \Log::warning('Failed to send cancellation notification: ' . $e->getMessage());
                }

                // Broadcast to admin dashboard for real-time refresh
                event(new AdminDashboardEvent('store_order.cancelled', [
                    'order_id' => $order->id,
                    'buyer_name' => $user->name,
                ]));

                return response()->json([
                    'message' => 'تم إلغاء الطلب بنجاح',
                    'data' => $order
                ]);
            } catch (\Exception $e) {
                \DB::rollBack();
                throw $e;
            }
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'الطلب غير موجود'], 404);
        } catch (\Exception $e) {
            \Log::error('Order cancellation error: ' . $e->getMessage());
            return response()->json([
                'message' => 'فشل إلغاء الطلب',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update order status (admin only - called from AdminController)
     */
    public function updateOrderStatus(Request $request, $orderId)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:pending,payment_verification,confirmed,preparing,shipped,delivered,completed,cancelled,refunded',
                'admin_notes' => 'nullable|string|max:500',
                'tracking_number' => 'nullable|string|max:100',
            ]);

            $order = StoreOrder::findOrFail($orderId);

            $order->update([
                'status' => $validated['status'],
                'admin_notes' => $validated['admin_notes'] ?? $order->admin_notes,
                'tracking_number' => $validated['tracking_number'] ?? $order->tracking_number,
            ]);

            // If order is cancelled or refunded, restore stock
            if (in_array($validated['status'], ['cancelled', 'refunded'])) {
                Product::where('id', $order->product_id)
                    ->increment('total_stock', $order->quantity);
            }

            // Send notification to buyer
            try {
                $statusMessages = [
                    'confirmed' => 'تم تأكيد طلبك',
                    'preparing' => 'جاري تحضير طلبك',
                    'shipped' => 'تم شحن طلبك',
                    'delivered' => 'تم توصيل طلبك',
                    'cancelled' => 'تم إلغاء طلبك',
                    'refunded' => 'تم استرداد قيمة طلبك',
                ];

                if (isset($statusMessages[$validated['status']])) {
                    $buyerUser = \App\Models\User::where('phone', $order->buyer_id)->first();
                    if ($buyerUser) {
                        event(new \App\Events\UserNotification($buyerUser->id, [
                            'title' => $statusMessages[$validated['status']],
                            'message' => "طلب رقم: {$order->id}",
                            'type' => 'STORE_ORDER_STATUS',
                            'link' => json_encode(['view' => 'store', 'params' => ['tab' => 'orders']]),
                        ]));
                    }
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to send order status notification: ' . $e->getMessage());
            }

            // Broadcast to admin dashboard for real-time refresh
            event(new AdminDashboardEvent('store_order.status_updated', [
                'order_id' => $order->id,
                'status' => $validated['status'],
            ]));

            return response()->json([
                'message' => 'تم تحديث حالة الطلب',
                'data' => $order
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'الطلب غير موجود'], 404);
        } catch (\Exception $e) {
            \Log::error('Store updateOrderStatus error: ' . $e->getMessage());
            return response()->json([
                'message' => 'فشل تحديث حالة الطلب',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the saved address for the authenticated user
     */
    public function getSavedAddress(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'يجب تسجيل الدخول أولاً'], 401);
            }

            // Get the last saved address
            $lastAddress = $user->getLastSavedAddress();

            if ($lastAddress) {
                return response()->json([
                    'data' => $lastAddress
                ]);
            }

            // Return empty object if no saved address
            return response()->json([
                'data' => null
            ]);

        } catch (\Exception $e) {
            \Log::error('getSavedAddress error: ' . $e->getMessage());
            return response()->json([
                'message' => 'فشل تحميل العنوان المحفوظ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate shipping cost based on cart items and city
     */
    public function calculateShipping(Request $request)
    {
        try {
            $validated = $request->validate([
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'city' => 'required|string',
            ]);

            $totalShipping = 0;
            $limitSettings = \App\Models\SystemSettings::getSetting('limitSettings');
            $shippingPrices = $limitSettings['shippingPrices'] ?? [];

            // Find city prices or default to 'Other'
            $cityPrices = null;
            foreach ($shippingPrices as $price) {
                if ($price['city'] === $validated['city']) {
                    $cityPrices = $price;
                    break;
                }
            }

            if (!$cityPrices) {
                foreach ($shippingPrices as $price) {
                    if ($price['city'] === 'أخرى') {
                        $cityPrices = $price;
                        break;
                    }
                }
            }

            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                if (!$product)
                    continue;

                // If product has static shipping cost, use it
                if ($product->static_shipping_cost !== null) {
                    $totalShipping += $product->static_shipping_cost;
                    continue;
                }

                // Otherwise use size-based calculation
                if ($cityPrices) {
                    $size = $product->shipping_size ?? 'm';
                    $cost = $cityPrices[$size] ?? 0;
                    $totalShipping += $cost;
                }
            }

            return response()->json([
                'cost' => $totalShipping
            ]);

        } catch (\Exception $e) {
            \Log::error('Shipping calculation error: ' . $e->getMessage());
            return response()->json([
                'message' => 'فشل حساب تكلفة الشحن',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
