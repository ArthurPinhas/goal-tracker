import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    // Many docs/examples use :3000; match that so “wrong port = wrong app” is less likely
    port: 3000,
    strictPort: false,
    hmr: {
      overlay: false,
    },
    headers: {
      "Cache-Control": "no-store",
    },
  },
  plugins: [
    react(),
    VitePWA({
      /* Avoid registering Workbox during `npm run dev` — keeps dev free of SW cache surprises */
      devOptions: {
        enabled: false,
      },
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png"],
      manifest: {
        name: "Goal Tracker",
        short_name: "Goals",
        description: "Track goals, break them into steps, celebrate every win.",
        theme_color: "#34d399",
        background_color: "#141820",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'framer-motion': ['framer-motion'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
          pocketbase: ['pocketbase'],
          lottie: ['lottie-react'],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
});
