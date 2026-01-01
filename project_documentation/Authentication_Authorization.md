# Authentication & Authorization System Documentation

## Overview
This document outlines the authentication and authorization mechanisms used in the Ramouse Auto Parts application. It details the login flow, user roles, session persistence, and security measures.

## User Types & Roles
The application supports multiple user types, each with specific access rights:

1.  **Admin User (`admin`)**:
    *   **Source**: `users` table in the database with `is_admin = true`.
    *   **Access**: Full access to the Admin Dashboard, settings, user management, and all system features.
    *   **Legacy Admin**: There is also a "Settings Admin" defined in the application settings (phone/password), but the database-driven Admin User is the primary method for scalable administration.

2.  **Customer (`customer`)**:
    *   **Source**: `customers` table.
    *   **Access**: Customer Dashboard, creating orders, viewing order status.

3.  **Provider (`provider`)**:
    *   **Source**: `providers` table.
    *   **Access**: Provider Dashboard, viewing available orders, submitting quotes.

4.  **Technician (`technician`)**:
    *   **Source**: `technicians` table.
    *   **Access**: Technician Dashboard, profile management.

5.  **Tow Truck (`tow_truck`)**:
    *   **Source**: `tow_trucks` table.
    *   **Access**: Tow Truck Dashboard, profile management.

## Authentication Flow

### 1. Login Process
The login process is handled by the `AuthController` in the backend and `auth.service.ts` in the frontend.

1.  **User Input**: User provides phone number and password.
2.  **Backend Verification** (`POST /api/login`):
    *   The backend checks the credentials against all user tables (`users`, `customers`, `providers`, `technicians`, `tow_trucks`).
    *   **Priority**: It checks in a specific order (Admin -> Provider -> Technician -> TowTruck -> Customer).
3.  **Response**:
    *   On success, the backend returns:
        *   `token`: Sanctum API token.
        *   `user`: User object details.
        *   `role`: The detected role (e.g., 'admin', 'customer').
        *   `is_admin`: Boolean flag (true for Admin Users).
        *   `user_type`: Specific user type string.

### 2. Frontend Session Management
To ensure users remain logged in and retain their correct role after a page refresh, the frontend persists key information.

*   **Storage**: `localStorage` is used to store session data.
*   **Stored Keys**:
    *   `authToken`: The API token for authenticated requests.
    *   `userPhone`: The user's identifier.
    *   `isAuthenticated`: Boolean flag.
    *   `isAdmin`: Boolean flag (persisted from backend response).
    *   `userType`: String (persisted from backend response).

### 3. Session Restoration (`useAppState.ts`)
When the application loads (or refreshes):
1.  The `loadApp` function in `useAppState` runs.
2.  It checks `localStorage` for `isAuthenticated` and `userPhone`.
3.  **CRITICAL**: It reads `isAdmin` and `userType` from `localStorage`.
    *   If `isAdmin === 'true'`, the user is immediately granted Admin access.
    *   If `userType` is present, the corresponding role state (`isProvider`, `isTechnician`, etc.) is set.
4.  This ensures the user is directed to the correct dashboard (e.g., Admin Dashboard) instead of defaulting to the Customer Dashboard.

## Authorization

### Route Protection
*   **Frontend**: The application uses `react-router-dom` for routing. Protected routes (like `/admin`, `/dashboard`) are guarded within `App.tsx` using conditional rendering (e.g., `isAdmin ? <AdminDashboard /> : <Navigate to="/" />`). This ensures unauthorized users are immediately redirected.
*   **Backend**: API routes are protected using Laravel Sanctum (`auth:sanctum`). Middleware can be added to further restrict routes to specific roles (e.g., `admin` middleware).

### Broadcasting (Real-time)
*   **Channels**: Private channels (e.g., `user.{id}`) are used for personal notifications.
*   **Auth**: The `/api/broadcasting/auth` endpoint authenticates the user for these channels, ensuring they can only listen to their own events.

## Security Best Practices
*   **Tokens**: API tokens are used for all server interactions.
*   **HTTPS**: All traffic should be over HTTPS in production.
*   **Role Validation**: The backend validates the user's role for every sensitive action, not just relying on the frontend state.

## Troubleshooting
*   **Redirect to Customer Dashboard**: If an admin is redirected to the customer dashboard on refresh, it means `isAdmin` was not saved to or read from `localStorage`. Check `auth.service.ts` and `useAppState.ts`.
*   **401 Unauthorized**: Indicates an invalid or expired token. The user must log in again.
