
# Ramouse Auto Parts - System Information & Frontend Guide

This document provides a comprehensive overview of the Ramouse Auto Parts frontend application, covering its architecture, data flow, state management, and core components.

## 1. Technology Stack

*   **Framework**: [React](https://reactjs.org/) with TypeScript.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a custom theme defined in `index.html`.
*   **Icons**: [Lucide React](https://lucide.dev/) for a consistent and lightweight icon set, wrapped in a custom `Icon` component.
*   **AI**: [Google GenAI SDK](https://www.npmjs.com/package/@google/genai) using **Gemini 3.0 Pro** for deep reasoning/diagnostics and **Gemini 2.5 Flash** for standard queries.
*   **PDF Generation**: `html2pdf.js` for generating printable receipts and profiles.
*   **QR Codes**: `qrcode` library for generating profile and verification codes.
*   **Backend (Local)**: Node.js Express server (`server.js`) for handling file uploads.

## 2. Project Structure

The application is structured as a single-page application (SPA) with a modular component design.

*   **`hooks/`**: Contains custom React hooks.
    *   `useAppState.ts`: The brain of the application. Centralizes state for Orders, Users, Settings, and Navigation.
    *   `useTelegram.ts`: Manages the queueing and sending of complex notifications (text + media) to Telegram channels.
*   **`lib/`**: Utility libraries.
    *   `db.ts`: A wrapper that toggles between **IndexedDB** and **Server API** for media storage depending on configuration.
    *   `api.ts`: Axios instance for API communication.
    *   `config.ts`: Configuration flags (e.g., `USE_SERVER_STORAGE`).
*   **`services/`**: Service layer for API interaction (Auth, Orders), currently supporting mock implementations for rapid prototyping.
*   **`components/`**: Organized by feature.
    *   `DashboardParts/`: Admin dashboard sub-components, including a specialized `Store/` directory for e-commerce management.
    *   `CustomerDashboardParts/`: Sub-components for the customer view, including Store browsing and Garage management.
    *   `ProviderDashboardParts/`, `TechnicianDashboardParts/`, `TowTruckDashboardParts/`: Dashboard views for specific user roles.
    *   Shared components like `MediaUpload`, `VoiceRecorder`, `CountdownTimer`, `IconSearch`.

## 3. State Management & Data Persistence

### 3.1. Global State
Managed via `useAppState.ts`. It handles:
*   **User Session**: Authentication state for Admin, Provider, Customer, Technician, and Tow Truck.
*   **Data Collections**: Orders, Users, Products, Categories.
*   **UI State**: Current view, modals, toasts, sidebar status.

### 3.2. Data Persistence strategy
*   **`localStorage`**: Stores JSON data for relational entities (Users, Orders, Settings, Products).
    *   Keys: `all_orders`, `all_providers`, `all_customers`, `admin_flash_products`, `app_settings`, `app_car_categories`, `app_all_brands`, `app_part_types`, `app_technician_specialties`, `app_store_categories`, `app_brand_models`, `app_announcements`.
*   **Media Storage**:
    *   **IndexedDB (Default)**: Stores binary data (blobs) locally in the browser if server is unavailable.
    *   **Local Server**: If `server.js` is running and configured, files are uploaded to the `uploads/` directory via the `/api/upload` endpoint to allow for persistence across reloads without quota limits.

## 4. Core Features & Workflows

### 4.1. Multi-Role System
The app supports distinct dashboards for:
*   **Admin**: Full control over users, orders, content, store, system settings, and dynamic data models.
*   **Customer**: Order parts, browse store, manage garage, view technician/tow truck directories.
*   **Provider**: View open orders, submit quotes, manage wallet, buy flash products.
*   **Technician**: Public profile, receive reviews, buy specialized parts.
*   **Tow Truck**: Public profile, service area management, receive reviews.

### 4.2. Store & Flash Sales
*   **Store**: A persistent catalog of products organized by category/subcategory.
*   **Flash Sales**: Time-limited offers with countdown timers, specifically targeted at Providers or Technicians.
*   **Cart & Checkout**: Full shopping cart functionality with support for "Cash on Delivery" and "Bank Transfer" (with receipt upload).

### 4.3. AI Assistant (Gemini)
*   **Diagnostics**: Uses **Gemini 3.0 Pro** with the new `thinkingConfig` (budget: 32k) for deep reasoning to analyze complex vehicle symptoms and suggest fixes.
*   **Vehicle Info**: Generates maintenance tips and facts based on the car model.
*   **Live Search**: Integrated Google Search grounding via Gemini 2.5 Flash for fetching real-time market info.

### 4.4. Telegram Integration
*   Automated posting of new orders to specific Telegram channels based on Car Category.
*   Supports sending media groups (photos/videos) along with the order details.
*   Managed via a queue system to respect Telegram API rate limits.

### 4.5. Geolocation Services
*   **Technician/Tow Truck Directory**: Users can sort service providers by "Nearest to Me" using browser geolocation.
*   **Registration**: Providers can pin their workshop location on the map during registration.

### 4.6. Admin & Model Management
*   **Dynamic Models**: Admins can manage Car Categories, Brands, Part Types, and Technician Specialties directly from the dashboard.
*   **Telegram Configuration**: Configure Bot Tokens and Channel IDs per Car Category for targeted notifications.

## 5. UI Conventions
*   **Dark Mode**: Fully supported.
*   **RTL Support**: Native Arabic interface direction.
*   **Responsive**: Optimized for mobile and desktop.
*   **Printable Views**: Dedicated layouts for printing Shipping Receipts (`ShippingReceipt.tsx`) and Professional Profiles (`PrintableTechnicianProfile.tsx`).
