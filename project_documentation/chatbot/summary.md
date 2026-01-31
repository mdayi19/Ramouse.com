# AI Chatbot Summary

## Overview
The Ramouse AI Chatbot is an intelligent assistant designed to help users navigate the platform's services using natural language. It leverages **Google Gemini** to understand user intent and execute specialized tools to find cars, technicians, tow trucks, and spare parts.

## Key Features
- **Natural Language Understanding**: Powered by Google Gemini (Pro 1.5).
- **Arabic First**: Optimized for Arabic language interaction (Syrian/Saudi dialects).
- **Smart Search Tools**:
  - 🚗 **Find Cars**: Search for cars for sale or rent by make, model, and year.
  - 🛠️ **Find Technicians**: Locate mechanics and various specialists nearby.
  - 🚚 **Tow Trucks**: Find emergency towing services.
  - 🛒 **Spare Parts**: Search the store for specific products.
- **Context Awareness**: Maintains conversation history for follow-up questions.
- **Dual Interface**:
  - **Voice**: Web Speech API integration for voice-to-text.
  - **Text**: Modern chat interface with Markdown support.

## Architecture Highlights
- **Backend (Laravel)**:
  - `AiSearchService`: Handles Gemini API communication and tool execution.
  - `ChatbotController`: Manages rate limiting, security, and message storage.
  - `ChatHistory`: Stores conversation logs in MySQL.
- **Frontend (React/Vite)**:
  - `ChatWidget`: A responsive, floating chat interface.
  - `ChatService`: Handles API communication and session management.
  - **Rich UI**: Uses `framer-motion` for smooth animations and premium feel.

## Current Status
- ✅ Backend Logic Implemented
- ✅ Frontend UI Component Built
- ⚠️ Pending Database Connection (Requires MySQL Service)
- ⚠️ Pending API Key Configuration (`GEMINI_API_KEY`)
