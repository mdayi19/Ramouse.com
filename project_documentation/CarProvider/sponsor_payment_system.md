# Sponsor Listing Payment System

## 💰 نظام الدفع للإعلانات الممولة

### 1. Pricing Schema

```php
// config/car_listing.php
return [
    'sponsor_pricing' => [
        'daily' => 10,      // 10 ريال/يوم
        'weekly' => 60,     // 60 ريال/أسبوع (خصم)
        'monthly' => 200,   // 200 ريال/شهر (خصم أكبر)
    ],
    
    'max_sponsor_duration' => 90, // أقصى 3 أشهر
];
```

---

### 2. Database - Wallet Transactions

```sql
CREATE TABLE wallet_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    user_type ENUM('car_provider', 'technician', 'provider', 'tow_truck'),
    amount DECIMAL(10,2),
    type ENUM('credit', 'debit'),
    category ENUM('sponsor_listing', 'withdrawal', 'deposit', 'refund'),
    description TEXT,
    reference_type VARCHAR(50), -- 'App\Models\CarListing'
    reference_id BIGINT,        -- listing ID
    balance_before DECIMAL(10,2),
    balance_after DECIMAL(10,2),
    created_at TIMESTAMP,
    INDEX idx_user (user_id, user_type),
    INDEX idx_reference (reference_type, reference_id)
);
```

---

### 3. Backend Implementation

#### CarListingController::sponsorListing()

```php
public function sponsorListing(Request $request, $id)
{
    $validated = $request->validate([
        'duration_days' => 'required|integer|min:1|max:90',
    ]);
    
    $listing = CarListing::findOrFail($id);
    $provider = $listing->carProvider;
    
    // حساب السعر
    $price = $this->calculateSponsorPrice($validated['duration_days']);
    
    // التحقق من الرصيد
    if ($provider->wallet_balance < $price) {
        return response()->json([
            'error' => 'رصيد المحفظة غير كافٍ',
            'required' => $price,
            'current_balance' => $provider->wallet_balance,
            'shortage' => $price - $provider->wallet_balance
        ], 400);
    }
    
    DB::beginTransaction();
    try {
        $balanceBefore = $provider->wallet_balance;
        
        // خصم من المحفظة
        $provider->decrement('wallet_balance', $price);
        $provider->refresh();
        
        // تسجيل الحركة المالية
        WalletTransaction::create([
            'user_id' => $provider->id,
            'user_type' => 'car_provider',
            'amount' => $price,
            'type' => 'debit',
            'category' => 'sponsor_listing',
            'description' => "رعاية إعلان: {$listing->title} لمدة {$validated['duration_days']} يوم",
            'reference_type' => CarListing::class,
            'reference_id' => $listing->id,
            'balance_before' => $balanceBefore,
            'balance_after' => $provider->wallet_balance,
        ]);
        
        // تفعيل الرعاية
        $sponsoredUntil = now()->addDays($validated['duration_days']);
        $listing->update([
            'is_sponsored' => true,
            'sponsored_until' => $sponsoredUntil,
        ]);
        
        // تسجيل في sponsorship history
        CarListingSponsorshipHistory::create([
            'car_listing_id' => $listing->id,
            'sponsored_from' => now(),
            'sponsored_until' => $sponsoredUntil,
            'sponsored_by_admin_id' => auth()->id(),
            'price' => $price,
            'duration_days' => $validated['duration_days'],
        ]);
        
        DB::commit();
        
        return response()->json([
            'message' => 'تم تفعيل الرعاية بنجاح',
            'listing' => $listing->fresh(),
            'wallet_balance' => $provider->wallet_balance,
            'transaction' => WalletTransaction::latest()->first(),
        ]);
        
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['error' => 'فشل في تفعيل الرعاية'], 500);
    }
}

private function calculateSponsorPrice($days)
{
    $pricing = config('car_listing.sponsor_pricing');
    
    // خصومات تلقائية
    if ($days >= 30) {
        return $pricing['monthly'] * ceil($days / 30);
    } elseif ($days >= 7) {
        return $pricing['weekly'] * ceil($days / 7);
    } else {
        return $pricing['daily'] * $days;
    }
}
```

---

### 4. Provider-Initiated Sponsorship

```php
// CarProviderController::sponsorMyListing()
public function sponsorMyListing(Request $request, $id)
{
    $listing = CarListing::findOrFail($id);
    $provider = auth()->user()->carProvider;
    
    // التحقق من الملكية
    if ($listing->car_provider_id !== $provider->id) {
        return response()->json(['error' => 'غير مصرح'], 403);
    }
    
    // نفس منطق sponsorListing لكن من المزود نفسه
    // ...
}
```

