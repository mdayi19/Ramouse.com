#!/bin/bash
# Create folder structure for Ramouse Mobile App

echo "📁 Creating folder structure..."
echo ""

# Create main src directory
mkdir -p src

# Create API layer
mkdir -p src/api/endpoints
mkdir -p src/api/interceptors

# Create store (Zustand)
mkdir -p src/store

# Create components
mkdir -p src/components/common
mkdir -p src/components/auth
mkdir -p src/components/customer
mkdir -p src/components/car-provider
mkdir -p src/components/technician
mkdir -p src/components/tow-truck
mkdir -p src/components/admin

# Create hooks
mkdir -p src/hooks

# Create services
mkdir -p src/services

# Create utils
mkdir -p src/utils

# Create types
mkdir -p src/types

# Create config
mkdir -p src/config

# Create constants
mkdir -p src/constants

# Create schemas (Zod validation)
mkdir -p src/schemas

# Create app directory (Expo Router)
mkdir -p app
mkdir -p app/\(auth\)
mkdir -p app/\(customer\)
mkdir -p app/\(car-provider\)
mkdir -p app/\(technician\)
mkdir -p app/\(tow-truck\)
mkdir -p app/\(admin\)

# Create assets directories
mkdir -p assets/images
mkdir -p assets/fonts
mkdir -p assets/icons

echo "✅ Folder structure created!"
echo ""
echo "📂 Created directories:"
echo "  - src/ (source code)"
echo "  - app/ (Expo Router screens)"
echo "  - assets/ (images, fonts, icons)"
echo ""
echo "📁 Next: Run ./03-create-config-files.sh to create configuration files"
