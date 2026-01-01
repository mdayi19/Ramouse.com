# Ramouse API Documentation

Welcome to the Ramouse API documentation. This API allows you to interact with the Ramouse Auto Parts platform, including user authentication, service orders, e-commerce store, content management, and administrative functions.

## Base URL
```
http://127.0.0.1:8001/api
```

## Table of Contents
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Authentication Endpoints](#authentication-endpoints)
- [Profile & Account Management](#profile--account-management)
- [File Upload Endpoints](#file-upload-endpoints)
- [Public Directory Endpoints](#public-directory-endpoints)
- [Store Endpoints (Public)](#store-endpoints-public)
- [Blog & FAQ Endpoints (Public)](#blog--faq-endpoints-public)
- [Notification Endpoints](#notification-endpoints)
- [Protected Order Endpoints](#protected-order-endpoints)
- [Provider APIs](#provider-apis)
- [Wallet & Financials](#wallet--financials)
- [International License Endpoints](#international-license-endpoints)
- [Protected Store Endpoints](#protected-store-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Real-time Broadcasting](#real-time-broadcasting)

---

## Authentication

The API uses **Laravel Sanctum** for authentication.

- **Header**: `Authorization: Bearer <your_token>`
- **Token**: Obtained via the `/auth/login` or registration endpoints

### Example Header
```
Authorization: Bearer 1|laravel_sanctum_token_here...
```

---

## Error Handling

The API returns standard HTTP status codes. Error responses typically follow this format:

**Response (422 Unprocessable Entity):**
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": [
            "The email has already been taken."
        ]
    }
}
```

**Common Status Codes:**
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: User does not have permission
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

---

## Authentication Endpoints

### Login
**POST** `/auth/login`

Authenticate a user and receive an access token.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `phone` | string | Yes | User's phone number |
| `password` | string | Yes | User's password |

**Request Example:**
```json
{
    "phone": "0912345678",
    "password": "password123"
}
```

**Response (200 OK):**
```json
{
    "message": "Login successful",
    "user": {
        "id": "0912345678",
        "name": "John Doe",
        "email": "john@example.com"
    }
}
```

**Response (401 Unauthorized):**
```json
{
    "message": "Invalid credentials"
}
```

---

### Register Customer
**POST** `/auth/register/customer`

Register a new customer account.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | Yes | Full name |
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | Password (min 8 characters) |
| `password_confirmation` | string | Yes | Password confirmation |
| `phone` | string | Yes | Phone number |

**Request Example:**
```json
{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "phone": "0912345678"
}
```

**Response (200 OK):**
```json
{
    "message": "Customer registered successfully"
}
```

---

### Register Technician
**POST** `/auth/register/technician`

Register a new technician account.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | Yes | Full name |
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | Password (min 8 characters) |
| `phone` | string | Yes | Phone number |
| `specialty` | string | Yes | Technician specialty |
| `city` | string | Yes | City/location |

**Request Example:**
```json
{
    "name": "Ahmed Mechanic",
    "email": "ahmed@example.com",
    "password": "password123",
    "phone": "0912345678",
    "specialty": "engine_repair",
    "city": "Damascus"
}
```

**Response (200 OK):**
```json
{
    "message": "Technician registered successfully"
}
```

---

### Register Tow Truck
**POST** `/auth/register/tow-truck`

Register a new tow truck service provider.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | Yes | Business/owner name |
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | Password (min 8 characters) |
| `phone` | string | Yes | Phone number |
| `vehicle_type` | string | Yes | Type of tow truck |
| `city` | string | Yes | City/location |

**Request Example:**
```json
{
    "name": "Quick Tow Service",
    "email": "quicktow@example.com",
    "password": "password123",
    "phone": "0912345678",
    "vehicle_type": "flatbed",
    "city": "Damascus"
}
```

**Response (200 OK):**
```json
{
    "message": "Tow Truck registered successfully"
}
```

---

### Send OTP
**POST** `/auth/otp/send`

Send a one-time password (OTP) to a phone number via WhatsApp.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `phone` | string | Yes | Phone number to send OTP to |

**Request Example:**
```json
{
    "phone": "0912345678"
}
```

**Response (200 OK):**
```json
{
    "message": "OTP sent successfully",
    "expires_in": 300
}
```

**Response (500 Internal Server Error):**
```json
{
    "message": "Failed to send OTP",
    "error": "WhatsApp API error"
}
```

---

### Verify OTP
**POST** `/auth/otp/verify`

Verify an OTP code.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `phone` | string | Yes | Phone number |
| `otp` | string | Yes | 6-digit OTP code |

**Request Example:**
```json
{
    "phone": "0912345678",
    "otp": "123456"
}
```

**Response (200 OK):**
```json
{
    "message": "OTP verified successfully",
    "verified": true
}
```

**Response (400 Bad Request):**
```json
{
    "message": "Invalid OTP"
}
```

---

## File Upload Endpoints

### Upload Single File
**POST** `/upload`

Upload a single file (image, video, audio, or document).

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `file` | file | Yes | File to upload (max 50MB) |

**Request Example:**
```
Content-Type: multipart/form-data

file: [binary file data]
```

**Response (201 Created):**
```json
{
    "success": true,
    "message": "File uploaded successfully",
    "data": {
        "filename": "550e8400-e29b-41d4-a716-446655440000.jpg",
        "path": "uploads/images/550e8400-e29b-41d4-a716-446655440000.jpg",
        "url": "/storage/uploads/images/550e8400-e29b-41d4-a716-446655440000.jpg",
        "full_url": "http://127.0.0.1:8001/storage/uploads/images/550e8400-e29b-41d4-a716-446655440000.jpg",
        "type": "image/jpeg",
        "size": 245678
    }
}
```

---

### Upload Multiple Files
**POST** `/upload/multiple`

Upload multiple files at once.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `files` | array | Yes | Array of files to upload (max 50MB each) |

**Request Example:**
```
Content-Type: multipart/form-data

files[]: [binary file data 1]
files[]: [binary file data 2]
```

**Response (201 Created):**
```json
{
    "success": true,
    "message": "Files uploaded successfully",
    "data": [
        {
            "filename": "550e8400-e29b-41d4-a716-446655440000.jpg",
            "path": "uploads/images/550e8400-e29b-41d4-a716-446655440000.jpg",
            "url": "/storage/uploads/images/550e8400-e29b-41d4-a716-446655440000.jpg",
            "full_url": "http://127.0.0.1:8001/storage/uploads/images/550e8400-e29b-41d4-a716-446655440000.jpg",
            "type": "image/jpeg",
            "size": 245678
        },
        {
            "filename": "660e8400-e29b-41d4-a716-446655440001.mp4",
            "path": "uploads/videos/660e8400-e29b-41d4-a716-446655440001.mp4",
            "url": "/storage/uploads/videos/660e8400-e29b-41d4-a716-446655440001.mp4",
            "full_url": "http://127.0.0.1:8001/storage/uploads/videos/660e8400-e29b-41d4-a716-446655440001.mp4",
            "type": "video/mp4",
            "size": 1245678
        }
    ]
}
```

---

### Delete File
**DELETE** `/upload`

Delete an uploaded file.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `path` | string | Yes | Path of the file to delete |

**Request Example:**
```json
{
    "path": "uploads/images/550e8400-e29b-41d4-a716-446655440000.jpg"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "File deleted successfully"
}
```

**Response (404 Not Found):**
```json
{
    "success": false,
    "message": "File not found"
}
```

---

## Public Directory Endpoints

### List Technicians
**GET** `/technicians`

Get a list of verified and active technicians.

**Query Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `city` | string | No | Filter by city |
| `specialty` | string | No | Filter by specialty |

**Request Example:**
```
GET /api/technicians?city=Damascus&specialty=engine_repair
```

**Response (200 OK):**
```json
{
    "data": [
        {
            "id": "tech-001",
            "name": "Ahmed Mechanic",
            "specialty": "engine_repair",
            "city": "Damascus",
            "rating": 4.8,
            "is_verified": true,
            "is_active": true
        }
    ]
}
```

---

### Get Technician Details
**GET** `/technicians/{id}`

Get detailed information about a specific technician.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Technician ID |

**Request Example:**
```
GET /api/technicians/tech-001
```

**Response (200 OK):**
```json
{
    "data": {
        "id": "tech-001",
        "name": "Ahmed Mechanic",
        "specialty": "engine_repair",
        "city": "Damascus",
        "rating": 4.8,
        "is_verified": true,
        "is_active": true,
        "phone": "0912345678",
        "description": "Experienced engine specialist"
    }
}
```

---

### List Tow Trucks
**GET** `/tow-trucks`

Get a list of verified and active tow truck services.

**Query Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `city` | string | No | Filter by city |
| `vehicle_type` | string | No | Filter by vehicle type |

**Request Example:**
```
GET /api/tow-trucks?city=Damascus&vehicle_type=flatbed
```

**Response (200 OK):**
```json
{
    "data": [
        {
            "id": "tow-001",
            "name": "Quick Tow Service",
            "vehicle_type": "flatbed",
            "city": "Damascus",
            "rating": 4.5,
            "is_verified": true,
            "is_active": true
        }
    ]
}
```

---

### Get Tow Truck Details
**GET** `/tow-trucks/{id}`

Get detailed information about a specific tow truck service.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Tow truck ID |

**Request Example:**
```
GET /api/tow-trucks/tow-001
```

**Response (200 OK):**
```json
{
    "data": {
        "id": "tow-001",
        "name": "Quick Tow Service",
        "vehicle_type": "flatbed",
        "city": "Damascus",
        "rating": 4.5,
        "is_verified": true,
        "is_active": true,
        "phone": "0912345678",
        "description": "24/7 towing service"
    }
}
```

---

## Store Endpoints (Public)

### List Products
**GET** `/store/products`

Get a list of all products in the store.

**Query Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `category_id` | integer | No | Filter by category ID |
| `is_flash` | boolean | No | Filter flash sale products |

**Request Example:**
```
GET /api/store/products?category_id=1&is_flash=true
```

**Response (200 OK):**
```json
{
    "data": [
        {
            "id": "prod-001",
            "name": "Mobil 1 Engine Oil",
            "description": "Premium synthetic oil",
            "price": 250000,
            "discount_price": 225000,
            "is_flash": true,
            "store_category_id": 1,
            "image_url": "http://example.com/image.jpg",
            "stock": 50
        }
    ]
}
```

---

### Get Product Details
**GET** `/store/products/{id}`

Get detailed information about a specific product including reviews.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Product ID |

**Request Example:**
```
GET /api/store/products/prod-001
```

**Response (200 OK):**
```json
{
    "data": {
        "id": "prod-001",
        "name": "Mobil 1 Engine Oil",
        "description": "Premium synthetic oil",
        "price": 250000,
        "discount_price": 225000,
        "is_flash": true,
        "store_category_id": 1,
        "image_url": "http://example.com/image.jpg",
        "stock": 50,
        "reviews": [
            {
                "id": "rev-001",
                "user_name": "John Doe",
                "rating": 5,
                "comment": "Excellent product!",
                "date": "2025-11-20T10:00:00Z"
            }
        ]
    }
}
```

---

### List Store Categories
**GET** `/store/categories`

Get all store product categories.

**Request Example:**
```
GET /api/store/categories
```

**Response (200 OK):**
```json
{
    "data": [
        {
            "id": 1,
            "name": "Engine Oil",
            "icon": "oil-icon.png"
        },
        {
            "id": 2,
            "name": "Brake Parts",
            "icon": "brake-icon.png"
        }
    ]
}
```

---

## Blog & FAQ Endpoints (Public)

### List Blog Posts
**GET** `/blog`

Get all published blog posts.

**Query Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `search` | string | No | Search in title, summary, or content |
| `limit` | integer | No | Limit number of results |
| `per_page` | integer | No | Items per page (default: 10) |

**Request Example:**
```
GET /api/blog?search=maintenance&limit=5
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": "blog-001",
            "slug": "car-maintenance-tips",
            "title": "Essential Car Maintenance Tips",
            "summary": "Learn how to maintain your car properly",
            "content": "Full blog content here...",
            "imageUrl": "http://example.com/blog-image.jpg",
            "author": "Admin",
            "publishedAt": "2025-11-20T10:00:00Z"
        }
    ]
}
```

---

### Get Blog Post
**GET** `/blog/{identifier}`

Get a single blog post by ID or slug.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `identifier` | string | Yes | Blog post ID or slug |

**Request Example:**
```
GET /api/blog/car-maintenance-tips
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": "blog-001",
        "slug": "car-maintenance-tips",
        "title": "Essential Car Maintenance Tips",
        "summary": "Learn how to maintain your car properly",
        "content": "Full blog content here...",
        "imageUrl": "http://example.com/blog-image.jpg",
        "author": "Admin",
        "publishedAt": "2025-11-20T10:00:00Z"
    }
}
```

**Response (404 Not Found):**
```json
{
    "success": false,
    "message": "Blog post not found"
}
```

---

### List FAQ Items
**GET** `/faq`

Get all FAQ items.

**Request Example:**
```
GET /api/faq
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": "faq-001",
            "question": "How do I place an order?",
            "answer": "You can place an order by...",
            "created_at": "2025-11-20T10:00:00Z"
        }
    ]
}
```

---

### Get FAQ Item
**GET** `/faq/{id}`

Get a single FAQ item.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | FAQ item ID |

**Request Example:**
```
GET /api/faq/faq-001
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": "faq-001",
        "question": "How do I place an order?",
        "answer": "You can place an order by...",
        "created_at": "2025-11-20T10:00:00Z"
    }
}
```

---

## Notification Endpoints

### Test WhatsApp Notification
**POST** `/notifications/test-whatsapp`

Send a test WhatsApp notification (for development/testing).

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `phone` | string | Yes | Phone number to send to |
| `type` | string | Yes | Type: `otp`, `order`, `quote`, `status`, `store`, `welcome` |

**Request Example:**
```json
{
    "phone": "0912345678",
    "type": "otp"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Message sent successfully"
}
```

---

### Get Notification Stats
**GET** `/notifications/stats`

Get WhatsApp notification statistics.

**Request Example:**
```
GET /api/notifications/stats
```

**Response (200 OK):**
```json
{
    "message": "Statistics endpoint - implement as needed"
}
```

---

## Protected Order Endpoints

> **Note:** All endpoints in this section require authentication via Bearer token.

### Get Current User
**GET** `/user`

Get the authenticated user's information.

**Request Example:**
```
GET /api/user
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
    "id": "0912345678",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
}
```

---

### Create Order
**POST** `/orders`

Create a new service order.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `form_data` | array | Yes | Order form data |
| `customer_name` | string | No | Customer name |
| `customer_address` | string | No | Customer address |
| `customer_phone` | string | No | Customer phone |
| `delivery_method` | string | No | Delivery method (default: 'shipping') |

**Request Example:**
```json
{
    "form_data": {
        "car_brand": "Toyota",
        "car_model": "Camry",
        "year": "2020",
        "part_type": "Engine",
        "description": "Need engine oil filter"
    },
    "customer_name": "John Doe",
    "customer_address": "Damascus, Syria",
    "customer_phone": "0912345678",
    "delivery_method": "shipping"
}
```

**Response (201 Created):**
```json
{
    "message": "Order created successfully",
    "data": {
        "order_number": "ORD-1732464000-abcd",
        "user_id": "0912345678",
        "status": "قيد المراجعة",
        "form_data": { ... },
        "customer_name": "John Doe",
        "customer_address": "Damascus, Syria",
        "customer_phone": "0912345678",
        "delivery_method": "shipping",
        "created_at": "2025-11-24T12:00:00Z"
    }
}
```

---

### List Orders
**GET** `/orders`

Get all orders for the authenticated user.

**Request Example:**
```
GET /api/orders
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
    "data": [
        {
            "order_number": "ORD-1732464000-abcd",
            "status": "قيد المراجعة",
            "customer_name": "John Doe",
            "date": "2025-11-24T12:00:00Z"
        }
    ]
}
```

---

### Get Order Details
**GET** `/orders/{orderNumber}`

Get detailed information about a specific order including quotes.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `orderNumber` | string | Yes | Order number |

**Request Example:**
```
GET /api/orders/ORD-1732464000-abcd
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
    "data": {
        "order_number": "ORD-1732464000-abcd",
        "status": "قيد المراجعة",
        "form_data": { ... },
        "customer_name": "John Doe",
        "quotes": [
            {
                "id": "quote-001",
                "provider_name": "Ahmed Parts",
                "price": 500000,
                "part_status": "new",
                "notes": "Original part available"
            }
        ]
    }
}
```

---

### Submit Quote (Provider)
**POST** `/orders/{orderNumber}/quotes`

Submit a quote for an order (providers only).

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `orderNumber` | string | Yes | Order number |

**Body Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `price` | numeric | Yes | Quote price |
| `part_status` | string | Yes | Part status (e.g., 'new', 'used') |
| `part_size_category` | string | No | Part size category |
| `notes` | string | No | Additional notes |
| `media` | array | No | Media URLs |

**Request Example:**
```json
{
    "price": 500000,
    "part_status": "new",
    "part_size_category": "medium",
    "notes": "Original Toyota part, 1 year warranty",
    "media": ["http://example.com/part-image.jpg"]
}
```

**Response (201 Created):**
```json
{
    "message": "Quote submitted",
    "data": {
        "id": "quote-001",
        "order_number": "ORD-1732464000-abcd",
        "provider_id": "provider_1",
        "provider_name": "Ahmed Parts",
        "price": 500000,
        "part_status": "new",
        "part_size_category": "medium",
        "notes": "Original Toyota part, 1 year warranty"
    }
}
```

---

### Accept Quote (Customer)
**POST** `/orders/{orderNumber}/accept`

Accept a quote for an order (customers only).

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `orderNumber` | string | Yes | Order number |

**Body Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `quote_id` | string | Yes | Quote ID to accept |
| `payment_method_id` | string | Yes | Payment method ID |

**Request Example:**
```json
{
    "quote_id": "quote-001",
    "payment_method_id": "cash"
}
```

**Response (200 OK):**
```json
{
    "message": "Quote accepted",
    "data": {
        "order_number": "ORD-1732464000-abcd",
        "status": "بانتظار الدفع",
        "accepted_quote_id": "quote-001",
        "payment_method_id": "cash"
    }
}
```

---

### Update Order Status
**PATCH** `/orders/{orderNumber}/status`

Update the status of an order.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `orderNumber` | string | Yes | Order number |

**Body Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `status` | string | Yes | New status |

**Request Example:**
```json
{
    "status": "قيد التوصيل"
}
```

**Response (200 OK):**
```json
{
    "message": "Status updated",
    "data": {
        "order_number": "ORD-1732464000-abcd",
        "status": "قيد التوصيل"
    }
}
```

---

## Protected Store Endpoints

> **Note:** All endpoints in this section require authentication via Bearer token.

### Purchase Product
**POST** `/store/purchase`

Purchase a product from the store.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `product_id` | string | Yes | Product ID |
| `quantity` | integer | Yes | Quantity to purchase (min: 1) |
| `shipping_address` | string | Yes | Delivery address |
| `contact_phone` | string | No | Contact phone number |
| `delivery_method` | string | No | Delivery method (default: 'shipping') |

**Request Example:**
```json
{
    "product_id": "prod-001",
    "quantity": 2,
    "shipping_address": "Damascus, Syria, Main Street 123",
    "contact_phone": "0912345678",
    "delivery_method": "shipping"
}
```

**Response (201 Created):**
```json
{
    "message": "Purchase successful",
    "data": {
        "id": "STR-abc12345",
        "product_id": "prod-001",
        "buyer_name": "John Doe",
        "quantity": 2,
        "total_price": 500000,
        "status": "pending",
        "shipping_address": "Damascus, Syria, Main Street 123",
        "delivery_method": "shipping"
    }
}
```

---

### List Store Orders
**GET** `/store/orders`

Get all store orders for the authenticated user.

**Request Example:**
```
GET /api/store/orders
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
    "data": [
        {
            "id": "STR-abc12345",
            "product_id": "prod-001",
            "quantity": 2,
            "total_price": 500000,
            "status": "pending",
            "created_at": "2025-11-24T12:00:00Z"
        }
    ]
}
```

---

### Add Product Review
**POST** `/store/products/{id}/review`

Add a review for a product.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Product ID |

**Body Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `rating` | integer | Yes | Rating (1-5) |
| `comment` | string | Yes | Review comment |

**Request Example:**
```json
{
    "rating": 5,
    "comment": "Excellent product, highly recommend!"
}
```

**Response (201 Created):**
```json
{
    "message": "Review added",
    "data": {
        "id": "rev-001",
        "product_id": "prod-001",
        "user_name": "John Doe",
        "rating": 5,
        "comment": "Excellent product, highly recommend!",
        "date": "2025-11-24T12:00:00Z"
    }
}
```

---

## Admin Endpoints

> **Note:** All endpoints in this section require authentication and admin privileges.

### Get Dashboard Stats
**GET** `/admin/stats`

Get dashboard statistics.

**Request Example:**
```
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
    "orders_count": 150,
    "providers_count": 45,
    "revenue": 12500000
}
```

---

### List Withdrawals
**GET** `/admin/withdrawals`

Get all withdrawal requests.

**Request Example:**
```
GET /api/admin/withdrawals
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
    "data": [
        {
            "id": "withdraw-001",
            "provider_id": "provider-001",
            "amount": 1000000,
            "status": "Pending",
            "request_timestamp": "2025-11-24T10:00:00Z"
        }
    ],
    "current_page": 1,
    "per_page": 20,
    "total": 50
}
```

---

### Approve Withdrawal
**POST** `/admin/withdrawals/{id}/approve`

Approve a withdrawal request.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Withdrawal ID |

**Body Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `receiptUrl` | string | No | Receipt/proof URL |

**Request Example:**
```json
{
    "receiptUrl": "http://example.com/receipt.pdf"
}
```

**Response (200 OK):**
```json
{
    "id": "withdraw-001",
    "status": "Approved",
    "decision_timestamp": "2025-11-24T12:00:00Z",
    "receipt_url": "http://example.com/receipt.pdf"
}
```

---

### Reject Withdrawal
**POST** `/admin/withdrawals/{id}/reject`

Reject a withdrawal request and refund the provider.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Withdrawal ID |

**Body Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `reason` | string | No | Rejection reason |

**Request Example:**
```json
{
    "reason": "Insufficient documentation"
}
```

**Response (200 OK):**
```json
{
    "id": "withdraw-001",
    "status": "Rejected",
    "decision_timestamp": "2025-11-24T12:00:00Z",
    "admin_notes": "Insufficient documentation"
}
```

---

### List Transactions
**GET** `/admin/transactions`

Get all financial transactions.

**Request Example:**
```
GET /api/admin/transactions
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
    "data": [
        {
            "id": "txn-001",
            "provider_id": "provider-001",
            "type": "manual_deposit",
            "amount": 500000,
            "description": "Bonus payment",
            "balance_after": 1500000,
            "timestamp": "2025-11-24T10:00:00Z"
        }
    ],
    "current_page": 1,
    "per_page": 20,
    "total": 200
}
```

---

### Add Funds to Provider
**POST** `/admin/providers/{id}/add-funds`

Manually add funds to a provider's wallet.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Provider ID |

**Body Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `amount` | numeric | Yes | Amount to add (min: 0.01) |
| `description` | string | Yes | Transaction description |

**Request Example:**
```json
{
    "amount": 500000,
    "description": "Monthly bonus payment"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "new_balance": 2000000
}
```

---

### Get Settings
**GET** `/admin/settings`

Get all system settings.

**Request Example:**
```
GET /api/admin/settings
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
    "whatsapp_api_key": "your-api-key",
    "commission_rate": 0.15,
    "max_withdrawal_amount": 5000000
}
```

---

### Update Settings
**PUT** `/admin/settings`

Update system settings.

**Body Parameters:**
Send any settings as key-value pairs.

**Request Example:**
```json
{
    "commission_rate": 0.20,
    "max_withdrawal_amount": 10000000,
    "verificationApis": {
        "apiKey": "new-key"
    }
}
```

**Response (200 OK):**
```json
{
    "message": "Settings updated successfully",
    "data": {
        "commission_rate": 0.20,
        "max_withdrawal_amount": 10000000
    }
}
```

---

### Get All Vehicle Data
**GET** `/admin/vehicle/data`

Get all vehicle-related data (categories, brands, models, part types, specialties).

**Request Example:**
```
GET /api/admin/vehicle/data
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
    "categories": [
        {
            "id": "cat-001",
            "name": "Sedan",
            "flag": "🚗"
        }
    ],
    "brands": [
        {
            "id": "brand-001",
            "name": "Toyota",
            "logo": "toyota-logo.png"
        }
    ],
    "models": {
        "Toyota": [
            {
                "brand_name": "Toyota",
                "name": "Camry"
            }
        ]
    },
    "partTypes": [
        {
            "id": "part-001",
            "name": "Engine",
            "icon": "engine-icon.png"
        }
    ],
    "specialties": [
        {
            "id": "spec-001",
            "name": "Engine Repair",
            "icon": "repair-icon.png"
        }
    ]
}
```

---

### Save Vehicle Category
**POST** `/admin/vehicle/categories`

Create or update a vehicle category.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Category ID |
| `name` | string | Yes | Category name |
| `flag` | string | Yes | Category flag/emoji |
| `brands` | array | No | Associated brands |
| `telegram_bot_token` | string | No | Telegram bot token |
| `telegram_channel_id` | string | No | Telegram channel ID |
| `telegram_notifications_enabled` | boolean | No | Enable Telegram notifications |

**Request Example:**
```json
{
    "id": "cat-001",
    "name": "Sedan",
    "flag": "🚗",
    "brands": ["Toyota", "Honda"],
    "telegram_notifications_enabled": false
}
```

**Response (200 OK):**
```json
{
    "id": "cat-001",
    "name": "Sedan",
    "flag": "🚗",
    "brands": ["Toyota", "Honda"]
}
```

---

### Delete Vehicle Category
**DELETE** `/admin/vehicle/categories/{id}`

Delete a vehicle category.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Category ID |

**Request Example:**
```
DELETE /api/admin/vehicle/categories/cat-001
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
    "success": true
}
```

---

### Save Brand
**POST** `/admin/vehicle/brands`

Create or update a vehicle brand.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Brand ID |
| `name` | string | Yes | Brand name |
| `logo` | string | No | Brand logo URL |

**Request Example:**
```json
{
    "id": "brand-001",
    "name": "Toyota",
    "logo": "http://example.com/toyota-logo.png"
}
```

**Response (200 OK):**
```json
{
    "id": "brand-001",
    "name": "Toyota",
    "logo": "http://example.com/toyota-logo.png"
}
```

---

### Delete Brand
**DELETE** `/admin/vehicle/brands/{id}`

Delete a vehicle brand.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Brand ID |

**Request Example:**
```
DELETE /api/admin/vehicle/brands/brand-001
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
    "success": true
}
```

---

### Save Car Model
**POST** `/admin/vehicle/models`

Create a car model.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `brand_name` | string | Yes | Brand name |
| `name` | string | Yes | Model name |

**Request Example:**
```json
{
    "brand_name": "Toyota",
    "name": "Camry"
}
```

**Response (200 OK):**
```json
{
    "brand_name": "Toyota",
    "name": "Camry"
}
```

---

### Delete Car Model
**DELETE** `/admin/vehicle/models/{id}`

Delete a car model.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string/integer | Yes | Model ID or name |

**Request Example:**
```
DELETE /api/admin/vehicle/models/1
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
    "success": true
}
```

---

### Save Part Type
**POST** `/admin/vehicle/part-types`

Create or update a part type.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Part type ID |
| `name` | string | Yes | Part type name |
| `icon` | string | No | Part type icon URL |

**Request Example:**
```json
{
    "id": "part-001",
    "name": "Engine",
    "icon": "http://example.com/engine-icon.png"
}
```

**Response (200 OK):**
```json
{
    "id": "part-001",
    "name": "Engine",
    "icon": "http://example.com/engine-icon.png"
}
```

---

### Delete Part Type
**DELETE** `/admin/vehicle/part-types/{id}`

Delete a part type.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Part type ID |

**Request Example:**
```
DELETE /api/admin/vehicle/part-types/part-001
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
    "success": true
}
```

---

### Save Technician Specialty
**POST** `/admin/technicians/specialties`

Create or update a technician specialty.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Specialty ID |
| `name` | string | Yes | Specialty name |
| `icon` | string | No | Specialty icon URL |

**Request Example:**
```json
{
    "id": "spec-001",
    "name": "Engine Repair",
    "icon": "http://example.com/repair-icon.png"
}
```

**Response (200 OK):**
```json
{
    "id": "spec-001",
    "name": "Engine Repair",
    "icon": "http://example.com/repair-icon.png"
}
```

---

### Delete Technician Specialty
**DELETE** `/admin/technicians/specialties/{id}`

Delete a technician specialty.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Specialty ID |

**Request Example:**
```
DELETE /api/admin/technicians/specialties/spec-001
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
    "success": true
}
```

---

### Create Blog Post
**POST** `/admin/blog`

Create a new blog post.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | string | Yes | Blog post title |
| `slug` | string | Yes | URL slug |
| `summary` | string | Yes | Short summary |
| `content` | string | Yes | Full content |
| `image_url` | string | No | Featured image URL |
| `author` | string | No | Author name |

**Request Example:**
```json
{
    "title": "Car Maintenance Tips",
    "slug": "car-maintenance-tips",
    "summary": "Learn essential car maintenance",
    "content": "Full blog content here...",
    "image_url": "http://example.com/blog-image.jpg",
    "author": "Admin"
}
```

**Response (200 OK):**
```json
{
    "data": {
        "id": "blog-001",
        "title": "Car Maintenance Tips",
        "slug": "car-maintenance-tips",
        "published_at": "2025-11-24T12:00:00Z"
    }
}
```

---

### Create FAQ
**POST** `/admin/faq`

Create a new FAQ item.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `question` | string | Yes | FAQ question |
| `answer` | string | Yes | FAQ answer |

**Request Example:**
```json
{
    "question": "How do I track my order?",
    "answer": "You can track your order by..."
}
```

**Response (200 OK):**
```json
{
    "data": {
        "id": "faq-001",
        "question": "How do I track my order?",
        "answer": "You can track your order by..."
    }
}
```

---

### Create Announcement
**POST** `/admin/announcements`

Create a new announcement.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | string | Yes | Announcement title |
| `message` | string | Yes | Announcement message |
| `type` | string | No | Announcement type |

**Request Example:**
```json
{
    "title": "System Maintenance",
    "message": "The system will be down for maintenance...",
    "type": "warning"
}
```

**Response (200 OK):**
```json
{
    "data": {
        "id": "announce-001",
        "title": "System Maintenance",
        "message": "The system will be down for maintenance...",
        "timestamp": "2025-11-24T12:00:00Z"
    }
}
```

---

### Create Product
**POST** `/admin/products`

Create a new store product.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | Yes | Product name |
| `description` | string | Yes | Product description |
| `price` | numeric | Yes | Product price |
| `discount_price` | numeric | No | Discounted price |
| `store_category_id` | integer | Yes | Category ID |
| `image_url` | string | No | Product image URL |
| `stock` | integer | No | Stock quantity |
| `is_flash` | boolean | No | Flash sale product |

**Request Example:**
```json
{
    "name": "Mobil 1 Engine Oil",
    "description": "Premium synthetic oil",
    "price": 250000,
    "discount_price": 225000,
    "store_category_id": 1,
    "image_url": "http://example.com/oil.jpg",
    "stock": 50,
    "is_flash": true
}
```

**Response (200 OK):**
```json
{
    "data": {
        "id": "prod-001",
        "name": "Mobil 1 Engine Oil",
        "price": 250000,
        "discount_price": 225000
    }
}
```

---

### Create Store Category
**POST** `/admin/store/categories`

Create a new store category.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | Yes | Category name |
| `icon` | string | No | Category icon URL |

**Request Example:**
```json
{
    "name": "Engine Oil",
    "icon": "http://example.com/oil-icon.png"
}
```

**Response (200 OK):**
```json
{
    "data": {
        "id": 1,
        "name": "Engine Oil",
        "icon": "http://example.com/oil-icon.png"
    }
}
```

---

### List All Store Orders
**GET** `/admin/store/orders`

Get all store orders (admin view).

**Request Example:**
```
GET /api/admin/store/orders
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
    "data": [
        {
            "id": "STR-abc12345",
            "product_id": "prod-001",
            "buyer_name": "John Doe",
            "quantity": 2,
            "total_price": 500000,
            "status": "pending"
        }
    ]
}
```

---

### Update Store Order
**PATCH** `/admin/store/orders/{id}`

Update a store order status or details.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Store order ID |

**Body Parameters:**
Send any fields to update (e.g., `status`, `tracking_number`).

**Request Example:**
```json
{
    "status": "shipped",
    "tracking_number": "TRACK123456"
}
```

**Response (200 OK):**
```json
{
    "data": {
        "id": "STR-abc12345",
        "status": "shipped",
        "tracking_number": "TRACK123456"
    }
}
```

---

### Update Provider Status
**PATCH** `/admin/providers/{id}/status`

Activate or deactivate a provider.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Provider ID |

**Body Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `is_active` | boolean | Yes | Active status |

**Request Example:**
```json
{
    "is_active": false
}
```

**Response (200 OK):**
```json
{
    "message": "Provider status updated"
}
```

---

### Verify Technician
**PATCH** `/admin/technicians/{id}/verify`

Verify a technician account.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Technician ID |

**Request Example:**
```
PATCH /api/admin/technicians/tech-001/verify
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
    "message": "Technician verified"
}
```

---

### Verify Tow Truck
**PATCH** `/admin/tow-trucks/{id}/verify`

Verify a tow truck service account.

**Path Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Tow truck ID |

**Request Example:**
```
PATCH /api/admin/tow-trucks/tow-001/verify
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
    "message": "Tow Truck verified"
}
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All monetary values are in Syrian Pounds (SYP)
- File uploads support: images (jpg, png, gif), videos (mp4, avi), audio (mp3, wav), and documents (pdf, doc)
- Maximum file upload size: 50MB per file
- Pagination is available on list endpoints with `per_page` and `page` query parameters
- Arabic text is supported throughout the API for status messages and content

