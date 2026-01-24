# React Native Starter Project Structure

Complete folder structure and configuration files for the mobile application.

---

## Project Initialization Commands

```bash
# Create new Expo project with TypeScript
npx create-expo-app@latest ramouse-mobile --template tabs

# Navigate to project
cd ramouse-mobile

# Install core dependencies
npm install zustand @tanstack/react-query axios expo-secure-store expo-router
npm install react-hook-form @hookform/resolvers zod
npm install @react-native-async-storage/async-storage
npm install react-native-paper
npm install expo-notifications expo-device
npm install @react-native-community/netinfo
npm install date-fns

# Install dev dependencies
npm install --save-dev @types/react @types/react-native typescript
npm install --save-dev eslint prettier
npm install --save-dev @testing-library/react-native jest

# Install React Query persistence
npm install @tanstack/query-async-storage-persister

# Install additional Expo modules
npx expo install expo-image-picker expo-camera expo-location expo-local-authentication
```

---

## Complete Folder Structure

```
ramouse-mobile/
├── app/                                    # Expo Router (file-based routing)
│   ├── (auth)/                             # Auth group (layout)
│   │   ├── _layout.tsx                     # Auth layout
│   │   ├── login.tsx                       # Login screen
│   │   ├── register.tsx                    # Register screen
│   │   └── forgot-password.tsx             # Forgot password screen
│   │
│   ├── (tabs)/                             # Main app tabs
│   │   ├── _layout.tsx                     # Tabs layout
│   │   ├── index.tsx                       # Home/Feed screen
│   │   ├── marketplace.tsx                 # Car marketplace
│   │   ├── search.tsx                      # Search screen
│   │   ├── favorites.tsx                   # Favorites screen
│   │   └── profile.tsx                     # Profile screen
│   │
│   ├── car/                                # Car-related screens
│   │   ├── [id].tsx                        # Car details (dynamic route)
│   │   ├── create.tsx                      # Create car listing
│   │   └── edit/[id].tsx                   # Edit car listing
│   │
│   ├── provider/                           # Provider screens
│   │   ├── [id].tsx                        # Provider profile
│   │   └── listings.tsx                    # Provider listings
│   │
│   ├── _layout.tsx                         # Root layout with auth guard
│   ├── +not-found.tsx                      # 404 screen
│   └── modal.tsx                           # Example modal
│
├── src/
│   ├── api/                                # API Layer
│   │   ├── client.ts                       # Axios instance with interceptors
│   │   ├── interceptors.ts                 # Request/response interceptors
│   │   │
│   │   ├── endpoints/                      # API endpoints by domain
│   │   │   ├── auth.ts                     # Auth endpoints
│   │   │   ├── cars.ts                     # Cars endpoints
│   │   │   ├── providers.ts                # Providers endpoints
│   │   │   ├── users.ts                    # Users endpoints
│   │   │   ├── technicians.ts              # Technicians endpoints
│   │   │   └── notifications.ts            # Notifications endpoints
│   │   │
│   │   └── types/                          # API response types
│   │       ├── auth.types.ts               # Auth types
│   │       ├── car.types.ts                # Car types
│   │       ├── user.types.ts               # User types
│   │       └── common.types.ts             # Common API types
│   │
│   ├── store/                              # State Management (Zustand)
│   │   ├── index.ts                        # Store configuration
│   │   │
│   │   ├── slices/                         # Store slices
│   │   │   ├── auth.slice.ts               # Authentication state
│   │   │   ├── user.slice.ts               # User preferences
│   │   │   ├── cars.slice.ts               # Cars state
│   │   │   ├── filters.slice.ts            # Filter state
│   │   │   └── ui.slice.ts                 # UI state (modals, etc.)
│   │   │
│   │   └── middleware/                     # Custom middleware
│   │       ├── logger.ts                   # Logger middleware
│   │       └── persist.ts                  # Persistence middleware
│   │
│   ├── components/                         # Reusable Components
│   │   ├── ui/                             # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Chip.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   │
│   │   ├── forms/                          # Form components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── CarListingForm.tsx
│   │   │   └── ProfileForm.tsx
│   │   │
│   │   ├── cards/                          # Domain-specific cards
│   │   │   ├── CarCard.tsx
│   │   │   ├── ProviderCard.tsx
│   │   │   ├── TechnicianCard.tsx
│   │   │   └── TowTruckCard.tsx
│   │   │
│   │   ├── layout/                         # Layout components
│   │   │   ├── Screen.tsx                  # Screen wrapper
│   │   │   ├── Header.tsx                  # Header component
│   │   │   ├── TabBar.tsx                  # Custom tab bar
│   │   │   └── SafeArea.tsx                # Safe area wrapper
│   │   │
│   │   ├── guards/                         # Access control
│   │   │   ├── RoleGuard.tsx               # Role-based guard
│   │   │   └── PermissionGuard.tsx         # Permission-based guard
│   │   │
│   │   └── feedback/                       # Feedback components
│   │       ├── ErrorBoundary.tsx
│   │       ├── ErrorMessage.tsx
│   │       ├── EmptyState.tsx
│   │       └── Toast.tsx
│   │
│   ├── hooks/                              # Custom Hooks
│   │   ├── useAuth.ts                      # Authentication hook
│   │   ├── useCars.ts                      # Cars data hook
│   │   ├── useProviders.ts                 # Providers data hook
│   │   ├── useCache.ts                     # Cache management
│   │   ├── useOffline.ts                   # Offline detection
│   │   ├── usePermissions.ts               # Permissions hook
│   │   ├── useDebounce.ts                  # Debounce hook
│   │   ├── useImagePicker.ts               # Image picker hook
│   │   └── useLocation.ts                  # Location hook
│   │
│   ├── services/                           # Business Logic Services
│   │   ├── auth.service.ts                 # Auth business logic
│   │   ├── cache.service.ts                # Cache management
│   │   ├── notification.service.ts         # Push notifications
│   │   ├── sync.service.ts                 # Data synchronization
│   │   ├── storage.service.ts              # Local storage
│   │   └── analytics.service.ts            # Analytics tracking
│   │
│   ├── utils/                              # Utilities
│   │   ├── storage.ts                      # Secure storage wrapper
│   │   ├── validation.ts                   # Validation helpers
│   │   ├── formatting.ts                   # Data formatting
│   │   ├── permissions.ts                  # Permission checks
│   │   ├── constants.ts                    # App constants
│   │   ├── helpers.ts                      # General helpers
│   │   └── logger.ts                       # Logging utility
│   │
│   ├── types/                              # TypeScript Types
│   │   ├── models/                         # Domain models
│   │   │   ├── User.ts
│   │   │   ├── Car.ts
│   │   │   ├── Provider.ts
│   │   │   ├── Technician.ts
│   │   │   └── TowTruck.ts
│   │   │
│   │   ├── navigation.ts                   # Navigation types
│   │   ├── common.ts                       # Common types
│   │   └── env.d.ts                        # Environment types
│   │
│   ├── config/                             # Configuration
│   │   ├── env.ts                          # Environment config
│   │   ├── api.config.ts                   # API configuration
│   │   ├── queryClient.ts                  # React Query config
│   │   └── theme.ts                        # Theme configuration
│   │
│   ├── constants/                          # Constants
│   │   ├── colors.ts                       # Color palette
│   │   ├── sizes.ts                        # Size constants
│   │   ├── routes.ts                       # Route names
│   │   └── permissions.ts                  # Permission constants
│   │
│   └── schemas/                            # Zod Validation Schemas
│       ├── auth.schema.ts                  # Auth validation
│       ├── car.schema.ts                   # Car validation
│       └── user.schema.ts                  # User validation
│
├── assets/                                 # Static Assets
│   ├── images/
│   │   ├── logo.png
│   │   ├── placeholder.png
│   │   └── splash.png
│   │
│   ├── fonts/
│   │   └── (custom fonts)
│   │
│   └── icons/
│       └── (custom icons)
│
├── __tests__/                              # Tests
│   ├── unit/
│   │   ├── utils/
│   │   ├── hooks/
│   │   └── services/
│   │
│   ├── integration/
│   │   ├── api/
│   │   └── auth/
│   │
│   └── e2e/
│       ├── login.test.ts
│       └── car-listing.test.ts
│
├── .env.development                        # Development environment
├── .env.staging                            # Staging environment
├── .env.production                         # Production environment
├── .eslintrc.js                            # ESLint configuration
├── .prettierrc                             # Prettier configuration
├── .gitignore                              # Git ignore
├── app.json                                # Expo configuration
├── babel.config.js                         # Babel configuration
├── tsconfig.json                           # TypeScript configuration
├── package.json                            # Dependencies
├── README.md                               # Project documentation
└── metro.config.js                         # Metro bundler config
```

