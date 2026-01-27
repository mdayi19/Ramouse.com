#!/bin/bash
# Install missing babel-preset-expo

echo "📦 Installing babel-preset-expo..."
echo ""

npm install --legacy-peer-deps --save-dev babel-preset-expo

echo ""
echo "✅ babel-preset-expo installed!"
echo ""
echo "🔄 Now restart Expo:"
echo "  Press Ctrl+C to stop"
echo "  Run: npx expo start --clear"
echo "  Press 'w' to open web"
