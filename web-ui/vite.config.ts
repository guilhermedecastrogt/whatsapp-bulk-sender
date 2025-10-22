import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/send-text': 'http://localhost:8000',
      '/send-text-file': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
  },
})