---

## Configuration Files

### package.json

```json
{
  "name": "ramouse-mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react": "18.3.1",
    "react-native": "0.76.5",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/query-async-storage-persister": "^5.0.0",
    "axios": "^1.6.0",
    "expo-secure-store": "~13.0.0",
    "expo-notifications": "~0.28.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-hook-form": "^7.50.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "react-native-paper": "^5.12.0",
    "@expo/vector-icons": "^14.0.0",
    "date-fns": "^3.0.0",
    "expo-image-picker": "~15.0.0",
    "expo-camera": "~15.0.0",
    "expo-location": "~17.0.0",
    "expo-local-authentication": "~14.0.0",
    "expo-device": "~6.0.0",
    "@react-native-community/netinfo": "^11.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.2.45",
    "@types/react-native": "~0.73.0",
    "typescript": "^5.3.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0",
    "jest": "^29.7.0",
    "@testing-library/react-native": "^12.4.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  },
  "private": true
}
```

### tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@api/*": ["src/api/*"],
      "@store/*": ["src/store/*"],
      "@types/*": ["src/types/*"],
      "@config/*": ["src/config/*"],
      "@services/*": ["src/services/*"],
      "@constants/*": ["src/constants/*"]
    },
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-native",
    "noEmit": true
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules"]
}
```

### app.json

```json
{
  "expo": {
    "name": "Ramouse",
    "slug": "ramouse-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "ramouse",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.ramouse.mobile",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to take photos of cars.",
        "NSPhotoLibraryUsageDescription": "This app accesses your photos to upload car images.",
        "NSLocationWhenInUseUsageDescription": "This app uses your location to show nearby cars."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.ramouse.mobile",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to let you share them with your friends."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### .eslintrc.js

```javascript
module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react-hooks/exhaustive-deps': 'warn',
  },
};
```

### .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "avoid"
}
```

### babel.config.js

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@api': './src/api',
            '@store': './src/store',
            '@types': './src/types',
            '@config': './src/config',
            '@services': './src/services',
            '@constants': './src/constants',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
```

### .env.development

```env
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENABLE_LOGGING=true
```

### .env.production

```env
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=https://api.ramouse.com/api
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENABLE_LOGGING=false
```

---

## Quick Start Guide

1. **Initialize project:**
   ```bash
   npx create-expo-app@latest ramouse-mobile --template tabs
   cd ramouse-mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.development .env
   ```

4. **Start development server:**
   ```bash
   npm start
   ```

5. **Run on device:**
   - iOS: Press `i` or `npm run ios`
   - Android: Press `a` or `npm run android`
   - Web: Press `w` or `npm run web`

---

## Next Steps

1. Copy configuration files to your project
2. Create the folder structure
3. Implement core infrastructure (API client, auth store)
4. Build authentication screens
5. Develop main features
6. Add offline support and push notifications
7. Test thoroughly
8. Deploy to app stores

---

> [!TIP]
> Use `npx expo install` instead of `npm install` for Expo-compatible packages to ensure version compatibility.
