import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            "@locator/babel-jsx/dist",
            {
              env: "development",
            },
          ],
        ],
      },
    }),
  ],

  // ✅ Works for localhost + Render + any domain
  preview: {
    host: "0.0.0.0", // Listen on all network interfaces
    port: 4173,      // Default Vite preview port (can be any free port)
    strictPort: true, // Ensures consistent port behavior
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      ".onrender.com",  // Any Render subdomain
      ".vercel.app",    // Optional: if ever hosted on Vercel
      ".netlify.app",   // Optional: if hosted on Netlify
      ".herokuapp.com", // Optional: Heroku compatibility
      "all"             // Fallback for other environments
    ],
  },

  // Optional: if you ever proxy backend APIs
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
