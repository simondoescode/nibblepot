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
          globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2}'],
          navigateFallback: '/nibblepot/index.html',
          navigateFallbackDenylist: [/^\/nibblepot\/assets\//, /^\/nibblepot\/icons\//],
        },
        manifest: {
          id: base,
          name: 'Simmer',
          short_name: 'Simmer',
          description: 'Dinner, sorted. Discover family recipes, plan meals and shop smarter.',
          start_url: './',
          scope: './',
          display: 'standalone',
          orientation: 'any',
          display_override: ['standalone', 'minimal-ui'],
          lang: 'en-GB',
          prefer_related_applications: false,
          categories: ['food', 'lifestyle'],
          shortcuts: [
            { name: 'Plan the week', url: 'planner/', icons: [{ src: 'icons/icon-192-v3.png', sizes: '192x192' }] },
            { name: 'Shopping list', url: 'shopping/', icons: [{ src: 'icons/icon-192-v3.png', sizes: '192x192' }] },
            { name: 'Favourites', url: 'favourites/', icons: [{ src: 'icons/icon-192-v3.png', sizes: '192x192' }] },
          ],
          background_color: '#f7f1e6',
          theme_color: '#153c32',
          icons: [
            { src: 'icons/icon-192-v3.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-512-v3.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-maskable-512-v3.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        }
      })
    ]
  };
});

