import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Desabilitar source maps em produção para segurança
    sourcemap: false,
    // Minificar código
    minify: 'esbuild',
    // Otimizações
    rollupOptions: {
      output: {
        // Separar vendor chunks
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
  // Headers de segurança (se usar um servidor que suporta)
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },
})

