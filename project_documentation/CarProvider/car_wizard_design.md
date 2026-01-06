# Car Listing Wizard Modal - Design Specification

## Overview
Multi-step modal wizard for adding car listings, following the `OrderWizard` pattern with icon-heavy design for easy use.

---

## Modal Structure

```tsx
<CarListingWizard>
  <ProgressBar /> {/* 6 steps with icons */}
  {renderStep()}
</CarListingWizard>
```

**Pattern:** Similar to `OrderWizard.tsx` (7-step wizard with ProgressBar)

---

## Steps Breakdown

### Step 1: Basic Car Info 🚗
**Icon:** `FaCarSide` (large, prominent)

**Fields:**
- **Title** (text input with icon 📝)
  - Placeholder: "مثال: تويوتا كامري 2022 SE"
- **Listing Type** (large icon cards):
  ```
  [🏷️ للبيع]    [🔄 للإيجار]
  ```
- **Year** (dropdown with calendar icon 📅)
- **Mileage** (number input with speedometer icon 🛣️)

**UI Pattern:**
```tsx
<div className="icon-card-grid">
  <IconCard 
    icon={FaTag} 
    label="للبيع" 
    selected={listingType === 'sale'}
    onClick={() => setListingType('sale')}
  />
  <IconCard 
    icon={FaSync} 
    label="للإيجار"
    selected={listingType === 'rent'}
  />
</div>
```

---

### Step 2: Category & Brand 🏷️
**Icon:** `FaTags`

**Layout:** 2-column grid with icons

**Column 1 - Category:**
```
[🚙 سيدان]  [🚐 SUV]  [🚚 شاحنة]
[🏎️ رياضية]  [🚗 كوبيه]  [🚌 فان]
```

**Column 2 - Brand:**
```
[🔰 تويوتا]  [🔷 BMW]  [⭐ مرسيدس]
[🔶 نيسان]  [◆ هوندا]  [◇ كيا]
```

**Model input appears after brand selection**

**Reference:** `Step1Category.tsx` & `Step2Brand.tsx` icon card pattern

---

### Step 3: Specs & Details ⚙️
**Icon:** `FaCogs`

**Grid Layout with Icons:**

| **Condition** 🌟 | **Transmission** ⚡ | **Fuel Type** ⛽ |
|---|---|---|
| □ جديدة | □ أوتوماتيك | □ بنزين |
| □ مستعملة | □ يدوي | □ ديزل |
| □ معتمدة | | □ كهرباء |

**Additional Fields (icon inputs):**
- 🚪 Doors: `[2] [4] [5]` (number buttons)
- 💺 Seats: `[2] [4] [5] [7] [8]` (number buttons)
- 🏁 Horsepower (number input with icon)
- 🔧 Engine Size (text with icon)
- 🎨 Colors:
  - Exterior: Color picker grid
  - Interior: Color picker grid

---

### Step 4: Condition & History 🔍
**Icon:** `FaWrench`

**Body Condition Interactive Diagram:**
```tsx
<CarDiagram>
  {/* SVG car top-down view */}
  <BodyPart name="hood" condition="pristine" />
  <BodyPart name="front_bumper" condition="scratched" />
  ...
</CarDiagram>

<ConditionLegend>
  ✅ Pristine | ⚠️ Scratched | 🔨 Dented | 🎨 Painted | ♻️ Replaced
</ConditionLegend>
```

**Quick Presets:**
```
[⭐⭐⭐⭐⭐ ممتازة]  [⭐⭐⭐⭐ جيدة جداً]  
[⭐⭐⭐ جيدة]       [⭐⭐ بحاجة إصلاح]
```

**Additional Fields:**
- 📋 License Plate (text with icon)
- 🔢 VIN / Chassis Number
- 👤 Previous Owners (number stepper 0-10)
- 🛡️ Warranty (text input)

---

### Step 5: Photos & Media 📸
**Icon:** `FaCamera`

**Upload Zone:**
```tsx
<DragDropZone>
  📸 اسحب الصور هنا أو اضغط للاختيار
  (1-15 صورة، حد أقصى 5MB لكل صورة)
</DragDropZone>

<PhotoGrid>
  {photos.map((photo, i) => (
    <PhotoCard key={i}>
      <img src={photo} />
      <DeleteBtn /> | <SetCoverBtn />
    </PhotoCard>
  ))}
</PhotoGrid>
```

**Additional Media:**
- 🎥 Video URL (optional)
- 📝 Description (rich textarea with formatting)

---

### Step 6: Pricing & Review ✅
**Icon:** `FaCheckCircle`

**Pricing Section:**
```tsx
<PriceInput icon={FaDollarSign}>
  السعر: _______ 
  [✓ قابل للتفاوض]
</PriceInput>

{listingType === 'rent' && (
  <RentalRates>
    يومي: _____
    أسبوعي: _____
    شهري: _____
  </RentalRates>
)}
```

**Contact Info:**
```tsx
<ContactSection>
  📞 رقم الاتصال: _____ (اختياري)
  💬 واتساب: _____ (اختياري)
</ContactSection>
```

