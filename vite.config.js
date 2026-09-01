import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        v2: resolve(import.meta.dirname, 'v2/index.html'),
        v3: resolve(import.meta.dirname, 'v3/index.html'),
      },
    },
  },
});
