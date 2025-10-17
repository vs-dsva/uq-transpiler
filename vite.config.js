import { defineConfig } from 'vite';

export default defineConfig({
  root: 'web', // Serve demo from /web so http://localhost:5173/ works
  plugins: [],
  build: {
    target: 'es2018',
    outDir: '../dist-web', // relative to root (web)
    emptyOutDir: true
  }
});
