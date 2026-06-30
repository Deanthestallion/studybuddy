import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    // Dedicated port + strictPort so it never silently collides with another
    // dev server (e.g. n8n on 5173) and quietly move to a different port.
    port: 5180,
    strictPort: true,
    host: true,
  },
  preview: {
    port: 5180,
    strictPort: true,
    host: true,
  },
});
