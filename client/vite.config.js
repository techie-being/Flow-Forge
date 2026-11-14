import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// In dev, /api/* is proxied to the FlowForge backend, so the browser sees one
// origin: no CORS setup needed and the HTTP-only auth cookies just work.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": { target: env.VITE_BACKEND_URL || "http://localhost:5000", changeOrigin: true },
      },
    },
  };
});
