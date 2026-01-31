# Chatbot Technical Documentation

## 1. System Architecture

### Backend (Laravel)
The backend acts as the orchestrator between the Frontend and the Google Gemini API.

**Core Components:**
- **`App\Services\AiSearchService`**:
  - **Role**: The brain of the chatbot.
  - **Key Methods**:
    - `sendMessage($message, $history)`: Sends prompt to Gemini.
    - `executeTool($toolName, $args)`: Maps Gemini function calls to Eloquent queries.
  - **Tools Defined**:
    - `search_cars`: Queries `CarListing` model.
    - `search_technicians`: Queries `Technician` model.
    - `search_tow_trucks`: Queries `TowTruck` model.
    - `search_products`: Queries `Product` model.

- **`App\Http\Controllers\ChatbotController`**:
  - **Role**: API Endpoint handler.
  - **Route**: `POST /api/chatbot/send`
  - **Middleware**: `throttle:10,1` (Rate limiting).
  - **Logic**: 
    - Validates input.
    - Checks daily limits (5/day Guest, 50/day User).
    - Calls `AiSearchService`.
    - Saves `ChatHistory`.

- **`App\Models\ChatHistory`**:
  - **Table**: `chat_histories`
  - **Columns**: `session_id`, `user_id`, `role` (user/model), `content`, `tool_calls`.

### Frontend (React + TypeScript)
The frontend is a self-contained widget that floats above the application.

**Component Structure:**
- **`FloatingChatBotButton`**: Entry point. Animated floating button.
- **`ChatWidget`**: Main container.
  - **`ChatWelcome`**: Zero-state screen with quick action chips.
  - **`ChatMessage`**: Renders messages using `react-markdown`.
  - **`ChatInput`**: Text area + Voice input button.
- **`ChatService`**:
  - Singleton service for API calls.
  - Manages `chat_session_id` in `localStorage`.

## 2. Setup & Configuration

### Prerequisites
1. **Google Gemini API Key**: Request one from Google AI Studio.
2. **Database**: MySQL must be running.

### Environment Variables (`.env`)
```env
GEMINI_API_KEY=your_key_here
```

### Installation
1. **Migrations**:
   ```bash
   php artisan migrate
   ```
   *Creates `chat_histories` table.*

2. **Run Dev Server**:
   ```bash
   npm run dev
   ```

## 3. API Reference

### Send Message
**Endpoint**: `POST /api/chatbot/send`

**Request Body**:
```json
{
  "message": "User query here",
  "session_id": "optional-uuid-from-previous-response",
  "latitude": 33.5138, // Optional
  "longitude": 36.2765 // Optional
}
```

**Response**:
```json
{
  "response": "Markdown formatted response from AI...",
  "session_id": "uuid-for-continuity",
  "remaining": 49 // Requests remaining for today
}
```

## 4. Security
- **Rate Limiting**: 
  - Throttled to 10 requests per minute per IP.
  - Daily hard limits based on Auth status.
- **Scope**:
  - System Prompt explicitly instructions AI to **only** answer questions related to Ramouse services and ignore general knowledge queries.
- **Input Validation**:
  - Messages validated for string type and max length (1000 chars).
