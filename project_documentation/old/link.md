
# How to Link Frontend (React) with Backend (Laravel)

This guide details the steps to transition the Ramouse Auto Parts application from **Mock Data/Local Storage** mode to **Real API** mode using the Laravel backend.

## 1. Environment Configuration

### Frontend (`.env.local`)
Update the Vite environment variables to point to your running Laravel server.

```env
# .env.local
VITE_API_URL=http://localhost:8000/api
```

### Backend (`.env`)
Ensure your Laravel application permits requests from the frontend URL (CORS).

```env
# Laravel .env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

**Note on CORS:**
In Laravel's `config/cors.php`, ensure `supports_credentials` is set to `true` if you plan to use cookie-based session authentication, or ensure `'allowed_origins'` includes your frontend URL.

---

## 2. Authentication & Token Handling

The frontend is pre-configured to use **Bearer Tokens** via `lib/api.ts`.

1.  **Login Flow**:
    *   User submits credentials.
    *   Backend validates and returns a Sanctum plain text token.
    *   Frontend stores this token in `localStorage.setItem('authToken', token)`.

2.  **Axios Interceptor**:
    *   The file `lib/api.ts` automatically attaches this token to every subsequent request:
        ```ts
        config.headers.Authorization = `Bearer ${token}`;
        ```

---

## 3. Refactoring Services

Currently, the application uses mock data in `services/*.ts` and direct `localStorage` manipulation in `hooks/useAppState.ts`. To link the backend, you must update these service files.

### 3.1. Auth Service (`services/auth.service.ts`)

**Current (Mock):**
```ts
login: async (phone, password) => {
    // ... mock logic with setTimeout ...
}
```

**Updated (Real):**
```ts
import { api } from '../lib/api';

export const AuthService = {
    login: async (phone: string, password: string): Promise<AuthResponse> => {
        // The endpoint should match routes/api.php
        const response = await api.post<AuthResponse>('/auth/login', { phone, password });
        
        // Save token
        if (response.data.token) {
            localStorage.setItem('authToken', response.data.token);
        }
        
        return response.data;
    },
    // ... implement register, logout similarly
};
```

### 3.2. Order Service (`services/order.service.ts`)

**Current (Mock):**
```ts
getAll: async () => {
    return JSON.parse(localStorage.getItem('all_orders') || '[]');
}
```

**Updated (Real):**
```ts
export const OrderService = {
    getAll: async (): Promise<Order[]> => {
        const response = await api.get<{ data: Order[] }>('/orders');
        return response.data.data; // Assuming Laravel Resource response structure
    },

    create: async (orderData: FormData): Promise<ApiResponse<Order>> => {
        // FormData is required for file uploads
        return await api.post('/orders', orderData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};
```

---

## 4. Updating State Management (`hooks/useAppState.ts`)

The `useAppState` hook currently initializes state from `localStorage`. You need to replace these initial loads with `useEffect` hooks that call your Services.

**Example: Loading Orders**

**Current:**
```ts
useEffect(() => {
    setAllOrders(loadData('all_orders', []));
}, []);
```

**Updated:**
```ts
import { OrderService } from '../services/order.service';

useEffect(() => {
    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const orders = await OrderService.getAll();
            setAllOrders(orders);
        } catch (error) {
            console.error("Failed to fetch orders", error);
            // Handle token expiration or network error
        } finally {
            setIsLoading(false);
        }
    };

    if (isAuthenticated) {
        fetchOrders();
    }
}, [isAuthenticated]);
```

---

## 5. Handling File Uploads

The current frontend uses `lib/db.ts` (IndexedDB) or a local Node server (`server.js`) to store images.

**To switch to Laravel Storage:**

1.  **In Forms**: When creating an order or profile, use `FormData`.
    ```ts
    const formData = new FormData();
    formData.append('category', data.category);
    data.images.forEach((file, index) => {
        formData.append(`images[${index}]`, file);
    });
    ```

2.  **In Laravel**:
    *   Store the file: `$path = $request->file('images.0')->store('orders', 'public');`
    *   Return the full URL: `asset('storage/' . $path)`.

3.  **In Frontend**:
    *   The `Order` type expects `images` to be an array of strings (URLs).
    *   Ensure the API returns full URLs (e.g., `http://localhost:8000/storage/orders/img1.jpg`).

---

## 6. Checklist for Full Integration

1.  [ ] **API Endpoints**: Ensure Laravel `routes/api.php` implements all endpoints defined in `project_documentation/Laravel.md`.
2.  [ ] **Models match Types**: Ensure the JSON response from Laravel matches the interfaces in `types.ts`.
3.  [ ] **Remove Mock Data**: Delete `placeholder-data.ts` calls in `useAppState.ts`.
4.  [ ] **Error Handling**: Update `lib/api.ts` interceptors to handle validation errors (422) and display them via `showToast`.
