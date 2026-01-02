<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\DirectoryController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\TowTruckController;
use App\Http\Controllers\TechnicianController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Auth with rate limiting
Route::prefix('auth')->group(function () {
    Route::post('/check-phone', [AuthController::class, 'checkPhone']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register/customer', [AuthController::class, 'registerCustomer']);
    Route::post('/register/technician', [AuthController::class, 'registerTechnician']);
    Route::post('/register/tow-truck', [AuthController::class, 'registerTowTruck']);

    // OTP endpoints with strict rate limiting to prevent abuse
    Route::middleware(['throttle:5,1'])->group(function () {
        Route::post('/otp/send', [AuthController::class, 'sendOtp']);
    });

    Route::middleware(['throttle:10,1'])->group(function () {
        Route::post('/otp/verify', [AuthController::class, 'verifyOtp']);
    });

    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Admin Auth
Route::post('/admin/login', [AdminController::class, 'login']);
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthorized'], 401);
})->name('login');

// File Upload (Public - will be protected by Sanctum in protected routes)
Route::post('/upload', [UploadController::class, 'upload']);
Route::post('/upload/multiple', [UploadController::class, 'uploadMultiple']);
Route::delete('/upload', [UploadController::class, 'delete']);


// Notifications (Public - Testing)
Route::prefix('notifications')->group(function () {
    Route::post('/test-whatsapp', [App\Http\Controllers\NotificationController::class, 'testWhatsApp']);
    Route::get('/stats', [App\Http\Controllers\NotificationController::class, 'getStats']);

    // Test endpoint to send real-time notification
    Route::post('/test-send', function (Illuminate\Http\Request $request) {
        $userId = $request->input('user_id', '+905319624826');

        // Create notification
        $notification = \App\Models\Notification::create([
            'user_id' => $userId,
            'title' => '🔔 Test Real-Time Notification',
            'message' => 'This is a test notification to verify real-time broadcasting is working! 🎉',
            'type' => 'info',
            'read' => false,
        ]);

        // Broadcast real-time
        event(new \App\Events\UserNotification($userId, $notification->toArray()));

        return response()->json([
            'success' => true,
            'message' => 'Test notification sent!',
            'notification' => $notification,
            'user_id' => $userId,
        ]);
    });
});


// Public Directories
Route::get('/technicians', [DirectoryController::class, 'listTechnicians']);
Route::get('/technicians/{id}', [DirectoryController::class, 'getTechnician']);
Route::get('/technicians/{id}/reviews', [App\Http\Controllers\ReviewController::class, 'technicianReviews']);
Route::get('/tow-trucks', [DirectoryController::class, 'listTowTrucks']);
Route::get('/tow-trucks/{id}', [DirectoryController::class, 'getTowTruck']);
Route::get('/tow-trucks/{id}/reviews', [App\Http\Controllers\ReviewController::class, 'towTruckReviews']);

// Store (Public)
Route::get('/store/products', [StoreController::class, 'listProducts']);
Route::get('/store/products/{id}', [StoreController::class, 'getProduct']);
Route::get('/store/categories', [StoreController::class, 'listCategories']);

// Blog & FAQ (Public)
Route::get('/blog', [App\Http\Controllers\ContentController::class, 'listBlogPosts']);
Route::get('/blog/{identifier}', [App\Http\Controllers\ContentController::class, 'getBlogPost']);
Route::get('/faq', [App\Http\Controllers\ContentController::class, 'listFaqItems']);
Route::get('/faq/{id}', [App\Http\Controllers\ContentController::class, 'getFaqItem']);
Route::get('/announcements', [App\Http\Controllers\ContentController::class, 'listAnnouncements']);

// Settings (Public - Read Only)
Route::get('/admin/settings', [App\Http\Controllers\Admin\SettingsController::class, 'getSettings']);

// Vehicle Data (Public - for form dropdowns)
Route::get('/vehicle/data', [App\Http\Controllers\Admin\VehicleDataController::class, 'getAllData']);

// Broadcasting authentication (for Laravel Echo private channels)
// Must be placed before protected routes but requires auth
Broadcast::routes(['middleware' => ['auth:sanctum']]);
// Load channels
require base_path('routes/channels.php');

// Technician Profile Management (for authenticated technicians)
Route::middleware(['auth:sanctum'])->prefix('technician')->group(function () {
    Route::get('/profile', [TechnicianController::class, 'getProfile']);
    Route::put('/profile', [TechnicianController::class, 'updateProfile']);
    Route::post('/profile/photo', [TechnicianController::class, 'uploadProfilePhoto']);
    Route::post('/profile/gallery', [TechnicianController::class, 'uploadGalleryImage']);
    Route::delete('/profile/gallery/{index}', [TechnicianController::class, 'deleteGalleryItem']);
    Route::get('/stats', [TechnicianController::class, 'getDashboardStats']);
});

// Tow Truck Profile Management (for authenticated tow trucks)
Route::middleware(['auth:sanctum'])->prefix('tow-truck')->group(function () {
    Route::get('/stats', [TowTruckController::class, 'getDashboardStats']);
    // Future routes like profile update can be moved here from generically handling them or kept as is if working fine for now.
    // user/profile update is handled by AuthController generic updateProfile
});

// Provider Wallet Routes
Route::middleware(['auth:sanctum'])->prefix('provider')->group(function () {
    Route::get('/open-orders', [App\Http\Controllers\ProviderController::class, 'getOpenOrders']);
    Route::get('/my-bids', [App\Http\Controllers\ProviderController::class, 'getMyBids']);
    Route::get('/accepted-orders', [App\Http\Controllers\ProviderController::class, 'getAcceptedOrders']);
    Route::put('/orders/{orderNumber}/status', [App\Http\Controllers\ProviderController::class, 'updateAcceptedOrderStatus']);
    Route::get('/overview-data', [App\Http\Controllers\ProviderController::class, 'getOverviewData']);
    Route::get('/transactions', [App\Http\Controllers\ProviderController::class, 'getTransactions']);
    Route::get('/withdrawals', [App\Http\Controllers\ProviderController::class, 'getWithdrawals']);
    Route::get('/wallet-balance', [App\Http\Controllers\ProviderController::class, 'getWalletBalance']);
    Route::post('/withdrawals', [App\Http\Controllers\ProviderController::class, 'requestWithdrawal']);
    Route::put('/profile', [App\Http\Controllers\ProviderController::class, 'updateProfile']);

    // Provider Reviews
    Route::get('/reviews', [App\Http\Controllers\ReviewController::class, 'index']);
    Route::post('/reviews/{id}/moderate', [App\Http\Controllers\ReviewController::class, 'moderate']);
    Route::post('/reviews/{id}/respond', [App\Http\Controllers\ReviewController::class, 'respond']);
});

// User Wallet Routes (for customers, technicians, tow trucks)
Route::middleware(['auth:sanctum'])->prefix('wallet')->group(function () {
    Route::get('/balance', [App\Http\Controllers\WalletController::class, 'getBalance']);
    Route::get('/transactions', [App\Http\Controllers\WalletController::class, 'getTransactions']);
    Route::get('/deposits', [App\Http\Controllers\WalletController::class, 'getDeposits']);
    Route::get('/withdrawals', [App\Http\Controllers\WalletController::class, 'getWithdrawals']);
    Route::post('/deposit', [App\Http\Controllers\WalletController::class, 'submitDeposit']);
    Route::post('/withdraw', [App\Http\Controllers\WalletController::class, 'submitWithdrawal']);
    Route::post('/pay', [App\Http\Controllers\WalletController::class, 'payFromWallet']);

    // Payment methods management
    Route::get('/payment-methods', [App\Http\Controllers\WalletController::class, 'getPaymentMethods']);
    Route::post('/payment-methods', [App\Http\Controllers\WalletController::class, 'addPaymentMethod']);
    Route::put('/payment-methods/{methodId}', [App\Http\Controllers\WalletController::class, 'updatePaymentMethod']);
    Route::delete('/payment-methods/{methodId}', [App\Http\Controllers\WalletController::class, 'deletePaymentMethod']);
    Route::post('/payment-methods/{methodId}/set-primary', [App\Http\Controllers\WalletController::class, 'setPrimaryPaymentMethod']);
});

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    // International License (Authed)
    Route::get('/international-license/pricing', [App\Http\Controllers\InternationalLicenseController::class, 'getPricing']);
    Route::post('/international-license/step1', [App\Http\Controllers\InternationalLicenseController::class, 'storeStep1']);
    Route::post('/international-license/upload-documents', [App\Http\Controllers\InternationalLicenseController::class, 'uploadDocuments']);
    Route::post('/international-license/upload-payment-proof', [App\Http\Controllers\InternationalLicenseController::class, 'uploadPaymentProof']);
    Route::post('/international-license/attach-proof', [App\Http\Controllers\InternationalLicenseController::class, 'attachProofOfPayment']);
    Route::post('/international-license/final-submit', [App\Http\Controllers\InternationalLicenseController::class, 'finalSubmit']);
    Route::get('/international-license/my-requests', [App\Http\Controllers\InternationalLicenseController::class, 'index']);

    // Re-upload routes (Correction)
    Route::post('/international-license/requests/{id}/reupload-payment', [App\Http\Controllers\InternationalLicenseController::class, 'updatePaymentProof']);
    Route::post('/international-license/requests/{id}/reupload-documents', [App\Http\Controllers\InternationalLicenseController::class, 'updateDocuments']);

    // User Info
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        $userData = null;

        if ($user->role === 'customer') {
            $userData = $user->customer;
        } elseif ($user->role === 'provider') {
            $userData = $user->provider;
        } elseif ($user->role === 'technician') {
            $userData = $user->technician;
        } elseif ($user->role === 'tow_truck') {
            $userData = $user->towTruck;
        }

        if ($userData) {
            $userData->phone = $user->phone;
            return $userData;
        }

        return $user;
    });
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // Orders
    Route::post('/orders', [OrderController::class, 'create']);
    Route::get('/orders', [OrderController::class, 'list']);
    Route::get('/orders/{orderNumber}', [OrderController::class, 'show']);
    Route::post('/orders/{orderNumber}/quotes', [OrderController::class, 'submitQuote']);
    Route::post('/orders/{orderNumber}/accept', [OrderController::class, 'acceptQuote']);
    Route::patch('/orders/{orderNumber}/status', [OrderController::class, 'updateStatus']);

    // Store (Protected)
    Route::post('/store/purchase', [StoreController::class, 'purchase']);
    Route::get('/store/orders', [StoreController::class, 'listOrders']);
    Route::post('/store/products/{id}/review', [StoreController::class, 'addReview']);
    Route::post('/store/orders/{id}/cancel', [StoreController::class, 'cancelOrder']);
    Route::get('/store/saved-address', [StoreController::class, 'getSavedAddress']);
    Route::post('/store/calculate-shipping', [StoreController::class, 'calculateShipping']);

    // Notifications (Protected)
    Route::prefix('notifications')->group(function () {
        Route::get('/', [App\Http\Controllers\NotificationController::class, 'getUserNotifications']);
        Route::get('/unread-count', [App\Http\Controllers\NotificationController::class, 'getUnreadCount']);
        Route::post('/{id}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read', [App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
        Route::delete('/{id}', [App\Http\Controllers\NotificationController::class, 'deleteNotification']);
        Route::delete('/', [App\Http\Controllers\NotificationController::class, 'clearAll']);
        Route::post('/send', [App\Http\Controllers\NotificationController::class, 'sendNotification']); // Admin use
        Route::post('/send-bulk', [App\Http\Controllers\NotificationController::class, 'sendBulk']); // Admin use
        Route::post('/subscribe', [App\Http\Controllers\NotificationController::class, 'subscribe']);
    });

    // Reviews (Customer)
    Route::prefix('reviews')->group(function () {
        Route::post('/', [App\Http\Controllers\ReviewController::class, 'store']);
        Route::get('/my-reviews', [App\Http\Controllers\ReviewController::class, 'myReviews']);
    });


    // Admin
    Route::prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        // Server Status
        Route::get('/server-status', [App\Http\Controllers\Admin\ServerStatusController::class, 'getStatus']);

        // System Maintenance Hub
        Route::group(['prefix' => 'maintenance'], function () {
            Route::get('/stats', [App\Http\Controllers\Admin\MaintenanceController::class, 'getStats']);
            Route::post('/settings', [App\Http\Controllers\Admin\MaintenanceController::class, 'saveSettings']);
            Route::post('/action', [App\Http\Controllers\Admin\MaintenanceController::class, 'runAction']);
            Route::get('/files', [App\Http\Controllers\Admin\MaintenanceController::class, 'listFiles']);
            Route::delete('/files', [App\Http\Controllers\Admin\MaintenanceController::class, 'deleteFile']);
            Route::post('/files/bulk-delete', [App\Http\Controllers\Admin\MaintenanceController::class, 'bulkDelete']);
            Route::get('/files/download', [App\Http\Controllers\Admin\MaintenanceController::class, 'downloadFile']);
            Route::get('/backup', [App\Http\Controllers\Admin\MaintenanceController::class, 'downloadBackup']);
        });

        // Financials (Provider)
        Route::get('/withdrawals', [App\Http\Controllers\Admin\FinancialController::class, 'listWithdrawals']);
        Route::post('/withdrawals/{id}/approve', [App\Http\Controllers\Admin\FinancialController::class, 'approveWithdrawal']);
        Route::post('/withdrawals/{id}/reject', [App\Http\Controllers\Admin\FinancialController::class, 'rejectWithdrawal']);
        Route::get('/transactions', [App\Http\Controllers\Admin\FinancialController::class, 'listTransactions']);
        Route::post('/providers/{id}/add-funds', [App\Http\Controllers\Admin\FinancialController::class, 'addFunds']);

        // Financials (User Wallet - customers, technicians, tow trucks)
        Route::get('/user-deposits', [App\Http\Controllers\Admin\FinancialController::class, 'listUserDeposits']);
        Route::post('/user-deposits/{id}/approve', [App\Http\Controllers\Admin\FinancialController::class, 'approveUserDeposit']);
        Route::post('/user-deposits/{id}/reject', [App\Http\Controllers\Admin\FinancialController::class, 'rejectUserDeposit']);
        Route::get('/user-withdrawals', [App\Http\Controllers\Admin\FinancialController::class, 'listUserWithdrawals']);
        Route::post('/user-withdrawals/{id}/approve', [App\Http\Controllers\Admin\FinancialController::class, 'approveUserWithdrawal']);
        Route::post('/user-withdrawals/{id}/reject', [App\Http\Controllers\Admin\FinancialController::class, 'rejectUserWithdrawal']);
        Route::get('/user-transactions', [App\Http\Controllers\Admin\FinancialController::class, 'listUserTransactions']);
        Route::post('/users/{id}/add-funds', [App\Http\Controllers\Admin\FinancialController::class, 'addUserFunds']);

        // Settings (Update only - GET is public)
        Route::put('/settings', [App\Http\Controllers\Admin\SettingsController::class, 'updateSettings']);

        // Vehicle Data & Specialties
        Route::apiResource('/vehicle/categories', App\Http\Controllers\Admin\VehicleDataController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('/vehicle/brands', App\Http\Controllers\Admin\VehicleDataController::class)->only(['index', 'store', 'update', 'destroy']); // Note: You might need separate controllers or methods if using apiResource, or just custom routes
        // Custom routes for Vehicle Data to keep it simple in one controller
        Route::get('/vehicle/data', [App\Http\Controllers\Admin\VehicleDataController::class, 'getAllData']);
        Route::post('/vehicle/categories', [App\Http\Controllers\Admin\VehicleDataController::class, 'saveCategory']);
        Route::delete('/vehicle/categories/{id}', [App\Http\Controllers\Admin\VehicleDataController::class, 'deleteCategory']);
        Route::post('/vehicle/brands', [App\Http\Controllers\Admin\VehicleDataController::class, 'saveBrand']);
        Route::delete('/vehicle/brands/{id}', [App\Http\Controllers\Admin\VehicleDataController::class, 'deleteBrand']);
        Route::post('/vehicle/models', [App\Http\Controllers\Admin\VehicleDataController::class, 'saveModel']);
        Route::delete('/vehicle/models/{id}', [App\Http\Controllers\Admin\VehicleDataController::class, 'deleteModel']);
        Route::post('/vehicle/part-types', [App\Http\Controllers\Admin\VehicleDataController::class, 'savePartType']);
        Route::delete('/vehicle/part-types/{id}', [App\Http\Controllers\Admin\VehicleDataController::class, 'deletePartType']);
        Route::post('/technicians/specialties', [App\Http\Controllers\Admin\VehicleDataController::class, 'saveSpecialty']);
        Route::delete('/technicians/specialties/{id}', [App\Http\Controllers\Admin\VehicleDataController::class, 'deleteSpecialty']);

        Route::post('/blog', [AdminController::class, 'createBlogPost']);
        Route::put('/blog/{id}', [AdminController::class, 'updateBlogPost']);
        Route::delete('/blog/{id}', [AdminController::class, 'deleteBlogPost']);
        Route::post('/faq', [AdminController::class, 'createFaq']);
        Route::put('/faq/{id}', [AdminController::class, 'updateFaq']);
        Route::delete('/faq/{id}', [AdminController::class, 'deleteFaq']);
        Route::post('/announcements', [AdminController::class, 'createAnnouncement']);
        Route::delete('/announcements/{id}', [AdminController::class, 'deleteAnnouncement']);
        Route::post('/products', [AdminController::class, 'createProduct']);
        Route::get('/products', [AdminController::class, 'listProducts']);
        Route::put('/products/{id}', [AdminController::class, 'updateProduct']);
        Route::delete('/products/{id}', [AdminController::class, 'deleteProduct']);
        Route::post('/store/categories', [AdminController::class, 'createStoreCategory']);
        Route::get('/store/categories', [AdminController::class, 'listStoreCategories']);
        Route::put('/store/categories/{id}', [AdminController::class, 'updateStoreCategory']);
        Route::delete('/store/categories/{id}', [AdminController::class, 'deleteStoreCategory']);
        Route::get('/store/orders', [AdminController::class, 'listAllStoreOrders']);
        Route::patch('/store/orders/{id}', [AdminController::class, 'updateStoreOrder']);
        Route::patch('/store/orders/{id}/status', [StoreController::class, 'updateOrderStatus']);
        Route::get('/store/stats', [AdminController::class, 'getStoreStats']);
        Route::patch('/providers/{id}/status', [AdminController::class, 'updateProviderStatus']);

        // Provider Management
        Route::get('/providers', [AdminController::class, 'listProviders']);
        Route::post('/providers', [AdminController::class, 'createProvider']);
        Route::put('/providers/{id}', [AdminController::class, 'updateProvider']);
        Route::delete('/providers/{id}', [AdminController::class, 'deleteProvider']);

        // User Management
        Route::get('/users/search', [AdminController::class, 'searchUsers']);
        Route::get('/users', [AdminController::class, 'listUsers']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::post('/users/{id}/reset-password', [AdminController::class, 'resetUserPassword']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);

        // Tow Truck Management
        Route::get('/tow-trucks', [AdminController::class, 'listTowTrucks']);
        Route::post('/tow-trucks', [AdminController::class, 'createTowTruck']);
        Route::put('/tow-trucks/{id}', [AdminController::class, 'updateTowTruck']);
        Route::delete('/tow-trucks/{id}', [AdminController::class, 'deleteTowTruck']);

        // Technician Management
        Route::get('/technicians', [AdminController::class, 'listTechnicians']);
        Route::post('/technicians', [AdminController::class, 'createTechnician']);
        Route::put('/technicians/{id}', [AdminController::class, 'updateTechnician']);
        Route::delete('/technicians/{id}', [AdminController::class, 'deleteTechnician']);

        Route::patch('/technicians/{id}/verify', [AdminController::class, 'verifyTechnician']);
        Route::patch('/tow-trucks/{id}/verify', [AdminController::class, 'verifyTowTruck']);

        // Order Management
        Route::get('/orders', [OrderController::class, 'adminList']);
        Route::patch('/orders/{orderNumber}/status', [OrderController::class, 'adminUpdateStatus']);
        Route::patch('/orders/{orderNumber}/shipping-notes', [OrderController::class, 'updateShippingNotes']);
        Route::patch('/orders/{orderNumber}/payment/approve', [OrderController::class, 'approvePayment']);
        Route::patch('/orders/{orderNumber}/payment/reject', [OrderController::class, 'rejectPayment']);
        // New order lifecycle routes
        Route::patch('/orders/{orderNumber}/mark-ready', [OrderController::class, 'markOrderReady']);
        Route::patch('/orders/{orderNumber}/mark-shipped', [OrderController::class, 'markOrderShipped']);
        Route::patch('/orders/{orderNumber}/mark-out-for-delivery', [OrderController::class, 'markOutForDelivery']);
        Route::patch('/orders/{orderNumber}/mark-delivered', [OrderController::class, 'markDelivered']);
        Route::patch('/orders/{orderNumber}/mark-completed', [OrderController::class, 'markCompleted']);
        Route::patch('/orders/{orderNumber}/cancel', [OrderController::class, 'cancelOrder']);

        // Review Management
        Route::get('/reviews', [App\Http\Controllers\ReviewController::class, 'adminIndex']);
        Route::post('/reviews/{id}/moderate', [App\Http\Controllers\ReviewController::class, 'adminModerate']);
        Route::put('/reviews/{id}', [App\Http\Controllers\ReviewController::class, 'update']);
        Route::delete('/reviews/{id}', [App\Http\Controllers\ReviewController::class, 'destroy']);

        // International License
        Route::get('/international-license/pricing', [App\Http\Controllers\InternationalLicenseController::class, 'getPricing']);
        Route::post('/international-license/step1', [App\Http\Controllers\InternationalLicenseController::class, 'storeStep1']);
        Route::post('/international-license/upload-documents', [App\Http\Controllers\InternationalLicenseController::class, 'uploadDocuments']);
        Route::post('/international-license/upload-payment-proof', [App\Http\Controllers\InternationalLicenseController::class, 'uploadPaymentProof']);
        Route::post('/international-license/final-submit', [App\Http\Controllers\InternationalLicenseController::class, 'finalSubmit']);
        Route::get('/international-license/my-requests', [App\Http\Controllers\InternationalLicenseController::class, 'index']);

        // Admin International License Management
        Route::get('/international-license-requests', [App\Http\Controllers\InternationalLicenseController::class, 'adminIndex']);
        Route::patch('/international-license-requests/{id}/status', [App\Http\Controllers\InternationalLicenseController::class, 'updateStatus']);

        // ======== AUCTION MANAGEMENT ========
        Route::prefix('auctions')->group(function () {
            Route::get('/stats', [App\Http\Controllers\Admin\AuctionManagementController::class, 'getStats']);
            Route::get('/cars', [App\Http\Controllers\Admin\AuctionManagementController::class, 'listCars']);
            Route::post('/cars', [App\Http\Controllers\Admin\AuctionManagementController::class, 'saveCar']);
            Route::put('/cars/{id}', [App\Http\Controllers\Admin\AuctionManagementController::class, 'saveCar']);
            Route::delete('/cars/{id}', [App\Http\Controllers\Admin\AuctionManagementController::class, 'deleteCar']);
            Route::post('/cars/{id}/approve', [App\Http\Controllers\Admin\AuctionManagementController::class, 'approveCar']);
            Route::post('/cars/{id}/reject', [App\Http\Controllers\Admin\AuctionManagementController::class, 'rejectCar']);

            Route::get('/', [App\Http\Controllers\Admin\AuctionManagementController::class, 'listAuctions']);
            Route::post('/', [App\Http\Controllers\Admin\AuctionManagementController::class, 'saveAuction']);
            Route::get('/{id}', [App\Http\Controllers\Admin\AuctionManagementController::class, 'getAuctionDetails']);
            Route::put('/{id}', [App\Http\Controllers\Admin\AuctionManagementController::class, 'saveAuction']);
            Route::delete('/{id}', [App\Http\Controllers\Admin\AuctionManagementController::class, 'deleteAuction']);
            Route::post('/{id}/start', [App\Http\Controllers\Admin\AuctionManagementController::class, 'startAuction']);
            Route::post('/{id}/end', [App\Http\Controllers\Admin\AuctionManagementController::class, 'endAuction']);
            Route::post('/{id}/cancel', [App\Http\Controllers\Admin\AuctionManagementController::class, 'cancelAuction']);
            Route::post('/{id}/extend', [App\Http\Controllers\Admin\AuctionManagementController::class, 'extendAuction']);
            Route::post('/{id}/pause', [App\Http\Controllers\Admin\AuctionManagementController::class, 'pauseAuction']);
            Route::post('/{id}/resume', [App\Http\Controllers\Admin\AuctionManagementController::class, 'resumeAuction']);
            Route::post('/{id}/announce', [App\Http\Controllers\Admin\AuctionManagementController::class, 'announceAuction']);
            Route::patch('/{id}/payment', [App\Http\Controllers\Admin\AuctionManagementController::class, 'updatePaymentStatus']);
        });

        // ======== SCHEDULER MANAGEMENT ========
        Route::prefix('scheduler')->group(function () {
            Route::get('/', [App\Http\Controllers\Admin\SchedulerController::class, 'index']);
            Route::get('/health', [App\Http\Controllers\Admin\SchedulerController::class, 'health']);
            Route::get('/logs', [App\Http\Controllers\Admin\SchedulerController::class, 'logs']);
            Route::post('/execute', [App\Http\Controllers\Admin\SchedulerController::class, 'execute']);
            Route::get('/stats', [App\Http\Controllers\Admin\SchedulerController::class, 'stats']);
        });
    });
});

