import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
    },
    optimizeDeps: {
        exclude: ['sql.js'],
    },
    server: {
        port: 5173,
        open: true,
    },
});
