import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import os from 'os';

// Dynamically find the LAN IPv4 address (avoids hardcoding)
const getLanIp = () => {
    const nets = os.networkInterfaces();
    for (const iface of Object.values(nets)) {
        for (const net of iface) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
};
const lanIp = getLanIp();

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/main.jsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@hms/ui': path.resolve(__dirname, 'packages/hms-ui/src/index.js'),
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    server: {
        host: '0.0.0.0',  // bind on all interfaces
        port: 5173,
        strictPort: false,
        cors: true,        // allow cross-origin requests from Laravel (port 8000)
        hmr: {
            host: lanIp,  // dynamically detected LAN IPv4 — fixes [::] ERR_ADDRESS_INVALID
        },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});

