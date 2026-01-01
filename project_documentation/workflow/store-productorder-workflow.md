
# Ramouse Auto Parts - Store & Flash Sale Workflow

This document details the workflow for the **Direct Purchase** module, which includes both the **General Store** (permanent inventory) and **Flash Sales** (time-limited offers). Unlike the Parts Request workflow, this flow deals with pre-defined products with set prices and stock.

## 1. Product Discovery

### 1.1. General Store
*   **Target Audience**: All users (Customers, Technicians, Providers, Tow Trucks).
*   **Access**: Via the "Store" tab in the main navigation or dashboard.
*   **Organization**: Products are categorized (e.g., Oils, Batteries, Tools) and sub-categorized.
*   **Filtering**: Users can filter by Category, Price Range, and Search Term.

### 1.2. Flash Sales
*   **Target Audience**: Specific segments (e.g., "Technicians Only", "Providers Only") or All.
*   **Access**: Via the "Flash Offers" section in user dashboards.
*   **Features**:
    *   **Countdown Timer**: Shows time remaining until offer expiry.
    *   **Stock Indicators**: "Low Stock" or "Sold Out" badges.
    *   **Audience Restriction**: Users only see offers targeted to their role.

## 2. Cart & Purchasing Logic

### 2.1. Adding to Cart
1.  **User Action**: User clicks "Add to Cart" (Store) or "Buy Now" (Flash Sale).
2.  **Validation**:
    *   **Stock Check**: System ensures requested quantity $\le$ Available Stock.
    *   **Limit Check**: System ensures `User Purchased Qty + Cart Qty` $\le$ `PurchaseLimitPerBuyer`.
3.  **Result**: Item is added to the cart stored in `localStorage`.

### 2.2. Checkout Process
The user initiates checkout from the Cart modal.

#### Step 1: Delivery Method
*   **Shipping**:
    *   User selects their **City**.
    *   User enters **Detailed Address** and **Contact Phone**.
    *   *Calculation*: Shipping cost is calculated primarily by checking if the product has a **Static Shipping Cost**. If not, it falls back to the City rates defined in System Settings based on the product's `ShippingSize` (XS, S, M, L, VL).
*   **Pickup**:
    *   Shipping cost is set to $0.
    *   User is shown the company's physical address.

#### Step 2: Payment Method
*   User selects a payment method from the list (configured by Admin).
    *   **Filtering**: Only payment methods permitted for *all* items in the cart are displayed. If a product restricts payment to specific methods, only those overlapping methods are shown.
    *   **Cash on Delivery (COD)**: Only available if enabled for store purchases and allowed by the product.
    *   **Bank Transfer / E-Payment**: User **MUST** upload a screenshot of the payment receipt.

#### Step 3: Confirmation
*   User reviews the total (Product Price + Shipping).
*   User submits the order.

## 3. Order Processing (Admin Side)

### 3.1. Order Creation
*   **Status**: 
    *   If COD: `pending` (Awaiting Approval).
    *   If Receipt Uploaded: `payment_verification` (Awaiting Admin Review).
*   **Inventory**: Stock is decremented immediately upon order submission to prevent overselling.
*   **Notification**: Admin receives a "New Store Order" notification.

### 3.2. Verification & Approval
1.  **Admin Review**: Admin views the order in **Admin Dashboard > Store Orders**.
2.  **Action**:
    *   **Approve Payment**: If receipt is valid. Status changes to `preparing`.
    *   **Reject**: If receipt is invalid or stock issue. Status changes to `rejected`. (Stock is restored).
    *   **Accept COD**: For Cash on Delivery orders. Status changes to `preparing`.

### 3.3. Fulfillment Lifecycle
1.  **Preparing (`preparing`)**: Warehouse is packing the items.
2.  **Shipped (`shipped`)**: Item handed over to delivery service.
3.  **Delivered (`delivered`)**: Item received by customer.
    *   *Effect*: Transaction is marked complete. This adds to the system's total revenue stats.

## 4. User Updates
At every stage change (`Approved`, `Shipped`, `Rejected`), the user receives:
1.  **In-App Notification**: "Your order status has changed to X".
2.  **Toast Message**: If online.

## 5. Cancellation
*   **User**: Can cancel order only while status is `pending` or `payment_verification`.
*   **Admin**: Can cancel order at any stage before `delivered`.
*   **Effect**: Cancelled orders restore the deducted stock to the product inventory.
