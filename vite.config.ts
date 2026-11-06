import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Keep all release assets and the service worker inside the GitHub Pages repo path.
export default defineConfig(() => {
  const base = '/nibblepot/';
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        base,
        scope: base,
        registerType: 'prompt',
        includeAssets: ['icons/*'],
        workbox: {
          clientsClaim: true,
          skipWaiting: false,
          globPatterns: ['**/*.{js,css,html,svg,png,webp,ico}'],
          navigateFallback: '/nibblepot/index.html',
          navigateFallbackDenylist: [/^\/nibblepot\/assets\//, /^\/nibblepot\/icons\//],
        },
        manifest: {
          id: base,
          name: "Nibblepot — What's for tea? Sorted.",
          short_name: 'Nibblepot',
          description: 'Cheap, cheerful family recipes, a larder, and shopping list.',
          start_url: './',
          scope: './',
          display: 'standalone',
          lang: 'en-GB',
          categories: ['food', 'lifestyle'],
          shortcuts: [
            { name: 'Plan the week', url: 'planner/', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Shopping list', url: 'shopping/', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Favourites', url: 'favourites/', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          ],
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

