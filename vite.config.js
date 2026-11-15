import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: '127.0.0.1', port: 5174, strictPort: true, watch: { ignored: ['**/tmp/**'] } },
  preview: { host: '127.0.0.1', port: 4174, strictPort: true },
  build: { rollupOptions: { output: { manualChunks: { phaser: ['phaser'], three: ['three'] } } } },
});