---

---

## Profile & Account Management

### Update Profile
**PUT** `/profile` or **PUT** `/provider/profile` (for Providers)

Update the authenticated user's profile information. Handles common fields and role-specific fields (specialties for techs, vehicle types for tow trucks).

**Parameters (JSON or Multipart):**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | No | Full name |
| `email` | string | No | Email address |
| `city` | string | No | Primary city of operation |
| `specialty` | string | No | (Technician) e.g., 'Engine Repair' |
| `vehicle_type` | string | No | (Tow Truck) e.g., 'Flatbed' |
| `profile_photo` | string/file | No | Base64 string or image file |

**Response (200 OK):**
```json
{
    "id": 1,
    "name": "John Doe",
    "phone": "+905319624826",
    "role": "customer",
    "profile_photo_url": "http://127.0.0.1:8001/storage/profiles/photo.jpg"
}
```

---

## Provider APIs

### Get Open Orders
**GET** `/provider/open-orders`

Get a list of service orders available for bidding in the provider's assigned category.

### Get My Bids
**GET** `/provider/my-bids`

List of orders the provider has submitted a quote for.

### Get Accepted Orders
**GET** `/provider/accepted-orders`

List of orders where the provider is the winning bidder and payment has been verified.

### Update Accepted Order Status
**PUT** `/provider/orders/{orderNumber}/status`

