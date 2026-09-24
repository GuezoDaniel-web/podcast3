import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // The existing .env uses SUPA_BASE_* names. Vite only exposes prefixes listed
  // here to the browser bundle, so both the legacy and VITE_ names work.
  envPrefix: ['VITE_', 'SUPA_BASE_'],
  server: {
    // Honour PORT when something else already holds the default.
    port: Number(process.env.PORT) || 5173,
  },
})
