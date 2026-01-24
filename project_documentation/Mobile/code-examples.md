# Code Examples for React Native Mobile App

This document contains production-ready code examples for the mobile application.

---

## 1. API Client with Axios

**File:** `src/api/client.ts`

```typescript
/**
 * API Client Configuration
 * Production-grade Axios client with automatic token refresh
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_TIMEOUT } from '@/config/env';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Platform': 'mobile',
      'X-Client-Version': process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    },
  });

  // Request Interceptor
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (__DEV__) {
        console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Response Interceptor
  client.interceptors.response.use(
    (response) => {
      if (__DEV__) {
        console.log(`📥 ${response.config.method?.toUpperCase()} ${response.config.url}`);
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return client(originalRequest);
            })
            .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
          
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data;

          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access_token);
          if (newRefreshToken) {
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }

          processQueue(null, access_token);
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError as Error, null);
          await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
          await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string;
      errors?: Record<string, string[]>;
    }>;

    return {
      message: axiosError.response?.data?.message || axiosError.message || 'An error occurred',
      status: axiosError.response?.status,
      errors: axiosError.response?.data?.errors,
    };
  }

  return {
    message: error instanceof Error ? error.message : 'An unknown error occurred',
  };
};
```

---

## 2. Authentication Store (Zustand)

**File:** `src/store/slices/auth.slice.ts`

```typescript
/**
 * Authentication Store
 * Manages user authentication state with Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { apiClient, handleApiError } from '@/api/client';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'technician' | 'tow-truck' | 'car-provider' | 'admin';
  permissions: string[];
  profile_photo?: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post('/auth/login', {
            email,
            password,
          });

          const { user, access_token, refresh_token } = response.data;

          // Store tokens securely
          await SecureStore.setItemAsync('access_token', access_token);
          await SecureStore.setItemAsync('refresh_token', refresh_token);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const apiError = handleApiError(error);
          set({
            isLoading: false,
            error: apiError.message,
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post('/auth/register', data);

          const { user, access_token, refresh_token } = response.data;

          await SecureStore.setItemAsync('access_token', access_token);
          await SecureStore.setItemAsync('refresh_token', refresh_token);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const apiError = handleApiError(error);
          set({
            isLoading: false,
            error: apiError.message,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiClient.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear tokens
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');

          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      refreshUser: async () => {
        try {
          const response = await apiClient.get('/auth/me');
          set({ user: response.data });
        } catch (error) {
          console.error('Failed to refresh user:', error);
          get().logout();
        }
      },

      clearError: () => set({ error: null }),

      hasPermission: (permission: string) => {
        const { user } = get();
        return user?.permissions?.includes(permission) ?? false;
      },

      hasRole: (role: string | string[]) => {
        const { user } = get();
        if (!user) return false;
        
        const roles = Array.isArray(role) ? role : [role];
        return roles.includes(user.role);
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

---

## 3. Protected Routes with Expo Router

**File:** `app/_layout.tsx`

```typescript
/**
 * Root Layout with Authentication Guard
 */

import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/slices/auth.slice';
import * as SecureStore from 'expo-secure-store';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, user, refreshUser } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync('access_token');
      
      if (token && !user) {
        // Token exists but no user data - refresh user
        await refreshUser();
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  return <Slot />;
}
```

**File:** `src/components/guards/RoleGuard.tsx`

```typescript
/**
 * Role-Based Access Control Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/slices/auth.slice';

interface RoleGuardProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  roles,
  permissions,
  fallback,
}) => {
  const { hasRole, hasPermission } = useAuthStore();

  const hasRequiredRole = roles ? hasRole(roles) : true;
  const hasRequiredPermission = permissions
    ? permissions.some(p => hasPermission(p))
    : true;

  if (!hasRequiredRole || !hasRequiredPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.text}>Access Denied</Text>
        <Text style={styles.subtext}>
          You don't have permission to view this content
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
```

---

## 4. Environment Configuration

**File:** `src/config/env.ts`

```typescript
/**
 * Environment Configuration
 * Manages environment-specific settings
 */

import Constants from 'expo-constants';

type Environment = 'development' | 'staging' | 'production';

const ENV = {
  development: {
    apiUrl: 'http://localhost:8000/api',
    apiTimeout: 30000,
    enableLogging: true,
  },
  staging: {
    apiUrl: 'https://staging-api.ramouse.com/api',
    apiTimeout: 30000,
    enableLogging: true,
  },
  production: {
    apiUrl: 'https://api.ramouse.com/api',
    apiTimeout: 15000,
    enableLogging: false,
  },
};

