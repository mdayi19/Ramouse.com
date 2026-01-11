import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import compression from 'vite-plugin-compression';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

import Sitemap from 'vite-plugin-sitemap';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const isProduction = mode === 'production';

  // Use env variable or fallback to production URL
  const proxyTarget = env.VITE_PROXY_TARGET || 'https://ramouse.com';
  console.log('🔧 Vite Proxy Target:', proxyTarget);

  const routes = [
    '/',
    '/store',
    '/tow-trucks',
    '/technicians',
    '/register-technician',
    '/register-tow-truck',
    '/blog',
    '/faq',
    '/privacy',
    '/terms',
    '/contact',
    '/order',
    '/announcements'
  ];

  return {
    root: '.', // Current directory (Frontend/)
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // Proxy API requests to production backend
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          headers: {
            'Origin': 'https://ramouse.com',
            'Referer': 'https://ramouse.com',
          },
        },
        // Proxy storage/media requests
        '/storage': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        // Proxy broadcasting auth requests
        '/broadcasting': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        // Proxy watchlist endpoint
        '/watchlist': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        // Proxy sanctum/csrf endpoints if needed
        '/sanctum': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      // Target modern browsers for smaller bundles
      target: 'esnext',
      // Speed up build process
      reportCompressedSize: false,
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      // Better source maps for production debugging
      sourcemap: isProduction ? 'hidden' : true,
      // Minification settings
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.debug', 'console.info'] : [],
          passes: 2
        }
      },
      // Rollup optimizations
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['framer-motion', 'lucide-react'],
            'utils-vendor': ['axios', 'clsx', 'tailwind-merge'],
            // Dashboard chunks
            'admin-dashboard': ['./src/components/AdminDashboard.tsx'],
            'customer-dashboard': ['./src/components/CustomerDashboard.tsx'],
            'provider-dashboard': ['./src/components/ProviderDashboard.tsx'],
            'technician-dashboard': ['./src/components/TechnicianDashboard.tsx'],
            'towtruck-dashboard': ['./src/components/TowTruckDashboard.tsx'],
          },
          // Optimize asset file names
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'chunks/[name]-[hash].js',
          entryFileNames: 'entries/[name]-[hash].js',
        }
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
        devOptions: {
          enabled: true
        },
        manifest: {
          name: 'راموسة لقطع غيار السيارات',
          short_name: 'راموسة',
          description: 'تطبيق ويب حديث ومتجاوب لطلب قطع غيار السيارات بسهولة في سوريا.',
          theme_color: '#0284c7',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ],
          screenshots: [
            {
              src: 'screenshot-mobile.png',
              sizes: '640x1136',
              type: 'image/png',
              form_factor: 'narrow'
            },
            {
              src: 'screenshot-desktop.png',
              sizes: '1920x1080',
              type: 'image/png',
              form_factor: 'wide'
            }
          ]
        },
        workbox: {
          importScripts: ['custom-sw.js'],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api') || url.pathname.startsWith('/storage'),
              handler: 'NetworkOnly',
            }
          ],
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          globIgnores: ['**/apple-touch-icon.png'],
          navigateFallbackDenylist: [/^\/api/, /^\/storage/],
          navigateFallbackAllowlist: [
            /^\/$/,
            /^\/tow-truck-dashboard/,
            /^\/dashboard/,
            /^\/admin/,
            /^\/provider/,
            /^\/technician/,
            /^\/store/,
            /^\/my-orders/,
            /^\/notifications/,
            /^\/announcements/,
            /^\/tow-trucks/,
            /^\/technicians/,
            /^\/register-technician/,
            /^\/register-tow-truck/,
            /^\/blog/,
            /^\/faq/,
            /^\/privacy/,
            /^\/terms/,
            /^\/contact/,
            /^\/order/
          ]
        }
      }),
      ViteImageOptimizer({
        test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
        exclude: undefined,
        include: undefined,
        includePublic: true,
        logStats: true,
        ansiColors: true,
        svg: {
          multipass: true,
          plugins: [
            'preset-default',
            'sortAttrs',
            {
              name: 'addAttributesToSVGElement',
              params: {
                attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
              },
            },
          ],
        },
        png: {
          // palette: true,
          quality: 80,
        },
        jpeg: {
          // progressive: true,
          quality: 80,
        },
        jpg: {
          // progressive: true,
          quality: 80,
        },
        gif: {},
        webp: {
          lossless: true,
        },
        avif: {
          lossless: true,
        },
        cache: true,
        cacheLocation: undefined,
      }),
      compression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
      Sitemap({
        hostname: env.VITE_URL || 'https://ramouse.com',
        // Disable auto-generation of robots.txt because we have a manual public/robots.txt
        generateRobotsTxt: false,
        dynamicRoutes: ['/blog', '/services', '/contact'],
        readable: true,
        exclude: ['/admin', '/dashboard', '/provider', '/technician', '/tow-truck-dashboard']
      })
    ],

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});