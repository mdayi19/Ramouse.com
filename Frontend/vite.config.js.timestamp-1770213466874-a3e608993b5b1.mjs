// vite.config.js
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "file:///C:/laragon/www/ramouse/Frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/laragon/www/ramouse/Frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///C:/laragon/www/ramouse/Frontend/node_modules/vite-plugin-pwa/dist/index.js";
import compression from "file:///C:/laragon/www/ramouse/Frontend/node_modules/vite-plugin-compression/dist/index.mjs";
import { ViteImageOptimizer } from "file:///C:/laragon/www/ramouse/Frontend/node_modules/vite-plugin-image-optimizer/dist/index.js";
import Sitemap from "file:///C:/laragon/www/ramouse/Frontend/node_modules/vite-plugin-sitemap/dist/index.js";
var __vite_injected_original_import_meta_url = "file:///C:/laragon/www/ramouse/Frontend/vite.config.js";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = path.dirname(__filename);
var vite_config_default = defineConfig(function(_a) {
  var mode = _a.mode;
  var env = loadEnv(mode, __dirname, "");
  var isProduction = mode === "production";
  var routes = [
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
        // Proxy API requests to Laravel backend when running locally
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
          importScripts: ["custom-sw.js"],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: function(_a2) {
                var url = _a2.url;
                return url.pathname.startsWith("/api") || url.pathname.startsWith("/storage");
              },
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
        // Disable auto-generation of robots.txt because we have a manual public/robots.txt
        generateRobotsTxt: false,
        dynamicRoutes: ["/blog", "/services", "/contact"],
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxsYXJhZ29uXFxcXHd3d1xcXFxyYW1vdXNlXFxcXEZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxsYXJhZ29uXFxcXHd3d1xcXFxyYW1vdXNlXFxcXEZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9sYXJhZ29uL3d3dy9yYW1vdXNlL0Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnO1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XHJcbmltcG9ydCBjb21wcmVzc2lvbiBmcm9tICd2aXRlLXBsdWdpbi1jb21wcmVzc2lvbic7XHJcbmltcG9ydCB7IFZpdGVJbWFnZU9wdGltaXplciB9IGZyb20gJ3ZpdGUtcGx1Z2luLWltYWdlLW9wdGltaXplcic7XHJcbmltcG9ydCBTaXRlbWFwIGZyb20gJ3ZpdGUtcGx1Z2luLXNpdGVtYXAnO1xyXG52YXIgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKTtcclxudmFyIF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShfX2ZpbGVuYW1lKTtcclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKGZ1bmN0aW9uIChfYSkge1xyXG4gICAgdmFyIG1vZGUgPSBfYS5tb2RlO1xyXG4gICAgdmFyIGVudiA9IGxvYWRFbnYobW9kZSwgX19kaXJuYW1lLCAnJyk7XHJcbiAgICB2YXIgaXNQcm9kdWN0aW9uID0gbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nO1xyXG4gICAgdmFyIHJvdXRlcyA9IFtcclxuICAgICAgICAnLycsXHJcbiAgICAgICAgJy9zdG9yZScsXHJcbiAgICAgICAgJy90b3ctdHJ1Y2tzJyxcclxuICAgICAgICAnL3RlY2huaWNpYW5zJyxcclxuICAgICAgICAnL3JlZ2lzdGVyLXRlY2huaWNpYW4nLFxyXG4gICAgICAgICcvcmVnaXN0ZXItdG93LXRydWNrJyxcclxuICAgICAgICAnL2Jsb2cnLFxyXG4gICAgICAgICcvZmFxJyxcclxuICAgICAgICAnL3ByaXZhY3knLFxyXG4gICAgICAgICcvdGVybXMnLFxyXG4gICAgICAgICcvY29udGFjdCcsXHJcbiAgICAgICAgJy9vcmRlcicsXHJcbiAgICAgICAgJy9hbm5vdW5jZW1lbnRzJ1xyXG4gICAgXTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcm9vdDogJy4nLCAvLyBDdXJyZW50IGRpcmVjdG9yeSAoRnJvbnRlbmQvKVxyXG4gICAgICAgIHNlcnZlcjoge1xyXG4gICAgICAgICAgICBwb3J0OiAzMDAwLFxyXG4gICAgICAgICAgICBob3N0OiAnMC4wLjAuMCcsXHJcbiAgICAgICAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgICAgICAgICAvLyBQcm94eSBBUEkgcmVxdWVzdHMgdG8gTGFyYXZlbCBiYWNrZW5kIHdoZW4gcnVubmluZyBsb2NhbGx5XHJcbiAgICAgICAgICAgICAgICAnL2FwaSc6IHtcclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IGVudi5WSVRFX0FQSV9VUkwgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgJy9zdG9yYWdlJzoge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogZW52LlZJVEVfQVBJX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDo4MDAwJyxcclxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYnVpbGQ6IHtcclxuICAgICAgICAgICAgLy8gVGFyZ2V0IG1vZGVybiBicm93c2VycyBmb3Igc21hbGxlciBidW5kbGVzXHJcbiAgICAgICAgICAgIHRhcmdldDogJ2VzbmV4dCcsXHJcbiAgICAgICAgICAgIC8vIFNwZWVkIHVwIGJ1aWxkIHByb2Nlc3NcclxuICAgICAgICAgICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IGZhbHNlLFxyXG4gICAgICAgICAgICAvLyBPcHRpbWl6ZSBjaHVuayBzaXplXHJcbiAgICAgICAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcclxuICAgICAgICAgICAgLy8gQmV0dGVyIHNvdXJjZSBtYXBzIGZvciBwcm9kdWN0aW9uIGRlYnVnZ2luZ1xyXG4gICAgICAgICAgICBzb3VyY2VtYXA6IGlzUHJvZHVjdGlvbiA/ICdoaWRkZW4nIDogdHJ1ZSxcclxuICAgICAgICAgICAgLy8gTWluaWZpY2F0aW9uIHNldHRpbmdzXHJcbiAgICAgICAgICAgIG1pbmlmeTogJ3RlcnNlcicsXHJcbiAgICAgICAgICAgIHRlcnNlck9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGNvbXByZXNzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZHJvcF9jb25zb2xlOiBpc1Byb2R1Y3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgZHJvcF9kZWJ1Z2dlcjogaXNQcm9kdWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHB1cmVfZnVuY3M6IGlzUHJvZHVjdGlvbiA/IFsnY29uc29sZS5sb2cnLCAnY29uc29sZS5kZWJ1ZycsICdjb25zb2xlLmluZm8nXSA6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhc3NlczogMlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyBSb2xsdXAgb3B0aW1pemF0aW9uc1xyXG4gICAgICAgICAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBNYW51YWwgY2h1bmsgc3BsaXR0aW5nIGZvciBiZXR0ZXIgY2FjaGluZ1xyXG4gICAgICAgICAgICAgICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBWZW5kb3IgY2h1bmtzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdyZWFjdC12ZW5kb3InOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICd1aS12ZW5kb3InOiBbJ2ZyYW1lci1tb3Rpb24nLCAnbHVjaWRlLXJlYWN0J10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICd1dGlscy12ZW5kb3InOiBbJ2F4aW9zJywgJ2Nsc3gnLCAndGFpbHdpbmQtbWVyZ2UnXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRGFzaGJvYXJkIGNodW5rc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnYWRtaW4tZGFzaGJvYXJkJzogWycuL3NyYy9jb21wb25lbnRzL0FkbWluRGFzaGJvYXJkLnRzeCddLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnY3VzdG9tZXItZGFzaGJvYXJkJzogWycuL3NyYy9jb21wb25lbnRzL0N1c3RvbWVyRGFzaGJvYXJkLnRzeCddLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAncHJvdmlkZXItZGFzaGJvYXJkJzogWycuL3NyYy9jb21wb25lbnRzL1Byb3ZpZGVyRGFzaGJvYXJkLnRzeCddLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAndGVjaG5pY2lhbi1kYXNoYm9hcmQnOiBbJy4vc3JjL2NvbXBvbmVudHMvVGVjaG5pY2lhbkRhc2hib2FyZC50c3gnXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ3Rvd3RydWNrLWRhc2hib2FyZCc6IFsnLi9zcmMvY29tcG9uZW50cy9Ub3dUcnVja0Rhc2hib2FyZC50c3gnXSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE9wdGltaXplIGFzc2V0IGZpbGUgbmFtZXNcclxuICAgICAgICAgICAgICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdJyxcclxuICAgICAgICAgICAgICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2NodW5rcy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICAgICAgICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2VudHJpZXMvW25hbWVdLVtoYXNoXS5qcycsXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICAgICAgcmVhY3QoKSxcclxuICAgICAgICAgICAgVml0ZVBXQSh7XHJcbiAgICAgICAgICAgICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcclxuICAgICAgICAgICAgICAgIGluY2x1ZGVBc3NldHM6IFsnZmF2aWNvbi5pY28nLCAnYXBwbGUtdG91Y2gtaWNvbi5wbmcnXSxcclxuICAgICAgICAgICAgICAgIGRldk9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnXHUwNjMxXHUwNjI3XHUwNjQ1XHUwNjQ4XHUwNjMzXHUwNjI5IFx1MDY0NFx1MDY0Mlx1MDYzN1x1MDYzOSBcdTA2M0FcdTA2NEFcdTA2MjdcdTA2MzEgXHUwNjI3XHUwNjQ0XHUwNjMzXHUwNjRBXHUwNjI3XHUwNjMxXHUwNjI3XHUwNjJBJyxcclxuICAgICAgICAgICAgICAgICAgICBzaG9ydF9uYW1lOiAnXHUwNjMxXHUwNjI3XHUwNjQ1XHUwNjQ4XHUwNjMzXHUwNjI5JyxcclxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1x1MDYyQVx1MDYzN1x1MDYyOFx1MDY0QVx1MDY0MiBcdTA2NDhcdTA2NEFcdTA2MjggXHUwNjJEXHUwNjJGXHUwNjRBXHUwNjJCIFx1MDY0OFx1MDY0NVx1MDYyQVx1MDYyQ1x1MDYyN1x1MDY0OFx1MDYyOCBcdTA2NDRcdTA2MzdcdTA2NDRcdTA2MjggXHUwNjQyXHUwNjM3XHUwNjM5IFx1MDYzQVx1MDY0QVx1MDYyN1x1MDYzMSBcdTA2MjdcdTA2NDRcdTA2MzNcdTA2NEFcdTA2MjdcdTA2MzFcdTA2MjdcdTA2MkEgXHUwNjI4XHUwNjMzXHUwNjQ3XHUwNjQ4XHUwNjQ0XHUwNjI5IFx1MDY0MVx1MDY0QSBcdTA2MzNcdTA2NDhcdTA2MzFcdTA2NEFcdTA2MjcuJyxcclxuICAgICAgICAgICAgICAgICAgICB0aGVtZV9jb2xvcjogJyMwMjg0YzcnLFxyXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjZjhmYWZjJyxcclxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnc3RhbmRhbG9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRfdXJsOiAnLycsXHJcbiAgICAgICAgICAgICAgICAgICAgaWNvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiAncHdhLTE5MngxOTIucG5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmM6ICdwd2EtNTEyeDUxMi5wbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgIHNjcmVlbnNob3RzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJ3NjcmVlbnNob3QtbW9iaWxlLnBuZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplczogJzY0MHgxMTM2JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybV9mYWN0b3I6ICduYXJyb3cnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJ3NjcmVlbnNob3QtZGVza3RvcC5wbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZXM6ICcxOTIweDEwODAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtX2ZhY3RvcjogJ3dpZGUnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgd29ya2JveDoge1xyXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydFNjcmlwdHM6IFsnY3VzdG9tLXN3LmpzJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgY2xlYW51cE91dGRhdGVkQ2FjaGVzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybFBhdHRlcm46IGZ1bmN0aW9uIChfYSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1cmwgPSBfYS51cmw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVybC5wYXRobmFtZS5zdGFydHNXaXRoKCcvYXBpJykgfHwgdXJsLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9zdG9yYWdlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlcjogJ05ldHdvcmtPbmx5JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgZ2xvYlBhdHRlcm5zOiBbJyoqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnfSddLFxyXG4gICAgICAgICAgICAgICAgICAgIG5hdmlnYXRlRmFsbGJhY2tEZW55bGlzdDogWy9eXFwvYXBpLywgL15cXC9zdG9yYWdlL10sXHJcbiAgICAgICAgICAgICAgICAgICAgbmF2aWdhdGVGYWxsYmFja0FsbG93bGlzdDogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvXlxcLyQvLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvXlxcL3Rvdy10cnVjay1kYXNoYm9hcmQvLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvXlxcL2Rhc2hib2FyZC8sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC9eXFwvYWRtaW4vLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvXlxcL3Byb3ZpZGVyLyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgL15cXC90ZWNobmljaWFuLyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgL15cXC9zdG9yZS8sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC9eXFwvbXktb3JkZXJzLyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgL15cXC9ub3RpZmljYXRpb25zLyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgL15cXC9hbm5vdW5jZW1lbnRzLyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgL15cXC90b3ctdHJ1Y2tzLyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgL15cXC90ZWNobmljaWFucy8sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC9eXFwvcmVnaXN0ZXItdGVjaG5pY2lhbi8sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC9eXFwvcmVnaXN0ZXItdG93LXRydWNrLyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgL15cXC9ibG9nLyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgL15cXC9mYXEvLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvXlxcL3ByaXZhY3kvLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvXlxcL3Rlcm1zLyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgL15cXC9jb250YWN0LyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgL15cXC9vcmRlci9cclxuICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBWaXRlSW1hZ2VPcHRpbWl6ZXIoe1xyXG4gICAgICAgICAgICAgICAgdGVzdDogL1xcLihqcGU/Z3xwbmd8Z2lmfHRpZmZ8d2VicHxzdmd8YXZpZikkL2ksXHJcbiAgICAgICAgICAgICAgICBleGNsdWRlOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICBpbmNsdWRlOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICBpbmNsdWRlUHVibGljOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgbG9nU3RhdHM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBhbnNpQ29sb3JzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3ZnOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlwYXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ3ByZXNldC1kZWZhdWx0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NvcnRBdHRycycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdhZGRBdHRyaWJ1dGVzVG9TVkdFbGVtZW50JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IFt7IHhtbG5zOiAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIH1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHBuZzoge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHBhbGV0dGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogODAsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAganBlZzoge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHByb2dyZXNzaXZlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6IDgwLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGpwZzoge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHByb2dyZXNzaXZlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6IDgwLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGdpZjoge30sXHJcbiAgICAgICAgICAgICAgICB3ZWJwOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9zc2xlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYXZpZjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvc3NsZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNhY2hlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgY2FjaGVMb2NhdGlvbjogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgY29tcHJlc3Npb24oe1xyXG4gICAgICAgICAgICAgICAgYWxnb3JpdGhtOiAnZ3ppcCcsXHJcbiAgICAgICAgICAgICAgICBleHQ6ICcuZ3onLFxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgY29tcHJlc3Npb24oe1xyXG4gICAgICAgICAgICAgICAgYWxnb3JpdGhtOiAnYnJvdGxpQ29tcHJlc3MnLFxyXG4gICAgICAgICAgICAgICAgZXh0OiAnLmJyJyxcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIFNpdGVtYXAoe1xyXG4gICAgICAgICAgICAgICAgaG9zdG5hbWU6IGVudi5WSVRFX1VSTCB8fCAnaHR0cHM6Ly9yYW1vdXNlLmNvbScsXHJcbiAgICAgICAgICAgICAgICAvLyBEaXNhYmxlIGF1dG8tZ2VuZXJhdGlvbiBvZiByb2JvdHMudHh0IGJlY2F1c2Ugd2UgaGF2ZSBhIG1hbnVhbCBwdWJsaWMvcm9ib3RzLnR4dFxyXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVSb2JvdHNUeHQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZHluYW1pY1JvdXRlczogWycvYmxvZycsICcvc2VydmljZXMnLCAnL2NvbnRhY3QnXSxcclxuICAgICAgICAgICAgICAgIHJlYWRhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgZXhjbHVkZTogWycvYWRtaW4nLCAnL2Rhc2hib2FyZCcsICcvcHJvdmlkZXInLCAnL3RlY2huaWNpYW4nLCAnL3Rvdy10cnVjay1kYXNoYm9hcmQnXVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgZGVmaW5lOiB7XHJcbiAgICAgICAgICAgICdwcm9jZXNzLmVudi5BUElfS0VZJzogSlNPTi5zdHJpbmdpZnkoZW52LkdFTUlOSV9BUElfS0VZKSxcclxuICAgICAgICAgICAgJ3Byb2Nlc3MuZW52LkdFTUlOSV9BUElfS0VZJzogSlNPTi5zdHJpbmdpZnkoZW52LkdFTUlOSV9BUElfS0VZKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVzb2x2ZToge1xyXG4gICAgICAgICAgICBhbGlhczoge1xyXG4gICAgICAgICAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAi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U0FBUztBQUFBLFFBQ1QsZUFBZTtBQUFBLFFBQ2YsVUFBVTtBQUFBLFFBQ1YsWUFBWTtBQUFBLFFBQ1osS0FBSztBQUFBLFVBQ0QsV0FBVztBQUFBLFVBQ1gsU0FBUztBQUFBLFlBQ0w7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLGNBQ0ksTUFBTTtBQUFBLGNBQ04sUUFBUTtBQUFBLGdCQUNKLFlBQVksQ0FBQyxFQUFFLE9BQU8sNkJBQTZCLENBQUM7QUFBQSxjQUN4RDtBQUFBLFlBQ0o7QUFBQSxVQUNKO0FBQUEsUUFDSjtBQUFBLFFBQ0EsS0FBSztBQUFBO0FBQUEsVUFFRCxTQUFTO0FBQUEsUUFDYjtBQUFBLFFBQ0EsTUFBTTtBQUFBO0FBQUEsVUFFRixTQUFTO0FBQUEsUUFDYjtBQUFBLFFBQ0EsS0FBSztBQUFBO0FBQUEsVUFFRCxTQUFTO0FBQUEsUUFDYjtBQUFBLFFBQ0EsS0FBSyxDQUFDO0FBQUEsUUFDTixNQUFNO0FBQUEsVUFDRixVQUFVO0FBQUEsUUFDZDtBQUFBLFFBQ0EsTUFBTTtBQUFBLFVBQ0YsVUFBVTtBQUFBLFFBQ2Q7QUFBQSxRQUNBLE9BQU87QUFBQSxRQUNQLGVBQWU7QUFBQSxNQUNuQixDQUFDO0FBQUEsTUFDRCxZQUFZO0FBQUEsUUFDUixXQUFXO0FBQUEsUUFDWCxLQUFLO0FBQUEsTUFDVCxDQUFDO0FBQUEsTUFDRCxZQUFZO0FBQUEsUUFDUixXQUFXO0FBQUEsUUFDWCxLQUFLO0FBQUEsTUFDVCxDQUFDO0FBQUEsTUFDRCxRQUFRO0FBQUEsUUFDSixVQUFVLElBQUksWUFBWTtBQUFBO0FBQUEsUUFFMUIsbUJBQW1CO0FBQUEsUUFDbkIsZUFBZSxDQUFDLFNBQVMsYUFBYSxVQUFVO0FBQUEsUUFDaEQsVUFBVTtBQUFBLFFBQ1YsU0FBUyxDQUFDLFVBQVUsY0FBYyxhQUFhLGVBQWUsc0JBQXNCO0FBQUEsTUFDeEYsQ0FBQztBQUFBLElBQ0w7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNKLHVCQUF1QixLQUFLLFVBQVUsSUFBSSxjQUFjO0FBQUEsTUFDeEQsOEJBQThCLEtBQUssVUFBVSxJQUFJLGNBQWM7QUFBQSxJQUNuRTtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ0wsT0FBTztBQUFBLFFBQ0gsS0FBSyxLQUFLLFFBQVEsV0FBVyxPQUFPO0FBQUEsTUFDeEM7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbIl9hIl0KfQo=