const getEnvVars = (): typeof ENV.development => {
  const environment = (process.env.EXPO_PUBLIC_ENV || 'development') as Environment;
  return ENV[environment];
};

export const { apiUrl: API_BASE_URL, apiTimeout: API_TIMEOUT, enableLogging: ENABLE_LOGGING } = getEnvVars();

export const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
export const APP_BUILD_NUMBER = Constants.expoConfig?.ios?.buildNumber || '1';
```

**File:** `.env.development`

```env
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_APP_VERSION=1.0.0
```

**File:** `.env.production`

```env
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=https://api.ramouse.com/api
EXPO_PUBLIC_APP_VERSION=1.0.0
```

---

## 5. React Query Hooks

**File:** `src/hooks/useAuth.ts`

```typescript
/**
 * Authentication Hook
 */

import { useAuthStore } from '@/store/slices/auth.slice';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError,
    hasPermission,
    hasRole,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError,
    hasPermission,
    hasRole,
  };
};
```

**File:** `src/hooks/useCars.ts`

```typescript
/**
 * Cars API Hook with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, handleApiError } from '@/api/client';

interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  // ... other fields
}

interface CarFilters {
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
}

export const useCars = (filters?: CarFilters) => {
  return useQuery({
    queryKey: ['cars', filters],
    queryFn: async () => {
      const response = await apiClient.get('/cars', { params: filters });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

export const useCar = (id: number) => {
  return useQuery({
    queryKey: ['car', id],
    queryFn: async () => {
      const response = await apiClient.get(`/cars/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateCar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Car>) => {
      const response = await apiClient.post('/cars', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      console.error('Failed to create car:', apiError.message);
    },
  });
};

export const useUpdateCar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Car> }) => {
      const response = await apiClient.put(`/cars/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['car', variables.id] });
    },
  });
};

export const useDeleteCar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/cars/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
  });
};
```

---

## 6. Form Validation with React Hook Form + Zod

**File:** `src/components/forms/LoginForm.tsx`

```typescript
/**
 * Login Form with Validation
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.email}
              style={styles.input}
            />
            {errors.email && (
              <HelperText type="error">{errors.email.message}</HelperText>
            )}
          </>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={!!errors.password}
              style={styles.input}
            />
            {errors.password && (
              <HelperText type="error">{errors.password.message}</HelperText>
            )}
          </>
        )}
      />

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
      >
        Login
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 20,
  },
});
```

---

## 7. Offline Support with React Query

**File:** `src/config/queryClient.ts`

```typescript
/**
 * React Query Client Configuration with Offline Support
 */

import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000,
});

// Monitor network status
NetInfo.addEventListener(state => {
  const isOnline = state.isConnected && state.isInternetReachable;
  queryClient.setDefaultOptions({
    queries: {
      networkMode: isOnline ? 'online' : 'offlineFirst',
    },
  });
});
```

---

## 8. Push Notifications Setup

**File:** `src/services/notification.service.ts`

```typescript
/**
 * Push Notifications Service
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '@/api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Send token to backend
    await apiClient.post('/notifications/register', { token });

    return token;
  },

  async schedulePushNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: { seconds: 1 },
    });
  },
};
```

---

## Usage Examples

### Using the Auth Hook

```typescript
import { useAuth } from '@/hooks/useAuth';

function ProfileScreen() {
  const { user, logout, hasRole } = useAuth();

  const isProvider = hasRole('car-provider');

  return (
    <View>
      <Text>Welcome, {user?.name}</Text>
      {isProvider && <Text>You are a provider</Text>}
      <Button onPress={logout}>Logout</Button>
    </View>
  );
}
```

### Using React Query for Data Fetching

```typescript
import { useCars, useCreateCar } from '@/hooks/useCars';

function CarListScreen() {
  const { data: cars, isLoading, error } = useCars({ city: 'Cairo' });
  const createCar = useCreateCar();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <FlatList
      data={cars}
      renderItem={({ item }) => <CarCard car={item} />}
    />
  );
}
```

### Protected Route with Role Guard

```typescript
import { RoleGuard } from '@/components/guards/RoleGuard';

function AdminScreen() {
  return (
    <RoleGuard roles={['admin']} fallback={<AccessDenied />}>
      <AdminDashboard />
    </RoleGuard>
  );
}
```
