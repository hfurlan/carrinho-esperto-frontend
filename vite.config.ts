/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// Strip the browser's Origin header from proxied dev requests so the backend
// (and MiniStack) treat them as same-origin and their CORS checks stay out of
// the way — the SPA already talks to the Vite dev server same-origin over HTTPS.
// (Vite already logs proxy-level errors — backend down / refused — to its own
// terminal.)
function stripOrigin(proxy: { on(event: 'proxyReq', cb: (req: { removeHeader(name: string): void }) => void): void }) {
  proxy.on('proxyReq', (req) => req.removeHeader('origin'));
}

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // Dev only: serve the app over HTTPS so `getUserMedia` (the QR camera) works
    // when testing from a phone — a secure context needs HTTPS or localhost.
    // Self-signed: accept the certificate warning once on the device.
    // Only for `vite` / `vite dev` — `vite build` skips it.
    ...(command === 'serve' ? [basicSsl()] : []),
  ],
  server: {
    // Listen on all interfaces so the dev server is reachable from other devices
    // on the LAN. Vite prints the Network URL (https://<lan-ip>:5173) to use.
    host: true,
    port: 5173,
    // Same-origin dev proxy: with VITE_API_BASE_URL empty the SPA calls
    // `/api/...` (and `/cognito/...`) on the HTTPS dev server, which forwards to
    // the local backend / MiniStack over plain HTTP. No mixed content, and no
    // backend CORS allow-list entry needed.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // The NFC-e import calls SEFAZ-SP synchronously (up to ~15s). Give the
        // proxy room so it does not cut the request short with a 5xx.
        timeout: 60_000,
        proxyTimeout: 60_000,
        configure: stripOrigin,
      },
      '/cognito': {
        target: 'http://localhost:4566',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cognito/, ''),
        configure: stripOrigin,
      },
    },
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
}));
