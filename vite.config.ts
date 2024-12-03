import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/supabase-app/',
  server: {
    port: 9000,
    host: '0.0.0.0',
    open: true // سيفتح المتصفح تلقائياً
  }
})
