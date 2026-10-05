// Browser bundle: single ESM file (.mjs so it loads as ESM regardless of the
// package "type"), no Node builtins, data/ embedded.
// Usage: npm run build:bundle  -> dist/browser/verovio-ts.mjs
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'verovio-ts.mjs',
    },
    outDir: 'dist/browser',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    target: 'es2022',
  },
  resolve: { extensions: ['.ts', '.js'] },
});
