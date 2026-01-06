# Reviews & Ratings System - Complete Policy

## 🌟 نظام التقييمات والمراجعات

### القرارات الأساسية

#### 1. **التقييم للمعرض (CarProvider) وليس السيارة**

**السبب:**
- ✅ المعرض له سمعة طويلة الأمد
- ✅ العميل يقيّم **التجربة الكاملة** (خدمة، أمانة، جودة)
- ❌ السيارة الواحدة قد تُباع مرة واحدة فقط

```php
// reviews table
'reviewable_type' => 'App\\Models\\CarProvider'  // ✅ Provider
// NOT: 'App\\Models\\CarListing'                // ❌ Listing
```

---

#### 2. **من يحق له التقييم؟**

**✅ المسموح:**
- مستخدمين مسجلين فقط (`auth:sanctum`)
- الذين **تواصلوا فعلياً** مع المعرض

**❌ الممنوع:**
- زوار بدون تسجيل
- مستخدمين لم يتواصلوا مع المعرض أبداً

**Validation:**
```php
public function canReview($providerId)
{
    $userId = auth()->id();
    
    // التحقق من التواصل السابق
    $hasContacted = CarListingAnalytics::whereHas('carListing', function($q) use ($providerId) {
            $q->where('car_provider_id', $providerId);
        })
        ->where('user_id', $userId)
        ->whereIn('event_type', ['contact_phone', 'contact_whatsapp'])
        ->exists();
    
    if (!$hasContacted) {
        return [
            'can_review' => false,
            'reason' => 'يجب التواصل مع المعرض أولاً قبل التقييم'
        ];
    }
    
    // التحقق من عدم وجود تقييم سابق
    $hasReviewed = Review::where('user_id', $userId)
        ->where('reviewable_type', CarProvider::class)
        ->where('reviewable_id', $providerId)
        ->exists();
    
    if ($hasReviewed) {
        return [
            'can_review' => false,
            'reason' => 'لقد قيّمت هذا المعرض من قبل'
        ];
    }
    
    return ['can_review' => true];
}
```

---

#### 3. **منع التقييم المتكرر**

**UNIQUE Constraint:**
```sql
ALTER TABLE reviews ADD UNIQUE KEY unique_user_review (
    user_id,
    reviewable_type,
    reviewable_id
);
```

**Application Level:**
```php
try {
    Review::create([...]);
} catch (\Illuminate\Database\QueryException $e) {
    if ($e->errorInfo[1] == 1062) { // Duplicate entry
        return response()->json([
            'error' => 'لقد قيّمت هذا المعرض من قبل'
        ], 400);
    }
}
```

---

### Database Schema

```sql
CREATE TABLE reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    reviewable_type VARCHAR(255) NOT NULL, -- 'App\Models\CarProvider'
    reviewable_id BIGINT NOT NULL,         -- provider phone
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE, -- Future: إذا كان العميل اشترى فعلاً
    admin_response TEXT,                        -- رد من الأدمن/المعرض
    is_approved BOOLEAN DEFAULT TRUE,           -- للمراجعة اليدوية
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_user_review (user_id, reviewable_type, reviewable_id),
    INDEX idx_reviewable (reviewable_type, reviewable_id),
    INDEX idx_rating (rating),
    INDEX idx_created (created_at)
);
```

---

### Review Model

```php
// app/Models/Review.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'user_id',
        'reviewable_type',
        'reviewable_id',
        'rating',
        'comment',
        'is_verified_purchase',
        'admin_response',
        'is_approved',
    ];
    
    protected $casts = [
        'is_verified_purchase' => 'boolean',
        'is_approved' => 'boolean',
        'rating' => 'integer',
    ];
    
    // Polymorphic relationship
    public function reviewable()
    {
        return $this->morphTo();
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    // Auto-update provider's average rating
    protected static function booted()
    {
        static::created(function ($review) {
            if ($review->reviewable_type === CarProvider::class) {
                $review->reviewable->recalculateAverageRating();
            }
        });
        
        static::updated(function ($review) {
            if ($review->reviewable_type === CarProvider::class) {
                $review->reviewable->recalculateAverageRating();
            }
        });
        
        static::deleted(function ($review) {
            if ($review->reviewable_type === CarProvider::class) {
                $review->reviewable->recalculateAverageRating();
            }
        });
    }
}

// في CarProvider Model
public function reviews()
{
    return $this->morphMany(Review::class, 'reviewable');
}

public function recalculateAverageRating()
{
    $this->average_rating = $this->reviews()
        ->where('is_approved', true)
        ->avg('rating');
    
    $this->save();
}
```

---

### ReviewController

