# Ramouse Auto Parts - Parts Request Workflow

This document details the workflow for the **Parts Request System** (Bidding Model), where users request a specific part and Providers compete to supply it.

## 1. Initiating a Request (The Wizard)

A user (Customer, Technician, or Tow Truck) fills out the 7-step wizard.

### Step 1: Category
*   User selects origin (e.g., German, Korean).
*   *System*: Loads relevant Brands.

### Step 2: Brand
*   User selects Brand (e.g., BMW).
*   *Option*: "Manual Input" if brand is not listed.

### Step 3: Vehicle Details
*   Model, Year, Engine Type, Transmission.
*   **VIN**: Optional 17-char code for accuracy.

### Step 4: Part Type
*   General classification (e.g., Engine, Body, Electrical).

### Step 5: Specifications & Media
*   **Description**: Text description of the part.
*   **Part Number**: Optional OEM number.
*   **Media**:
    *   **Images**: Multiple photos of the old part.
    *   **Video**: Walkaround or specific noise recording.
    *   **Voice Note**: Audio description of the problem.

### Step 6: Review
*   Summary of all data entered.

### Step 7: Submission
*   System generates `ORD-XXXX` ID.
*   Status set to **'قيد المراجعة' (Under Review)**.
*   **Routing**: System notifies Providers who are subscribed to the selected Category.
*   **Telegram**: Bot posts request details + media to the category's Telegram Channel.

## 2. Bidding Process (Provider Side)

1.  **Notification**: Provider receives "New Order Opportunity".
2.  **Review**: Provider views details and media in "Open Orders".
3.  **Quote Submission**:
    *   **Price**: Cost of part.
    *   **Condition**: New vs. Used.
    *   **Shipping Size**: (XS to VL) - determines shipping cost.
    *   **Media**: Provider uploads proof photos/video of *their* part.
    *   **Voice Note**: Provider adds verbal details/guarantee.
4.  **Result**: Quote is attached to the order. Customer is notified.

## 3. Selection & Payment (Customer Side)

1.  **Review Quotes**: Customer sees list of offers (Price, Rating, Condition).
2.  **Acceptance**: Customer clicks "Accept Offer".
3.  **Checkout Modal**:
    *   **Delivery**: Shipping vs. Pickup.
    *   **Shipping Cost**: Calculated based on Provider's Size estimation + Customer City.
    *   **Payment**: Upload Receipt or COD.
4.  **Submission**:
    *   Status -> **'بانتظار تأكيد الدفع' (Payment Verification)**.
    *   Admin is notified.

## 4. Fulfillment (Admin Side)

1.  **Verification**: Admin checks payment receipt.
2.  **Action**:
    *   **Approve**: Status -> **'جاري التجهيز' (Preparing)**. Provider notified to pack item.
    *   **Reject**: Status -> **'قيد المراجعة' (Under Review)**. Customer asked to check payment/quote.
3.  **Logistics**:
    *   Provider hands over item -> **'تم الاستلام من المزود' (Received from Provider)**.
    *   Courier ships item -> **'تم الشحن للعميل' (Shipped)**.
    *   Courier out for delivery -> **'قيد التوصيل' (Out for Delivery)**.
    *   Customer receives item -> **'تم التوصيل' (Delivered)**.

## 5. Financial Settlement

*   Upon **'تم التوصيل' (Delivered)**:
    *   Provider's Wallet is credited: `(Quote Price)`.
    *   Transaction record created.

## 6. Feedback
*   Customer leaves a **Star Rating** and **Comment** for the Provider.
*   Review appears on Provider's public profile (after Admin approval).
