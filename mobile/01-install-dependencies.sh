#!/bin/bash
# Mobile App Setup Script - Run in Git Bash

echo "🚀 Setting up Ramouse Mobile App..."
echo ""

# Navigate to mobile directory
cd "$(dirname "$0")"

echo "📦 Installing core dependencies..."
npx expo install zustand @tanstack/react-query axios expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

echo ""
echo "📦 Installing form & validation..."
npx expo install react-hook-form zod @hookform/resolvers

echo ""
echo "📦 Installing security & storage..."
npx expo install expo-secure-store expo-local-authentication

echo ""
echo "📦 Installing notifications..."
npx expo install expo-notifications expo-device

echo ""
echo "📦 Installing WebSocket support..."
npm install laravel-echo pusher-js

echo ""
echo "📦 Installing UI components..."
npx expo install react-native-paper @expo/vector-icons

echo ""
echo "📦 Installing utilities..."
npm install date-fns

echo ""
echo "📦 Installing platform features..."
npx expo install expo-image-picker expo-camera expo-location expo-file-system @react-native-async-storage/async-storage

echo ""
echo "📦 Installing network utilities..."
npx expo install @react-native-community/netinfo

echo ""
echo "✅ All dependencies installed!"
echo ""
echo "📁 Next: Run ./02-create-folders.sh to create folder structure"
