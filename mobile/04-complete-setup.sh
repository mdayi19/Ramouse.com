#!/bin/bash
# Complete project setup - Run this after dependencies are installed

echo "🚀 Completing Ramouse Mobile Setup..."
echo ""

# Install babel plugin for path aliases
echo "📦 Installing babel-plugin-module-resolver..."
npm install --legacy-peer-deps --save-dev babel-plugin-module-resolver

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 What was created:"
echo "  ✅ tsconfig.json - TypeScript configuration with path aliases"
echo "  ✅ babel.config.js - Babel configuration with module resolver"
echo ""
echo "📁 Next: I'll create the base application files"
echo "  - Environment configuration"
echo "  - API client"
echo "  - Authentication store"
echo "  - Navigation setup"
echo "  - Base screens"
