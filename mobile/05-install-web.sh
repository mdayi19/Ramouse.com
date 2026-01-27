#!/bin/bash
# Install web dependencies for Expo

echo "📦 Installing web dependencies..."
echo ""

npx expo install react-dom react-native-web

echo ""
echo "✅ Web dependencies installed!"
echo ""
echo "🌐 Now you can run:"
echo "  Press 'w' in the Expo terminal to open web"
echo "  Or run: npx expo start --web"
