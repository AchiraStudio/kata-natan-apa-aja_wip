import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    host: true, // Expose to all network interfaces (0.0.0.0)
    port: 5173,
    cors: true,
    allowedHosts: true, // Allow dev tunnels (VS Code Ports, localtunnel, ngrok, cloudflare)
  },
  preview: {
    host: true,
    port: 4173,
    cors: true,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
