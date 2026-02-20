import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
    }),
    viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
    }),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react'],
          'vendor-axios': ['axios'],
        },
      },
    },
  },
})