```php
// app/Http/Controllers/ReviewController.php
namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\CarProvider;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Submit review for car provider
     */
    public function store(Request $request, $providerId)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:10|max:1000',
        ]);
        
        $userId = auth()->id();
        $provider = CarProvider::findOrFail($providerId);
        
        // Check if user can review
        $canReview = $this->canReview($providerId);
        if (!$canReview['can_review']) {
            return response()->json([
                'error' => $canReview['reason']
            ], 403);
        }
        
        // Create review
        $review = Review::create([
            'user_id' => $userId,
            'reviewable_type' => CarProvider::class,
            'reviewable_id' => $providerId,
            'rating' => $validated['rating'],
            'comment' => strip_tags($validated['comment']),
            'is_approved' => true, // Auto-approve (or set to false for manual review)
        ]);
        
        return response()->json([
            'message' => 'تم إضافة التقييم بنجاح',
            'review' => $review->load('user'),
            'new_average_rating' => $provider->fresh()->average_rating,
        ]);
    }
    
    /**
     * Get reviews for provider
     */
    public function index($providerId)
    {
        $reviews = Review::where('reviewable_type', CarProvider::class)
            ->where('reviewable_id', $providerId)
            ->where('is_approved', true)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate(10);
        
        return response()->json($reviews);
    }
    
    /**
     * Update review (user can edit their own review)
     */
    public function update(Request $request, $reviewId)
    {
        $review = Review::findOrFail($reviewId);
        
        // Check ownership
        if ($review->user_id !== auth()->id()) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }
        
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:10|max:1000',
        ]);
        
        $review->update([
            'rating' => $validated['rating'],
            'comment' => strip_tags($validated['comment']),
            'is_approved' => true, // Re-approve or set to false for re-review
        ]);
        
        return response()->json([
            'message' => 'تم تحديث التقييم',
            'review' => $review->fresh()->load('user'),
        ]);
    }
    
    /**
     * Delete review
     */
    public function destroy($reviewId)
    {
        $review = Review::findOrFail($reviewId);
        
        // Check ownership or admin
        if ($review->user_id !== auth()->id() && !auth()->user()->is_admin) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }
        
        $review->delete();
        
        return response()->json(['message' => 'تم حذف التقييم']);
    }
    
    private function canReview($providerId)
    {
        // Same as above implementation
        // ...
    }
}
```

---

### Routes

```php
// routes/api.php

// Public - get reviews
Route::get('/car-providers/{id}/reviews', [ReviewController::class, 'index']);

// Authenticated - submit/edit reviews
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/car-providers/{id}/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
});
```

---

### Frontend Component

```tsx
// components/ReviewForm.tsx
const ReviewForm = ({ providerId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  
  const submitMutation = useMutation({
    mutationFn: (data) => api.submitReview(providerId, data),
    onSuccess: () => {
      toast.success('تم إضافة التقييم بنجاح');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'فشل في إضافة التقييم');
    }
  });
  
  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('يجب اختيار التقييم');
      return;
    }
    
    if (comment.length < 10) {
      toast.error('التعليق قصير جداً (10 أحرف على الأقل)');
      return;
    }
    
    submitMutation.mutate({ rating, comment });
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">قيّم تجربتك مع المعرض</h3>
      
      {/* Star Rating */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="text-3xl transition-colors"
          >
            {star <= rating ? '⭐' : '☆'}
          </button>
        ))}
      </div>
      
      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="اكتب تجربتك مع المعرض (10 أحرف على الأقل)"
        className="w-full border rounded p-3 mb-4"
        rows={4}
        maxLength={1000}
      />
      
      <button
        onClick={handleSubmit}
        disabled={submitMutation.isPending}
        className="btn-primary w-full"
      >
        {submitMutation.isPending ? 'جاري الإرسال...' : 'إرسال التقييم'}
      </button>
    </div>
  );
};
```

---

## Summary

| السؤال | الإجابة |
|--------|---------|
| **التقييم لمن؟** | ✅ للمعرض (CarProvider) وليس السيارة |
| **من يحق له؟** | ✅ مستخدمين مسجلين + تواصلوا مع المعرض |
| **بدون تسجيل؟** | ❌ لا، يجب تسجيل الدخول |
| **تقييم متكرر؟** | ❌ ممنوع (UNIQUE constraint) |
| **التحقق؟** | ✅ يجب وجود contact analytics أولاً |
| **التعديل؟** | ✅ المستخدم يستطيع تعديل تقييمه |
| **الحذف؟** | ✅ المستخدم أو الأدمن |
| **Spam prevention** | ✅ Min 10 chars, one per provider |

---

**Anti-Spam Measures:**
- ✅ Authentication required
- ✅ Must have contacted provider first
- ✅ One review per user per provider
- ✅ Minimum comment length (10 chars)
- ✅ Optional: Admin approval before publishing