Update the progress of an active order.

**Parameters:**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `status` | string | Yes | `provider_received` or `ready_for_pickup` |

**Response (200 OK):**
```json
{
    "message": "Order status updated",
    "data": { ... }
}
```

### Get Overview Data
**GET** `/provider/overview-data`

Get comprehensive dashboard stats, recent transactions, and chart data for the last 7 days.

**Response (200 OK):**
```json
{
    "stats": {
        "walletBalance": 1500.50,
        "activeBids": 5,
        "wonOrders": 12,
        "openOrders": 3,
        "totalBids": 45
    },
    "recentTransactions": [...],
    "charts": {
        "activity": [...],
        "revenue": [...]
    }
}
```

---

## Wallet & Financials

### Get Wallet Balance
**GET** `/wallet/balance` (Users) or **GET** `/provider/wallet-balance` (Providers)

### Get Transactions
**GET** `/wallet/transactions` or **GET** `/provider/transactions`

### Submit Deposit Request (Users)
**POST** `/wallet/deposit`

**Parameters (Multipart):**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `amount` | numeric | Yes | Deposit amount |
| `paymentMethodId` | string | Yes | e.g., 'bank_transfer' |
| `paymentMethodName` | string | Yes | e.g., 'Al Baraka Bank' |
| `receipt` | file | Yes | Image/PDF of payment proof (max 5MB) |

