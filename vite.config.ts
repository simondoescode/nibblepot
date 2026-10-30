import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Keep all release assets and the service worker inside the GitHub Pages repo path.
export default defineConfig(({ command }) => {
  const base = command === 'serve' ? '/' : '/nibblepot/';
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        base,
        scope: base,
        registerType: 'autoUpdate',
        includeAssets: ['icons/favicon.svg'],
        manifest: {
          id: base,
          name: "Nibblepot — What's for tea? Sorted.",
          short_name: 'Nibblepot',
          description: 'Cheap, cheerful family recipes, a larder, and shopping list.',
          start_url: './',
          scope: './',
          display: 'standalone',
          background_color: '#fffaf1',
          theme_color: '#fff9ee',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
          ]
        }
      })
    ]
  };
});
