import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 9002,
    strictPort: true,
    allowedHosts: ['103.77.242.147', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:9100',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'ws://127.0.0.1:9100',
        ws: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 9002,
    strictPort: true,
    allowedHosts: ['103.77.242.147', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:9100',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'ws://127.0.0.1:9100',
        ws: true
      }
    }
  }
});
