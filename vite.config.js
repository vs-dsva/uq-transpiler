import { defineConfig } from 'vite';

export default defineConfig({
  // Use project root for Vercel; move demo assets from /web to root index.html already created
  publicDir: 'public', // static assets folder (will create if missing)
  plugins: [],
  build: {
    target: 'es2018',
    outDir: 'dist', // use conventional Vercel-compatible output dir
    emptyOutDir: true
  }
});
