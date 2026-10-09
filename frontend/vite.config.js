import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // three.js is loaded lazily for the 3D background; its chunk is large but off the critical path
  build: { chunkSizeWarningLimit: 800 },
});
