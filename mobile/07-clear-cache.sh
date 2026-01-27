#!/bin/bash
# Clear Expo cache and restart

echo "🧹 Clearing Expo cache..."
echo ""

# Clear Metro bundler cache
npx expo start --clear

echo ""
echo "✅ Cache cleared and server restarted!"
echo ""
echo "Press 'w' to open web browser"
