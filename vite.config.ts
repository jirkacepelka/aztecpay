import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// base: './' → all asset URLs are relative, so the built site works when served
// from an IPFS content hash (ipfs://<CID>/ or https://gateway/ipfs/<CID>/) and
// therefore behind an ENS name via contenthash. Do NOT use absolute-path routing.
//
// nodePolyfills + esnext target: @aztec/wallet-sdk pulls @aztec/aztec.js /
// foundation, which reference Node built-ins (util, buffer, tty via pino) and
// use top-level await / WASM. These make it run in the browser.
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['util', 'buffer', 'process', 'stream', 'events', 'crypto', 'path'],
      globals: { Buffer: true, process: true, global: true },
    }),
  ],
  base: './',
  build: {
    outDir: 'dist',
    target: 'esnext',
    assetsInlineLimit: 4096,
  },
  optimizeDeps: {
    esbuildOptions: { target: 'esnext' },
  },
});
