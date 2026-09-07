/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // jsdom disables Web Storage for opaque origins (about:blank), so pin a real
    // origin — otherwise `localStorage` is undefined in tests.
    environmentOptions: { jsdom: { url: 'http://localhost:5173' } },
    setupFiles: ['./vitest.setup.ts'],
    css: false,
  },
});
