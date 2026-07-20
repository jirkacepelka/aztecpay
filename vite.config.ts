import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' → all asset URLs are relative, so the built site works when served
// from an IPFS content hash (ipfs://<CID>/ or https://gateway/ipfs/<CID>/) and
// therefore behind an ENS name via contenthash. Do NOT use absolute-path routing.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
  },
});