**Review Summary:**
```tsx
<ReviewCard>
  <CarIcon /> {title}
  <InfoRow icon={FaTag}>{brand} {model} {year}</InfoRow>
  <InfoRow icon={FaDollarSign}>{price}</InfoRow>
  <InfoRow icon={FaImage}>{photos.length} صور</InfoRow>
  <EditButton onClick={() => goToStep(1)} />
</ReviewCard>
```

**Submit Button:**
```tsx
<GradientButton 
  icon={FaRocket} 
  loading={isSubmitting}
>
  🚀 نشر الإعلان
</GradientButton>
```

---

## Component Structure

```tsx
components/
├── CarListingWizard/
│   ├── CarListingWizardModal.tsx    // Main modal wrapper
│   ├── CarWizardProgressBar.tsx     // Progress indicator
│   ├── steps/
│   │   ├── Step1BasicInfo.tsx       // Car info
│   │   ├── Step2CategoryBrand.tsx   // Category & Brand
│   │   ├── Step3Specs.tsx           // Specs & Details
│   │   ├── Step4Condition.tsx       // Body condition
│   │   ├── Step5Media.tsx           // Photos & video
│   │   └── Step6Review.tsx          // Review & publish
│   └── shared/
│       ├── IconCard.tsx             // Reusable icon selection card
│       ├── CarBodyDiagram.tsx       // Interactive SVG diagram
│       ├── PhotoUploader.tsx        // Drag-drop uploader
│       └── ColorPicker.tsx          // Color selection grid
```

---

## Icon Library

**Primary Icons (Lucide React or React Icons):**
```tsx
import {
  Car,           // FaCarSide - Car info
  Tags,          // FaTags - Category
  Settings,      // FaCogs - Specs
  Wrench,        // FaWrench - Condition
  Camera,        // FaCamera - Photos
  CheckCircle,   // FaCheckCircle - Review
  DollarSign,    // FaDollarSign - Price
  Phone,         // FaPhone - Contact
  MessageCircle, // FaWhatsapp - WhatsApp
  Calendar,      // FaCalendar - Year
  Gauge,         // FaTachometerAlt - Mileage
  Droplet,       // FaPalette - Color
  Star,          // FaStar - Rating/Condition
  Upload,        // FaUpload - Photos
  Edit,          // FaEdit - Edit
  ArrowLeft,     // FaArrowLeft - Back
  ArrowRight,    // FaArrowRight - Next
} from 'lucide-react';
```

---

## Icon Card Component Pattern

```tsx
interface IconCardProps {
  icon: LucideIcon;
  label: string;
  selected: boolean;
  onClick: () => void;
  badge?: string;
}

const IconCard: React.FC<IconCardProps> = ({ 
  icon: Icon, 
  label, 
  selected, 
  onClick,
  badge 
}) => (
  <div
    className={`
      icon-card cursor-pointer rounded-xl p-6 border-2 transition-all
      hover:scale-105 hover:shadow-xl
      ${selected 
        ? 'border-blue-500 bg-blue-50 shadow-lg' 
        : 'border-gray-200 bg-white'
      }
    `}
    onClick={onClick}
  >
    <Icon className={`w-12 h-12 mx-auto mb-3 ${selected ? 'text-blue-600' : 'text-gray-600'}`} />
    <div className="text-center font-semibold">{label}</div>
    {badge && <span className="badge">{badge}</span>}
  </div>
);
```

---

## Progress Bar Design

```tsx
<CarWizardProgressBar>
  {steps.map((step, i) => (
    <StepIndicator 
      key={i}
      number={i+1}
      icon={step.icon}
      label={step.label}
      active={currentStep === i+1}
      completed={currentStep > i+1}
      onClick={() => goToStep(i+1)}
    />
  ))}
</CarWizardProgressBar>
```

**Steps:**
1. 🚗 معلومات
2. 🏷️ الفئة
3. ⚙️ المواصفات
4. 🔍 الحالة
5. 📸 الصور
6. ✅ مراجعة

---

## Responsive Design

**Desktop (>1024px):**
- Modal: 900px width
- Icon cards: 3-4 columns
- Large icons (48px)

**Tablet (768-1024px):**
- Modal: 90% width
- Icon cards: 2-3 columns
- Medium icons (40px)

**Mobile (<768px):**
- Modal: Full screen
- Icon cards: 1-2 columns
- Smaller icons (32px)
- Sticky progress bar at top

---

## Accessibility

- ✅ Keyboard navigation (Tab, Enter, Arrow keys)
- ✅ ARIA labels on all icon buttons
- ✅ Screen reader announcements on step changes
- ✅ Focus trap within modal
- ✅ Escape key to close
- ✅ Color contrast WCAG AA compliant

---

## Animations

```tsx
// Framer Motion variants
const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

<motion.div
  variants={stepVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
>
  {currentStepContent}
</motion.div>
```

---

## Benefits of Icon-Heavy Design

✅ **Faster Selection** - Visual recognition vs reading text
✅ **Language Agnostic** - Icons understood universally  
✅ **Mobile Friendly** - Large tap targets
✅ **Engaging UX** - More interactive and fun
✅ **Reduced Cognitive Load** - Icons group info visually
