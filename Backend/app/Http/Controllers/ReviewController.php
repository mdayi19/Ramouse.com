<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Technician;
use App\Models\TowTruck;
use App\Models\User;
use App\Events\ReviewSubmitted;
use App\Events\ReviewModerated;
use App\Events\ReviewResponseAdded;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ReviewController extends Controller
{
    /**
     * CUSTOMER: Submit a new review
     * POST /api/reviews
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'reviewable_type' => ['required', Rule::in(['technician', 'tow_truck'])],
            'reviewable_id' => 'required|string',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|max:1000',
        ]);

        // Get the model class
        $modelClass = $validated['reviewable_type'] === 'technician'
            ? Technician::class
            : TowTruck::class;

        // Check if provider exists
        $provider = $modelClass::find($validated['reviewable_id']);
        if (!$provider) {
            return response()->json(['message' => 'المزود غير موجود.'], 404);
        }

        // Check if user already reviewed this provider
        $existingReview = Review::where('reviewable_type', $modelClass)
            ->where('reviewable_id', $validated['reviewable_id'])
            ->where('user_id', $user->id)
            ->first();

        if ($existingReview) {
            return response()->json(['message' => 'لقد قيّمت هذا المزود مسبقاً.'], 422);
        }

        // Create review
        $review = Review::create([
            'reviewable_type' => $modelClass,
            'reviewable_id' => $validated['reviewable_id'],
            'user_id' => $user->id,
            'customer_name' => $user->name,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
            'status' => 'pending',
        ]);

        // Dispatch event to provider
        $providerId = $provider->user_id;
        event(new ReviewSubmitted($review, $providerId));

        return response()->json([
            'message' => 'تم إرسال تقييمك بنجاح. سيتم مراجعته من قبل المزود.',
            'review' => $review
        ], 201);
    }

    /**
     * CUSTOMER: Get user's submitted reviews
     * GET /api/reviews/my-reviews
     */
    public function myReviews()
    {
        $reviews = Review::where('user_id', Auth::id())
            ->with('reviewable')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reviews);
    }

    /**
     * PROVIDER: Get reviews for authenticated provider
     * GET /api/reviews
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // Determine provider type and ID
        $provider = null;
        $modelClass = null;

        if ($user->technician) {
            $provider = $user->technician;
            $modelClass = Technician::class;
        } elseif ($user->towTruck) {
            $provider = $user->towTruck;
            $modelClass = TowTruck::class;
        } else {
            return response()->json(['message' => 'غير مصرح.'], 403);
        }

        $status = $request->query('status');

        $query = Review::where('reviewable_type', $modelClass)
            ->where('reviewable_id', $provider->id)
            ->with('user', 'moderator');

        if ($status) {
            $query->where('status', $status);
        }

        $reviews = $query->orderBy('created_at', 'desc')->get();

        return response()->json($reviews);
    }

    /**
     * PROVIDER: Moderate (approve/reject) own review
     * POST /api/reviews/{id}/moderate
     */
    public function moderate(Request $request, $id)
    {
        $user = auth()->user();
        $review = Review::findOrFail($id);

        // Check if provider owns this review
        $provider = null;
        if ($user->technician && $review->reviewable_type === Technician::class && $review->reviewable_id === $user->technician->id) {
            $provider = $user->technician;
        } elseif ($user->towTruck && $review->reviewable_type === TowTruck::class && $review->reviewable_id === $user->towTruck->id) {
            $provider = $user->towTruck;
        } else {
            return response()->json(['message' => 'غير مصرح.'], 403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'moderation_notes' => 'nullable|string|max:500',
        ]);

        $review->update([
            'status' => $validated['status'],
            'moderated_by' => $user->id,
            'moderated_at' => now(),
            'moderation_notes' => $validated['moderation_notes'] ?? null,
        ]);

        // Recalculate average rating
        $provider->recalculateAverageRating();

        // Dispatch event to customer
        event(new ReviewModerated($review->fresh(), $review->user_id));

        return response()->json([
            'message' => $validated['status'] === 'approved' ? 'تم قبول التقييم.' : 'تم رفض التقييم.',
            'review' => $review->fresh()
        ]);
    }

    /**
     * PROVIDER: Respond to a review
     * POST /api/reviews/{id}/respond
     */
    public function respond(Request $request, $id)
    {
        $user = auth()->user();
        $review = Review::findOrFail($id);

        // Check if provider owns this review
        if ($user->technician && $review->reviewable_type === Technician::class && $review->reviewable_id === $user->technician->id) {
            // OK
        } elseif ($user->towTruck && $review->reviewable_type === TowTruck::class && $review->reviewable_id === $user->towTruck->id) {
            // OK
        } else {
            return response()->json(['message' => 'غير مصرح.'], 403);
        }

        $validated = $request->validate([
            'provider_response' => 'required|string|max:1000',
        ]);

        $review->update([
            'provider_response' => $validated['provider_response'],
            'responded_at' => now(),
        ]);

        // Dispatch event to customer
        event(new ReviewResponseAdded($review->fresh(), $review->user_id));

        return response()->json([
            'message' => 'تم إضافة ردك على التقييم.',
            'review' => $review->fresh()
        ]);
    }

    /**
     * ADMIN: Get all reviews (paginated)
     * GET /api/admin/reviews
     */
    public function adminIndex(Request $request)
    {
        $query = Review::with('reviewable', 'user', 'moderator');

        // Filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('reviewable_type')) {
            $modelClass = $request->reviewable_type === 'technician' ? Technician::class : TowTruck::class;
            $query->where('reviewable_type', $modelClass);
        }

        if ($request->has('from_date')) {
            $query->where('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->where('created_at', '<=', $request->to_date);
        }

        $reviews = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($reviews);
    }

    /**
     * ADMIN: Approve or reject any review
     * POST /api/admin/reviews/{id}/moderate
     */
    public function adminModerate(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'moderation_notes' => 'nullable|string|max:500',
        ]);

        $review->update([
            'status' => $validated['status'],
            'moderated_by' => Auth::id(),
            'moderated_at' => now(),
            'moderation_notes' => $validated['moderation_notes'] ?? null,
        ]);

        // Recalculate provider's average rating
        $provider = $review->reviewable;
        if ($provider) {
            $provider->recalculateAverageRating();
        }

        // Dispatch event to customer
        event(new ReviewModerated($review->fresh(), $review->user_id));

        return response()->json([
            'message' => $validated['status'] === 'approved' ? 'تم قبول التقييم.' : 'تم رفض التقييم.',
            'review' => $review->fresh()
        ]);
    }

    /**
     * ADMIN: Edit review content
     * PUT /api/admin/reviews/{id}
     */
    public function update(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        $validated = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'sometimes|string|max:1000',
            'customer_name' => 'sometimes|string|max:255',
        ]);

        $ratingChanged = isset($validated['rating']) && $validated['rating'] !== $review->rating;

        $review->update($validated);

        // Recalculate if rating changed
        if ($ratingChanged && $review->status === 'approved') {
            $provider = $review->reviewable;
            if ($provider) {
                $provider->recalculateAverageRating();
            }
        }

        return response()->json([
            'message' => 'تم تحديث التقييم بنجاح.',
            'review' => $review->fresh()
        ]);
    }

    /**
     * ADMIN: Delete review
     * DELETE /api/admin/reviews/{id}
     */
    public function destroy($id)
    {
        $review = Review::findOrFail($id);
        $wasApproved = $review->status === 'approved';
        $provider = $review->reviewable;
        $customerId = $review->user_id;
        $providerId = null;

        // Get provider user ID
        if ($provider) {
            $providerId = $provider->user_id;
        }

        $review->delete();

        // Recalculate if it was approved
        if ($wasApproved && $provider) {
            $provider->recalculateAverageRating();
        }

        // Notify customer their review was deleted
        if ($customerId) {
            $notification = \App\Models\Notification::create([
                'user_id' => $customerId,
                'title' => 'تم حذف تقييمك',
                'message' => 'تم حذف تقييمك من قبل الإدارة.',
                'type' => 'review_deleted',
                'read' => false,
            ]);

            event(new \App\Events\UserNotification($customerId, $notification->toArray()));
        }

        // Notify provider their review was deleted
        if ($providerId) {
            $notification = \App\Models\Notification::create([
                'user_id' => $providerId,
                'title' => 'تم حذف تقييم',
                'message' => 'تم حذف أحد التقييمات من ملفك الشخصي.',
                'type' => 'review_deleted',
                'read' => false,
            ]);

            event(new \App\Events\UserNotification($providerId, $notification->toArray()));
        }

        return response()->json(['message' => 'تم حذف التقييم بنجاح.']);
    }

    /**
     * PUBLIC: Get approved reviews for a technician
     * GET /api/technicians/{id}/reviews
     */
    public function technicianReviews($id)
    {
        $reviews = Review::where('reviewable_type', Technician::class)
            ->where('reviewable_id', $id)
            ->where('status', 'approved')
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reviews);
    }

    /**
     * PUBLIC: Get approved reviews for a tow truck
     * GET /api/tow-trucks/{id}/reviews
     */
    public function towTruckReviews($id)
    {
        $reviews = Review::where('reviewable_type', TowTruck::class)
            ->where('reviewable_id', $id)
            ->where('status', 'approved')
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reviews);
    }
}