// ======== PUBLIC AUCTION ROUTES ========
Route::prefix('auctions')->group(function () {
    Route::get('/', [App\Http\Controllers\AuctionController::class, 'index']);
    Route::get('/{id}', [App\Http\Controllers\AuctionController::class, 'show']);
    Route::get('/{id}/bids', [App\Http\Controllers\BidController::class, 'getBids']);
});

// ======== AUTHENTICATED AUCTION ROUTES ========
Route::middleware(['auth:sanctum'])->prefix('auctions')->group(function () {
    Route::post('/{id}/register', [App\Http\Controllers\AuctionController::class, 'register']);
    Route::post('/{id}/remind', [App\Http\Controllers\AuctionController::class, 'setReminder']);
    Route::delete('/{id}/remind', [App\Http\Controllers\AuctionController::class, 'cancelReminder']);
    Route::post('/{id}/bid', [App\Http\Controllers\BidController::class, 'placeBid']);
    Route::post('/{id}/buy-now', [App\Http\Controllers\BidController::class, 'buyNow']);
    Route::post('/{id}/pay', [App\Http\Controllers\AuctionController::class, 'pay']);
    Route::get('/my-auctions', [App\Http\Controllers\AuctionController::class, 'myAuctions']);

    // Watchlist routes
    Route::get('/watchlist', [App\Http\Controllers\WatchlistController::class, 'index']);
    Route::post('/watchlist/{auctionId}', [App\Http\Controllers\WatchlistController::class, 'store']);
    Route::delete('/watchlist/{auctionId}', [App\Http\Controllers\WatchlistController::class, 'destroy']);
    Route::get('/watchlist/{auctionId}/check', [App\Http\Controllers\WatchlistController::class, 'check']);
});

// ======== USER CAR SUBMISSION ========
Route::middleware(['auth:sanctum'])->post('/sell-car', [App\Http\Controllers\AuctionCarController::class, 'userSubmit']);
Route::middleware(['auth:sanctum'])->post('/auctions/cars/upload-media', [App\Http\Controllers\AuctionCarController::class, 'uploadMedia']);
