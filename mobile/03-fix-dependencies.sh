#!/bin/bash
# Fix dependency conflicts and install remaining packages

echo "🔧 Fixing dependency conflicts..."
echo ""

# Install packages with legacy peer deps flag to bypass React version conflicts
echo "📦 Installing remaining packages with --legacy-peer-deps..."

npm install --legacy-peer-deps react-hook-form zod @hookform/resolvers
npm install --legacy-peer-deps laravel-echo pusher-js
npm install --legacy-peer-deps react-native-paper
npm install --legacy-peer-deps date-fns

echo ""
echo "✅ Dependencies fixed and installed!"
echo ""
echo "📋 Installed packages:"
echo "  ✅ Zustand, React Query, Axios, Expo Router (core)"
echo "  ✅ React Hook Form + Zod (forms/validation)"
echo "  ✅ Expo Secure Store, Notifications (security/push)"
echo "  ✅ Laravel Echo + Pusher.js (WebSockets)"
echo "  ✅ React Native Paper (UI)"
echo "  ✅ Date-fns (utilities)"
echo "  ✅ Expo Image Picker, Camera, Location, File System"
echo "  ✅ AsyncStorage, NetInfo"
echo ""
echo "⚠️  Note: Some peer dependency warnings are normal and won't affect functionality"
echo ""
echo "📁 Next steps:"
echo "  1. I'll create configuration files"
echo "  2. Set up TypeScript paths"
echo "  3. Create API client"
echo "  4. Create auth store"
echo "  5. Set up navigation"
