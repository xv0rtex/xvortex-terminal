import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    host: true, // permite acceder desde fuera (Cloudflared u otras IPs)
    port: 3000, // el puerto que usas
    allowedHosts: ['soriaruiz.com'], // permite tu dominio del t  nel
  },
});