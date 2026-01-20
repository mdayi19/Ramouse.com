# Ramouse.com Design System

## Overview

The Ramouse.com design system provides a consistent, accessible, and scalable foundation for building the car marketplace platform. Built on Tailwind CSS with custom extensions.

---

## Color System

### Primary Colors
**Navy Blue** - Main brand color for trust and professionalism

```css
primary-DEFAULT: #1c2e5b
primary-50:  #ebf0ff (Lightest)
primary-100: #dce6ff
primary-200: #c2d4ff
primary-300: #9ebaff
primary-400: #759aff
primary-500: #4e7aff
primary-600: #2952ff
primary-700: #1c2e5b (Base)
primary-800: #162345
primary-900: #121d36
primary-950: #0a101f (Darkest)
```

**Usage**:
- Headers, navigation, CTAs
- Links and interactive elements
- Focus states

### Secondary Colors
**Golden Yellow** - Accent color for highlights and premium features

```css
secondary-DEFAULT: #f0b71a
secondary-50:  #fffbea (Lightest)
secondary-100: #fff4c5
secondary-200: #ffea85
secondary-300: #ffda46
secondary-400: #f0b71a (Base)
secondary-500: #d99d08
secondary-600: #b67a05
secondary-700: #8e5806
secondary-800: #75460a
secondary-900: #63390f (Darkest)
```

**Usage**:
- Badges, notifications
- Premium features
- Hover states

### Neutral Colors

```css
light:    rgb(248, 250, 252) - Light mode background
darkbg:   rgb(15, 23, 42)    - Dark mode background
darkcard: rgb(30, 41, 59)    - Dark mode cards
cream:    #f3efe4            - Brand accent
```

### Semantic Colors

**Marketplace Gradients**:
```css
--marketplace-gradient-primary: linear-gradient(135deg, hsl(223, 54%, 24%) 0%, hsl(38, 92%, 47%) 100%)
--marketplace-gradient-secondary: linear-gradient(135deg, hsl(223, 54%, 24%) 0%, hsl(223, 54%, 35%) 100%)
```

**Rent Gradients**:
```css
--rent-gradient-primary: linear-gradient(135deg, hsl(177, 100%, 35%) 0%, hsl(184, 100%, 40%) 100%)
--rent-gradient-secondary: linear-gradient(135deg, hsl(184, 100%, 40%) 0%, hsl(172, 66%, 50%) 100%)
```

**Auction Gradients**:
```css
--auction-gradient-primary: linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(250, 84%, 64%) 100%)
--auction-gradient-success: linear-gradient(135deg, hsl(142, 76%, 36%) 0%, hsl(158, 64%, 52%) 100%)
--auction-gradient-danger: linear-gradient(135deg, hsl(0, 84%, 60%) 0%, hsl(14, 90%, 53%) 100%)
--auction-gradient-warning: linear-gradient(135deg, hsl(38, 92%, 50%) 0%, hsl(45, 93%, 47%) 100%)
```

---

## Typography

### Font Family
**Tajawal** - Arabic-optimized sans-serif font

```css
font-family: 'Tajawal', sans-serif
```

**Features**:
- Optimized for Arabic text
- Multiple weights (200-900)
- Excellent readability
- Web-safe fallback to system sans-serif

### Type Scale
Use Tailwind's default scale:

```
text-xs:   0.75rem  (12px)
text-sm:   0.875rem (14px)
text-base: 1rem     (16px)
text-lg:   1.125rem (18px)
text-xl:   1.25rem  (20px)
text-2xl:  1.5rem   (24px)
text-3xl:  1.875rem (30px)
text-4xl:  2.25rem  (36px)
text-5xl:  3rem     (48px)
```

### Font Weights
```
font-light:     200
font-normal:    400
font-medium:    500
font-semibold:  600
font-bold:      700
font-extrabold: 800
```

### Usage Guidelines
- **Headings**: font-bold, text-2xl to text-5xl
- **Body**: font-normal, text-base
- **Captions**: font-medium, text-sm
- **Labels**: font-semibold, text-xs to text-sm

---

## Spacing System

### Mobile-First Spacing
```css
--spacing-mobile:  0.75rem (12px)
--spacing-tablet:  1rem    (16px)
--spacing-desktop: 1.5rem  (24px)
```

### Tailwind Spacing Scale
```
0:    0px
0.5:  0.125rem (2px)
1:    0.25rem  (4px)
2:    0.5rem   (8px)
3:    0.75rem  (12px)
4:    1rem     (16px)
5:    1.25rem  (20px)
6:    1.5rem   (24px)
8:    2rem     (32px)
10:   2.5rem   (40px)
12:   3rem     (48px)
16:   4rem     (64px)
20:   5rem     (80px)
```

