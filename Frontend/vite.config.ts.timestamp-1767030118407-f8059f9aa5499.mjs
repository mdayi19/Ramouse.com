// vite.config.ts
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "file:///C:/laragon/www/ramouse/Frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/laragon/www/ramouse/Frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///C:/laragon/www/ramouse/Frontend/node_modules/vite-plugin-pwa/dist/index.js";
import compression from "file:///C:/laragon/www/ramouse/Frontend/node_modules/vite-plugin-compression/dist/index.mjs";
import { ViteImageOptimizer } from "file:///C:/laragon/www/ramouse/Frontend/node_modules/vite-plugin-image-optimizer/dist/index.js";
import Sitemap from "file:///C:/laragon/www/ramouse/Frontend/node_modules/vite-plugin-sitemap/dist/index.js";
var __vite_injected_original_import_meta_url = "file:///C:/laragon/www/ramouse/Frontend/vite.config.ts";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = path.dirname(__filename);
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const isProduction = mode === "production";
  const routes = [
    "/",
    "/store",
    "/tow-trucks",
    "/technicians",
    "/register-technician",
    "/register-tow-truck",
    "/blog",
    "/faq",
    "/privacy",
    "/terms",
    "/contact",
    "/order",
    "/announcements"
  ];
  return {
    root: ".",
    // Current directory (Frontend/)
    server: {
      port: 3e3,
      host: "0.0.0.0",
      proxy: {
        // Proxy API requests to Laravel backend during development
        "/api": {
          target: env.VITE_API_URL || "http://localhost:8000",
          changeOrigin: true,
          secure: false
        },
        "/storage": {
          target: env.VITE_API_URL || "http://localhost:8000",
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      // Target modern browsers for smaller bundles
      target: "esnext",
      // Speed up build process
      reportCompressedSize: false,
      // Optimize chunk size
      chunkSizeWarningLimit: 1e3,
      // Better source maps for production debugging
      sourcemap: isProduction ? "hidden" : true,
      // Minification settings
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ["console.log", "console.debug", "console.info"] : [],
          passes: 2
        }
      },
      // Rollup optimizations
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // Vendor chunks
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "ui-vendor": ["framer-motion", "lucide-react"],
            "utils-vendor": ["axios", "clsx", "tailwind-merge"],
            // Dashboard chunks
            "admin-dashboard": ["./src/components/AdminDashboard.tsx"],
            "customer-dashboard": ["./src/components/CustomerDashboard.tsx"],
            "provider-dashboard": ["./src/components/ProviderDashboard.tsx"],
            "technician-dashboard": ["./src/components/TechnicianDashboard.tsx"],
            "towtruck-dashboard": ["./src/components/TowTruckDashboard.tsx"]
          },
          // Optimize asset file names
          assetFileNames: "assets/[name]-[hash][extname]",
          chunkFileNames: "chunks/[name]-[hash].js",
          entryFileNames: "entries/[name]-[hash].js"
        }
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png"],
        devOptions: {
          enabled: true
        },
        manifest: {
          name: "\u0631\u0627\u0645\u0648\u0633\u0629 \u0644\u0642\u0637\u0639 \u063A\u064A\u0627\u0631 \u0627\u0644\u0633\u064A\u0627\u0631\u0627\u062A",
          short_name: "\u0631\u0627\u0645\u0648\u0633\u0629",
          description: "\u062A\u0637\u0628\u064A\u0642 \u0648\u064A\u0628 \u062D\u062F\u064A\u062B \u0648\u0645\u062A\u062C\u0627\u0648\u0628 \u0644\u0637\u0644\u0628 \u0642\u0637\u0639 \u063A\u064A\u0627\u0631 \u0627\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0628\u0633\u0647\u0648\u0644\u0629 \u0641\u064A \u0633\u0648\u0631\u064A\u0627.",
          theme_color: "#0284c7",
          background_color: "#f8fafc",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png"
            }
          ],
          screenshots: [
            {
              src: "screenshot-mobile.png",
              sizes: "640x1136",
              type: "image/png",
              form_factor: "narrow"
            },
            {
              src: "screenshot-desktop.png",
              sizes: "1920x1080",
              type: "image/png",
              form_factor: "wide"
            }
          ]
        },
        workbox: {
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/api") || url.pathname.startsWith("/storage"),
              handler: "NetworkOnly"
            }
          ],
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
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
        exclude: void 0,
        include: void 0,
        includePublic: true,
        logStats: true,
        ansiColors: true,
        svg: {
          multipass: true,
          plugins: [
            "preset-default",
            "sortAttrs",
            {
              name: "addAttributesToSVGElement",
              params: {
                attributes: [{ xmlns: "http://www.w3.org/2000/svg" }]
              }
            }
          ]
        },
        png: {
          // palette: true,
          quality: 80
        },
        jpeg: {
          // progressive: true,
          quality: 80
        },
        jpg: {
          // progressive: true,
          quality: 80
        },
        gif: {},
        webp: {
          lossless: true
        },
        avif: {
          lossless: true
        },
        cache: true,
        cacheLocation: void 0
      }),
      compression({
        algorithm: "gzip",
        ext: ".gz"
      }),
      compression({
        algorithm: "brotliCompress",
        ext: ".br"
      }),
      Sitemap({
        hostname: env.VITE_URL || "https://ramouse.com",
        dynamicRoutes: routes,
        generateRobotsTxt: true,
        readable: true,
        exclude: ["/admin", "/dashboard", "/provider", "/technician", "/tow-truck-dashboard"]
      })
    ],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxsYXJhZ29uXFxcXHd3d1xcXFxyYW1vdXNlXFxcXEZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxsYXJhZ29uXFxcXHd3d1xcXFxyYW1vdXNlXFxcXEZyb250ZW5kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9sYXJhZ29uL3d3dy9yYW1vdXNlL0Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnO1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XHJcbmltcG9ydCBjb21wcmVzc2lvbiBmcm9tICd2aXRlLXBsdWdpbi1jb21wcmVzc2lvbic7XHJcbmltcG9ydCB7IFZpdGVJbWFnZU9wdGltaXplciB9IGZyb20gJ3ZpdGUtcGx1Z2luLWltYWdlLW9wdGltaXplcic7XHJcblxyXG5pbXBvcnQgU2l0ZW1hcCBmcm9tICd2aXRlLXBsdWdpbi1zaXRlbWFwJztcclxuXHJcbmNvbnN0IF9fZmlsZW5hbWUgPSBmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCk7XHJcbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShfX2ZpbGVuYW1lKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcclxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIF9fZGlybmFtZSwgJycpO1xyXG4gIGNvbnN0IGlzUHJvZHVjdGlvbiA9IG1vZGUgPT09ICdwcm9kdWN0aW9uJztcclxuXHJcbiAgY29uc3Qgcm91dGVzID0gW1xyXG4gICAgJy8nLFxyXG4gICAgJy9zdG9yZScsXHJcbiAgICAnL3Rvdy10cnVja3MnLFxyXG4gICAgJy90ZWNobmljaWFucycsXHJcbiAgICAnL3JlZ2lzdGVyLXRlY2huaWNpYW4nLFxyXG4gICAgJy9yZWdpc3Rlci10b3ctdHJ1Y2snLFxyXG4gICAgJy9ibG9nJyxcclxuICAgICcvZmFxJyxcclxuICAgICcvcHJpdmFjeScsXHJcbiAgICAnL3Rlcm1zJyxcclxuICAgICcvY29udGFjdCcsXHJcbiAgICAnL29yZGVyJyxcclxuICAgICcvYW5ub3VuY2VtZW50cydcclxuICBdO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcm9vdDogJy4nLCAvLyBDdXJyZW50IGRpcmVjdG9yeSAoRnJvbnRlbmQvKVxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIHBvcnQ6IDMwMDAsXHJcbiAgICAgIGhvc3Q6ICcwLjAuMC4wJyxcclxuICAgICAgcHJveHk6IHtcclxuICAgICAgICAvLyBQcm94eSBBUEkgcmVxdWVzdHMgdG8gTGFyYXZlbCBiYWNrZW5kIGR1cmluZyBkZXZlbG9wbWVudFxyXG4gICAgICAgICcvYXBpJzoge1xyXG4gICAgICAgICAgdGFyZ2V0OiBlbnYuVklURV9BUElfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLFxyXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgICcvc3RvcmFnZSc6IHtcclxuICAgICAgICAgIHRhcmdldDogZW52LlZJVEVfQVBJX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDo4MDAwJyxcclxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgYnVpbGQ6IHtcclxuICAgICAgLy8gVGFyZ2V0IG1vZGVybiBicm93c2VycyBmb3Igc21hbGxlciBidW5kbGVzXHJcbiAgICAgIHRhcmdldDogJ2VzbmV4dCcsXHJcbiAgICAgIC8vIFNwZWVkIHVwIGJ1aWxkIHByb2Nlc3NcclxuICAgICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IGZhbHNlLFxyXG4gICAgICAvLyBPcHRpbWl6ZSBjaHVuayBzaXplXHJcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcclxuICAgICAgLy8gQmV0dGVyIHNvdXJjZSBtYXBzIGZvciBwcm9kdWN0aW9uIGRlYnVnZ2luZ1xyXG4gICAgICBzb3VyY2VtYXA6IGlzUHJvZHVjdGlvbiA/ICdoaWRkZW4nIDogdHJ1ZSxcclxuICAgICAgLy8gTWluaWZpY2F0aW9uIHNldHRpbmdzXHJcbiAgICAgIG1pbmlmeTogJ3RlcnNlcicsXHJcbiAgICAgIHRlcnNlck9wdGlvbnM6IHtcclxuICAgICAgICBjb21wcmVzczoge1xyXG4gICAgICAgICAgZHJvcF9jb25zb2xlOiBpc1Byb2R1Y3Rpb24sXHJcbiAgICAgICAgICBkcm9wX2RlYnVnZ2VyOiBpc1Byb2R1Y3Rpb24sXHJcbiAgICAgICAgICBwdXJlX2Z1bmNzOiBpc1Byb2R1Y3Rpb24gPyBbJ2NvbnNvbGUubG9nJywgJ2NvbnNvbGUuZGVidWcnLCAnY29uc29sZS5pbmZvJ10gOiBbXSxcclxuICAgICAgICAgIHBhc3NlczogMlxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgLy8gUm9sbHVwIG9wdGltaXphdGlvbnNcclxuICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgIG91dHB1dDoge1xyXG4gICAgICAgICAgLy8gTWFudWFsIGNodW5rIHNwbGl0dGluZyBmb3IgYmV0dGVyIGNhY2hpbmdcclxuICAgICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgICAvLyBWZW5kb3IgY2h1bmtzXHJcbiAgICAgICAgICAgICdyZWFjdC12ZW5kb3InOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICAgICAgICAgICd1aS12ZW5kb3InOiBbJ2ZyYW1lci1tb3Rpb24nLCAnbHVjaWRlLXJlYWN0J10sXHJcbiAgICAgICAgICAgICd1dGlscy12ZW5kb3InOiBbJ2F4aW9zJywgJ2Nsc3gnLCAndGFpbHdpbmQtbWVyZ2UnXSxcclxuICAgICAgICAgICAgLy8gRGFzaGJvYXJkIGNodW5rc1xyXG4gICAgICAgICAgICAnYWRtaW4tZGFzaGJvYXJkJzogWycuL3NyYy9jb21wb25lbnRzL0FkbWluRGFzaGJvYXJkLnRzeCddLFxyXG4gICAgICAgICAgICAnY3VzdG9tZXItZGFzaGJvYXJkJzogWycuL3NyYy9jb21wb25lbnRzL0N1c3RvbWVyRGFzaGJvYXJkLnRzeCddLFxyXG4gICAgICAgICAgICAncHJvdmlkZXItZGFzaGJvYXJkJzogWycuL3NyYy9jb21wb25lbnRzL1Byb3ZpZGVyRGFzaGJvYXJkLnRzeCddLFxyXG4gICAgICAgICAgICAndGVjaG5pY2lhbi1kYXNoYm9hcmQnOiBbJy4vc3JjL2NvbXBvbmVudHMvVGVjaG5pY2lhbkRhc2hib2FyZC50c3gnXSxcclxuICAgICAgICAgICAgJ3Rvd3RydWNrLWRhc2hib2FyZCc6IFsnLi9zcmMvY29tcG9uZW50cy9Ub3dUcnVja0Rhc2hib2FyZC50c3gnXSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAvLyBPcHRpbWl6ZSBhc3NldCBmaWxlIG5hbWVzXHJcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdJyxcclxuICAgICAgICAgIGNodW5rRmlsZU5hbWVzOiAnY2h1bmtzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdlbnRyaWVzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgcmVhY3QoKSxcclxuICAgICAgVml0ZVBXQSh7XHJcbiAgICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXHJcbiAgICAgICAgaW5jbHVkZUFzc2V0czogWydmYXZpY29uLmljbycsICdhcHBsZS10b3VjaC1pY29uLnBuZyddLFxyXG4gICAgICAgIGRldk9wdGlvbnM6IHtcclxuICAgICAgICAgIGVuYWJsZWQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIG1hbmlmZXN0OiB7XHJcbiAgICAgICAgICBuYW1lOiAnXHUwNjMxXHUwNjI3XHUwNjQ1XHUwNjQ4XHUwNjMzXHUwNjI5IFx1MDY0NFx1MDY0Mlx1MDYzN1x1MDYzOSBcdTA2M0FcdTA2NEFcdTA2MjdcdTA2MzEgXHUwNjI3XHUwNjQ0XHUwNjMzXHUwNjRBXHUwNjI3XHUwNjMxXHUwNjI3XHUwNjJBJyxcclxuICAgICAgICAgIHNob3J0X25hbWU6ICdcdTA2MzFcdTA2MjdcdTA2NDVcdTA2NDhcdTA2MzNcdTA2MjknLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdcdTA2MkFcdTA2MzdcdTA2MjhcdTA2NEFcdTA2NDIgXHUwNjQ4XHUwNjRBXHUwNjI4IFx1MDYyRFx1MDYyRlx1MDY0QVx1MDYyQiBcdTA2NDhcdTA2NDVcdTA2MkFcdTA2MkNcdTA2MjdcdTA2NDhcdTA2MjggXHUwNjQ0XHUwNjM3XHUwNjQ0XHUwNjI4IFx1MDY0Mlx1MDYzN1x1MDYzOSBcdTA2M0FcdTA2NEFcdTA2MjdcdTA2MzEgXHUwNjI3XHUwNjQ0XHUwNjMzXHUwNjRBXHUwNjI3XHUwNjMxXHUwNjI3XHUwNjJBIFx1MDYyOFx1MDYzM1x1MDY0N1x1MDY0OFx1MDY0NFx1MDYyOSBcdTA2NDFcdTA2NEEgXHUwNjMzXHUwNjQ4XHUwNjMxXHUwNjRBXHUwNjI3LicsXHJcbiAgICAgICAgICB0aGVtZV9jb2xvcjogJyMwMjg0YzcnLFxyXG4gICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyNmOGZhZmMnLFxyXG4gICAgICAgICAgZGlzcGxheTogJ3N0YW5kYWxvbmUnLFxyXG4gICAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdCcsXHJcbiAgICAgICAgICBzdGFydF91cmw6ICcvJyxcclxuICAgICAgICAgIGljb25zOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6ICdwd2EtMTkyeDE5Mi5wbmcnLFxyXG4gICAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXHJcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZydcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHNyYzogJ3B3YS01MTJ4NTEyLnBuZycsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcclxuICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgc2NyZWVuc2hvdHM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHNyYzogJ3NjcmVlbnNob3QtbW9iaWxlLnBuZycsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6ICc2NDB4MTEzNicsXHJcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgICAgZm9ybV9mYWN0b3I6ICduYXJyb3cnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6ICdzY3JlZW5zaG90LWRlc2t0b3AucG5nJyxcclxuICAgICAgICAgICAgICBzaXplczogJzE5MjB4MTA4MCcsXHJcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgICAgZm9ybV9mYWN0b3I6ICd3aWRlJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICB3b3JrYm94OiB7XHJcbiAgICAgICAgICBjbGVhbnVwT3V0ZGF0ZWRDYWNoZXM6IHRydWUsXHJcbiAgICAgICAgICBydW50aW1lQ2FjaGluZzogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdXJsUGF0dGVybjogKHsgdXJsIH0pID0+IHVybC5wYXRobmFtZS5zdGFydHNXaXRoKCcvYXBpJykgfHwgdXJsLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9zdG9yYWdlJyksXHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogJ05ldHdvcmtPbmx5JyxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIGdsb2JQYXR0ZXJuczogWycqKi8qLntqcyxjc3MsaHRtbCxpY28scG5nLHN2Z30nXSxcclxuICAgICAgICAgIG5hdmlnYXRlRmFsbGJhY2tEZW55bGlzdDogWy9eXFwvYXBpLywgL15cXC9zdG9yYWdlL10sXHJcbiAgICAgICAgICBuYXZpZ2F0ZUZhbGxiYWNrQWxsb3dsaXN0OiBbXHJcbiAgICAgICAgICAgIC9eXFwvJC8sXHJcbiAgICAgICAgICAgIC9eXFwvdG93LXRydWNrLWRhc2hib2FyZC8sXHJcbiAgICAgICAgICAgIC9eXFwvZGFzaGJvYXJkLyxcclxuICAgICAgICAgICAgL15cXC9hZG1pbi8sXHJcbiAgICAgICAgICAgIC9eXFwvcHJvdmlkZXIvLFxyXG4gICAgICAgICAgICAvXlxcL3RlY2huaWNpYW4vLFxyXG4gICAgICAgICAgICAvXlxcL3N0b3JlLyxcclxuICAgICAgICAgICAgL15cXC9teS1vcmRlcnMvLFxyXG4gICAgICAgICAgICAvXlxcL25vdGlmaWNhdGlvbnMvLFxyXG4gICAgICAgICAgICAvXlxcL2Fubm91bmNlbWVudHMvLFxyXG4gICAgICAgICAgICAvXlxcL3Rvdy10cnVja3MvLFxyXG4gICAgICAgICAgICAvXlxcL3RlY2huaWNpYW5zLyxcclxuICAgICAgICAgICAgL15cXC9yZWdpc3Rlci10ZWNobmljaWFuLyxcclxuICAgICAgICAgICAgL15cXC9yZWdpc3Rlci10b3ctdHJ1Y2svLFxyXG4gICAgICAgICAgICAvXlxcL2Jsb2cvLFxyXG4gICAgICAgICAgICAvXlxcL2ZhcS8sXHJcbiAgICAgICAgICAgIC9eXFwvcHJpdmFjeS8sXHJcbiAgICAgICAgICAgIC9eXFwvdGVybXMvLFxyXG4gICAgICAgICAgICAvXlxcL2NvbnRhY3QvLFxyXG4gICAgICAgICAgICAvXlxcL29yZGVyL1xyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgICAgfSksXHJcbiAgICAgIFZpdGVJbWFnZU9wdGltaXplcih7XHJcbiAgICAgICAgdGVzdDogL1xcLihqcGU/Z3xwbmd8Z2lmfHRpZmZ8d2VicHxzdmd8YXZpZikkL2ksXHJcbiAgICAgICAgZXhjbHVkZTogdW5kZWZpbmVkLFxyXG4gICAgICAgIGluY2x1ZGU6IHVuZGVmaW5lZCxcclxuICAgICAgICBpbmNsdWRlUHVibGljOiB0cnVlLFxyXG4gICAgICAgIGxvZ1N0YXRzOiB0cnVlLFxyXG4gICAgICAgIGFuc2lDb2xvcnM6IHRydWUsXHJcbiAgICAgICAgc3ZnOiB7XHJcbiAgICAgICAgICBtdWx0aXBhc3M6IHRydWUsXHJcbiAgICAgICAgICBwbHVnaW5zOiBbXHJcbiAgICAgICAgICAgICdwcmVzZXQtZGVmYXVsdCcsXHJcbiAgICAgICAgICAgICdzb3J0QXR0cnMnLFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgbmFtZTogJ2FkZEF0dHJpYnV0ZXNUb1NWR0VsZW1lbnQnLFxyXG4gICAgICAgICAgICAgIHBhcmFtczoge1xyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlczogW3sgeG1sbnM6ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycgfV0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwbmc6IHtcclxuICAgICAgICAgIC8vIHBhbGV0dGU6IHRydWUsXHJcbiAgICAgICAgICBxdWFsaXR5OiA4MCxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGpwZWc6IHtcclxuICAgICAgICAgIC8vIHByb2dyZXNzaXZlOiB0cnVlLFxyXG4gICAgICAgICAgcXVhbGl0eTogODAsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBqcGc6IHtcclxuICAgICAgICAgIC8vIHByb2dyZXNzaXZlOiB0cnVlLFxyXG4gICAgICAgICAgcXVhbGl0eTogODAsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBnaWY6IHt9LFxyXG4gICAgICAgIHdlYnA6IHtcclxuICAgICAgICAgIGxvc3NsZXNzOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXZpZjoge1xyXG4gICAgICAgICAgbG9zc2xlc3M6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjYWNoZTogdHJ1ZSxcclxuICAgICAgICBjYWNoZUxvY2F0aW9uOiB1bmRlZmluZWQsXHJcbiAgICAgIH0pLFxyXG4gICAgICBjb21wcmVzc2lvbih7XHJcbiAgICAgICAgYWxnb3JpdGhtOiAnZ3ppcCcsXHJcbiAgICAgICAgZXh0OiAnLmd6JyxcclxuICAgICAgfSksXHJcbiAgICAgIGNvbXByZXNzaW9uKHtcclxuICAgICAgICBhbGdvcml0aG06ICdicm90bGlDb21wcmVzcycsXHJcbiAgICAgICAgZXh0OiAnLmJyJyxcclxuICAgICAgfSksXHJcbiAgICAgIFNpdGVtYXAoe1xyXG4gICAgICAgIGhvc3RuYW1lOiBlbnYuVklURV9VUkwgfHwgJ2h0dHBzOi8vcmFtb3VzZS5jb20nLFxyXG4gICAgICAgIGR5bmFtaWNSb3V0ZXM6IHJvdXRlcyxcclxuICAgICAgICBnZW5lcmF0ZVJvYm90c1R4dDogdHJ1ZSxcclxuICAgICAgICByZWFkYWJsZTogdHJ1ZSxcclxuICAgICAgICBleGNsdWRlOiBbJy9hZG1pbicsICcvZGFzaGJvYXJkJywgJy9wcm92aWRlcicsICcvdGVjaG5pY2lhbicsICcvdG93LXRydWNrLWRhc2hib2FyZCddXHJcbiAgICAgIH0pXHJcbiAgICBdLFxyXG5cclxuICAgIGRlZmluZToge1xyXG4gICAgICAncHJvY2Vzcy5lbnYuQVBJX0tFWSc6IEpTT04uc3RyaW5naWZ5KGVudi5HRU1JTklfQVBJX0tFWSksXHJcbiAgICAgICdwcm9jZXNzLmVudi5HRU1JTklfQVBJX0tFWSc6IEpTT04uc3RyaW5naWZ5KGVudi5HRU1JTklfQVBJX0tFWSlcclxuICAgIH0sXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVIsT0FBTyxVQUFVO0FBQzFTLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsY0FBYyxlQUFlO0FBQ3RDLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxpQkFBaUI7QUFDeEIsU0FBUywwQkFBMEI7QUFFbkMsT0FBTyxhQUFhO0FBUjJKLElBQU0sMkNBQTJDO0FBVWhPLElBQU0sYUFBYSxjQUFjLHdDQUFlO0FBQ2hELElBQU0sWUFBWSxLQUFLLFFBQVEsVUFBVTtBQUV6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFdBQVcsRUFBRTtBQUN2QyxRQUFNLGVBQWUsU0FBUztBQUU5QixRQUFNLFNBQVM7QUFBQSxJQUNiO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUVBLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQTtBQUFB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
