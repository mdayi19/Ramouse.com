#!/bin/bash
# Fix Expo Router web bundle error

echo "🔧 Fixing web bundle error..."
echo ""

# Remove conflicting entry files
echo "Removing index.ts and App.tsx (not needed with Expo Router)..."
rm -f index.ts App.tsx

echo ""
echo "✅ Fixed!"
echo ""
echo "🌐 Now restart Expo:"
echo "  1. Press Ctrl+C to stop current server"
echo "  2. Run: npx expo start"
echo "  3. Press 'w' to open web"