### Touch Targets
```css
--touch-target-min: 44px (Minimum for accessibility)
--button-height-mobile: 44px
--button-height-desktop: 48px
```

**Usage**: Apply `.touch-target` class for interactive elements

### Safe Areas
```css
--safe-area-top: env(safe-area-inset-top, 0px)
--safe-area-bottom: env(safe-area-inset-bottom, 0px)
--safe-area-left: env(safe-area-inset-left, 0px)
--safe-area-right: env(safe-area-inset-right, 0px)
```

**Utilities**:
- `.safe-area-padding-top`
- `.safe-area-padding-bottom`

---

## Animation System

### Transitions
```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1)
```

### Keyframe Animations

**Shimmer** (Loading states):
```css
animate-shimmer: shimmer 2s infinite
```

**Toast Notifications**:
```css
animate-toast-in: toast-in 0.3s ease-out forwards
```

**Modal Animations**:
```css
animate-modal-in: modal-in 0.2s ease-out forwards
animate-modal-out: modal-out 0.2s ease-in forwards
```

**Fade Animations**:
```css
animate-fade-in: fade-in 0.3s ease-out forwards
animate-fade-in-up: fade-in-up 0.4s ease-out both
animate-fade-in-down: fade-in-down 0.4s ease-out both
```

**Slide Animations**:
```css
animate-slide-up: slide-up 0.4s ease-out forwards
```

**Bounce**:
```css
animate-bounce-subtle: bounce-subtle 2s infinite
```

---

## Effects

### Glassmorphism
```css
--glass-bg: rgba(255, 255, 255, 0.1)
--glass-border: rgba(255, 255, 255, 0.2)
--glass-blur: 10px
```

**Usage**:
```html
<div class="backdrop-blur-xl bg-white/10 border border-white/20">
  <!-- Content -->
</div>
```

### Shadows

**Marketplace Cards**:
```css
--marketplace-card-hover: 0 20px 60px -15px rgba(28, 46, 91, 0.15)
--marketplace-card-active: 0 8px 30px -8px rgba(28, 46, 91, 0.25)
```

**Tailwind Shadows**:
```
shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow:     0 1px 3px 0 rgb(0 0 0 / 0.1)
shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.1)
shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.1)
shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.1)
shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)
```

---

## Component Patterns

### Buttons

**Primary Button**:
```html
<button class="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-800 transition-colors shadow-lg">
  Button Text
</button>
```

**Secondary Button**:
```html
<button class="px-6 py-3 bg-secondary text-slate-900 rounded-xl font-semibold hover:bg-secondary-500 transition-colors">
  Button Text
</button>
```

**Outline Button**:
```html
<button class="px-6 py-3 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-all">
  Button Text
</button>
```

### Cards

**Basic Card**:
```html
<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
  <!-- Content -->
</div>
```

**Hover Card**:
```html
<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 p-6">
  <!-- Content -->
</div>
```

### Form Inputs

**Text Input**:
```html
<input 
  type="text"
  class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
  aria-label="Input label"
/>
```

**Select Dropdown**:
```html
<select class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer">
  <option>Option 1</option>
</select>
```

---

## Accessibility

### Focus States
```css
*:focus-visible {
  outline: 2px solid theme('colors.primary.500');
  outline-offset: 2px;
}
```

### Touch Optimization
```css
-webkit-tap-highlight-color: transparent;
```

### Font Rendering
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

---

## Dark Mode

Enable dark mode with `class="dark"` on root element.

**Color Mappings**:
- `bg-white` → `dark:bg-slate-800`
- `text-slate-900` → `dark:text-white`
- `border-slate-200` → `dark:border-slate-700`
- `bg-slate-50` → `dark:bg-slate-900/50`

---

## Usage Guidelines

### Do's ✅
- Use design tokens for consistency
- Apply touch-target class to interactive elements
- Use semantic color names
- Follow spacing scale
- Implement dark mode variants
- Add ARIA labels for accessibility

### Don'ts ❌
- Don't use arbitrary values
- Don't create custom colors outside the palette
- Don't ignore touch target sizes
- Don't skip dark mode variants
- Don't use inline styles
- Don't forget accessibility attributes

---

## Resources

- **Tailwind Config**: `tailwind.config.js`
- **CSS Variables**: `src/index.css`
- **Font**: [Tajawal on Google Fonts](https://fonts.google.com/specimen/Tajawal)
- **Icons**: Lucide React

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Maintained By**: Ramouse.com Development Team