### Request Withdrawal
**POST** `/wallet/withdraw` (Users) or **POST** `/provider/withdrawals` (Providers)

**Parameters (JSON):**
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `amount` | numeric | Yes | Amount to withdraw |
| `paymentMethodId` | string | Yes | Saved payment method ID |
| `paymentMethodName` | string | Yes | Display name of method |
| `paymentMethodDetails` | string | Yes | (Users only) Account details |

---

## International License Endpoints

### Get Pricing
**GET** `/international-license/pricing`

Get pricing rules for different nationalities.

### Step 1: Basic Info
**POST** `/international-license/step1`

Starts the application process. Returns a `step_token`.

### Step 2: Document Upload
**POST** `/international-license/upload-documents`

**Parameters:** `step_token`, `passport_photo`, `personal_photo`, `license_front`, `license_back`.

### Step 3: Payment Proof
**POST** `/international-license/upload-payment-proof`

**Parameters:** `step_token`, `payment_proof`.

### Step 4: Final Submit
**POST** `/international-license/final-submit`

**Parameters:** `step_token`. Finalizes the request and clears cache.

---

### Order Lifecycle Management (Admin)
**PATCH** `/admin/orders/{orderNumber}/[action]`

Admin controls for the full order lifecycle.

| Action | New Status | Description |
| :--- | :--- | :--- |
| `mark-ready` | `ready_for_pickup` / `provider_received` | Order is ready for the next stage |
| `mark-shipped` | `shipped` | Order has been sent to customer |
| `mark-out-for-delivery` | `out_for_delivery` | Order is with delivery agent |
| `mark-delivered` | `delivered` | Customer has received the order |
| `mark-completed` | `completed` | Final state of the order |
| `cancel` | `cancelled` | Reverts funds if applicable |

### User & Provider Management (Admin)

#### List Users
**GET** `/admin/users`

#### Search Users
**GET** `/admin/users/search?query=...`

#### Update User
**PUT** `/admin/users/{id}`

#### Reset Password
**POST** `/admin/users/{id}/reset-password`

#### Manage Providers
**GET/POST/PUT/DELETE** `/admin/providers`

---

## Real-time Broadcasting

The API uses **Laravel Echo** with **Reverb** for real-time events. All private channels require a Bearer token in the auth request.

### Channels
- `user.{userId}`: Account notification (reads, unreads, system alerts).
- `orders.{orderNumber}`: Status updates, new quotes, and quote acceptance.
- `admin.dashboard`: Admin stats updates.
- `admin.international-licenses`: New international license requests.

---

**Last Updated:** December 27, 2025  
**API Version:** 1.1
