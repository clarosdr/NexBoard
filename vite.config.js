import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimizaciones para producción
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Separar chunks para mejor caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    },
    // Configuración de assets
    assetsDir: 'assets',
    // Límite de tamaño para inline assets (4KB)
    assetsInlineLimit: 4096
  },
  // Optimización de dependencias
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js']
  },
  // Configuración del servidor de desarrollo
  server: {
    port: 5173,
    host: true
  },
  // Configuración de preview
  preview: {
    port: 4173,
    host: true
  }
})