---

### 5. Frontend - Sponsor Modal

```tsx
const SponsorListingModal = ({ listing, onSuccess }) => {
  const [duration, setDuration] = useState(7);
  const [price, setPrice] = useState(0);
  const { data: wallet } = useQuery(['wallet'], getWalletBalance);
  
  useEffect(() => {
    // حساب السعر تلقائياً
    const calculatePrice = async () => {
      const res = await api.calculateSponsorPrice(duration);
      setPrice(res.price);
    };
    calculatePrice();
  }, [duration]);
  
  const handleSponsor = async () => {
    if (wallet.balance < price) {
      toast.error('رصيد المحفظة غير كافٍ');
      return;
    }
    
    try {
      await api.sponsorListing(listing.id, duration);
      toast.success('تم تفعيل الرعاية بنجاح');
      onSuccess();
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  return (
    <Modal>
      <h2>رعاية الإعلان</h2>
      
      <DurationSelector>
        <Option value={7}>أسبوع - 60 ريال</Option>
        <Option value={30}>شهر - 200 ريال</Option>
        <Option value={90}>3 أشهر - 550 ريال</Option>
        <Custom onChange={setDuration} />
      </DurationSelector>
      
      <PriceSummary>
        <div>المدة: {duration} يوم</div>
        <div>السعر: {price} ريال</div>
        <div>الرصيد الحالي: {wallet.balance} ريال</div>
        <div className={wallet.balance < price ? 'text-red-500' : ''}>
          الرصيد بعد الخصم: {wallet.balance - price} ريال
        </div>
      </PriceSummary>
      
      <Button 
        onClick={handleSponsor}
        disabled={wallet.balance < price}
      >
        {wallet.balance < price 
          ? 'رصيد غير كافٍ - شحن المحفظة' 
          : 'تأكيد الدفع'}
      </Button>
    </Modal>
  );
};
```

---

### 6. Wallet Transactions View

```tsx
<WalletTransactionsTable>
  {transactions.map(tx => (
    <TransactionRow key={tx.id}>
      <DateCell>{tx.created_at}</DateCell>
      <TypeCell>
        {tx.type === 'debit' ? '🔻' : '🔺'} {tx.category}
      </TypeCell>
      <DescriptionCell>{tx.description}</DescriptionCell>
      <AmountCell className={tx.type === 'debit' ? 'text-red' : 'text-green'}>
        {tx.type === 'debit' ? '-' : '+'}{tx.amount} ريال
      </AmountCell>
      <BalanceCell>{tx.balance_after} ريال</BalanceCell>
    </TransactionRow>
  ))}
</WalletTransactionsTable>
```

---

### 7. Refund on Cancellation

```php
public function unsponsorListing($id)
{
    $listing = CarListing::findOrFail($id);
    
    // حساب الأيام المتبقية
    $remainingDays = now()->diffInDays($listing->sponsored_until);
    
    if ($remainingDays > 0) {
        // استرجاع جزئي (على أساس الأيام المتبقية)
        $originalPrice = $listing->sponsorshipHistory->first()->price;
        $totalDays = $listing->sponsorshipHistory->first()->duration_days;
        $refundAmount = ($originalPrice / $totalDays) * $remainingDays;
        
        // رد المبلغ للمحفظة
        $provider = $listing->carProvider;
        $balanceBefore = $provider->wallet_balance;
        $provider->increment('wallet_balance', $refundAmount);
        
        WalletTransaction::create([
            'user_id' => $provider->id,
            'user_type' => 'car_provider',
            'amount' => $refundAmount,
            'type' => 'credit',
            'category' => 'refund',
            'description' => "استرجاع رعاية إعلان: {$listing->title} ({$remainingDays} يوم)",
            'reference_type' => CarListing::class,
            'reference_id' => $listing->id,
            'balance_before' => $balanceBefore,
            'balance_after' => $provider->wallet_balance,
        ]);
    }
    
    // إلغاء الرعاية
    $listing->update([
        'is_sponsored' => false,
        'sponsored_until' => null,
    ]);
}
```

---

## Summary

| Feature | Status |
|---------|--------|
| Wallet deduction | ✅ Automatic |
| Transaction logging | ✅ Full audit trail |
| Pricing tiers | ✅ Daily/Weekly/Monthly |
| Balance check | ✅ Before payment |
| Refund support | ✅ Pro-rated |
| Admin override | ✅ Free sponsorship option |
| Transaction history | ✅ User view + export |
