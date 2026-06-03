import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
    build: {
        // MUI + React em um único bundle é esperado para apps Inertia SSR-free.
        // Code splitting por rota acontece via import() lazy nas páginas.
        chunkSizeWarningLimit: 2000,
    },
});
