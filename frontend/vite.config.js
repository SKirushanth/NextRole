import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In dev, /api calls are proxied to the FastAPI backend, so the browser never hits CORS.
// In production, nginx does the same job (added in the docker branch).
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    proxy: {
      "/api": process.env.VITE_API_TARGET || "http://localhost:8000",
    },
  },
});