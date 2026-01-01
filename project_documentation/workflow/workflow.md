# Ramouse Auto Parts - System Workflows

This document provides a high-level index of the workflows within the application.

## 1. Core Business Flows

### 1.1. Parts Request (Bidding System)
The primary engine of the platform. Users request specific parts, and providers bid to supply them.
*   **Detailed Guide**: [Order Workflow](./order-workflow.md)
*   **Key Actors**: Customer (Requestor), Provider (Bidder), Admin (Facilitator/Logistics).

### 1.2. Store & Flash Sales (Direct Purchase)
The e-commerce component for standard items (oils, tires) and time-sensitive deals.
*   **Detailed Guide**: [Store Workflow](./store-productorder-workflow.md)
*   **Key Actors**: Admin (Seller/Manager), Provider (Seller - Flash Deals), User (Buyer).

## 2. User Management Workflows

### 2.1. Registration
*   **Customer**: Simple phone verification (OTP).
*   **Service Providers (Technician / Tow Truck)**:
    1.  Registration Form (Details, Location, Media).
    2.  Admin Verification (Status: Pending -> Verified).
    3.  Public Listing Activation.

### 2.2. Provider Financials
*   **Earning**: Money enters 'Wallet' when orders are marked `Delivered`.
*   **Withdrawal**:
    1.  Provider requests withdrawal.
    2.  Admin reviews balance.
    3.  Admin processes transfer externally and uploads receipt.
    4.  Wallet balance decremented.

## 3. Content & System Workflows

### 3.1. Reviews
*   **Submission**: Users rate completed services.
*   **Moderation**: Reviews status `Pending` -> Admin `Approved`/`Rejected`.
*   **Response**: Service providers can reply to reviews on their profile.

### 3.2. Notifications
*   **Channels**: In-App, WhatsApp (via API), Telegram (via Bot).
*   **Triggers**: Order Status Change, New Quote, Announcement, Verification.

### 3.3. AI Integration
*   **Diagnostics**: User inputs symptoms -> Gemini API analyzes -> Report generated.
*   **Smart Data**: Vehicle details and maintenance tips generated on demand.
