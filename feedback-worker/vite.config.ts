import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({ build: { outDir: 'dist-worker', minify: false, lib: {
  entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)), formats: ['es'], fileName: () => 'worker.js',
} } });
