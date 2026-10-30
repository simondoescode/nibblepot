# Nibblepot 🍲

**Good grub. Zero faff.** A colourful, installable family recipe book with 16 recipes, a surprise-me button, favourites, larder, ingredient matching, and Tesco shopping links.

## Stack

React 19, Vite, TypeScript, custom CSS, `vite-plugin-pwa`, Vitest and Playwright. Static-hosted on GitHub Pages. No backend, authentication, tracking or runtime API required.

## Get started

Requires Node.js 22.12+.

```sh
npm ci
npm run dev
```

Open http://localhost:5173/nibblepot/ in development. The base path stays the same in preview and on GitHub Pages.

Commands:

- `npm run build`: TypeScript check and production build to `dist/`.
- `npm run test`: recipe, larder, shopping and storage unit tests.
- `npm run test:e2e`: desktop and mobile Chromium smoke tests (install with `npx playwright install chromium` first).
- `npm run check`: run all three above.

## Deploy

The GitHub Actions workflow runs on PRs and `main`. It tests the app first, then deploys the build output to GitHub Pages. In GitHub **Settings → Pages**, choose **GitHub Actions** under *Build and deployment*.

Live URL after a successful deployment: https://simondoescode.github.io/nibblepot/

`vite.config.ts` sets `/nibblepot/` as the production base. Generated JS, CSS, PWA manifest, icons and service worker are scoped to the repository's GitHub Pages path. Builds generate installable 192px and 512px icons from the original pot motif.

## Data and privacy

- `src/data/recipes.json`: edit recipes here. The original 16 meals are preserved.
- `src/data/ingredients.json`: cupboard, fridge, and freezer ingredient catalogue.
- `src/lib/storage.ts`: uses the original `nibblepot-demo-v1` localStorage key, so previous favourites, larder and shopping data survive **on the same browser and origin**. It does **not** sync devices.
- `src/lib/recipes.ts`: search, ingredient matching, surprise-me selection and shopping-list consolidation.
- Tesco links open product searches, **not** the user's basket.
- The app works offline after its first successful installation/load; external Tesco searches need internet.

## Structure

```text
src/
  App.tsx                  App state, interactions and navigation
  components/              Separately testable UI screens, cards and dialog
  data/                    Recipes and ingredient catalogue
  lib/                     Recipe logic and localStorage compatibility
  styles.css               Original playful visual design
public/icons/              PWA and favicon icons
scripts/generate-icons.mjs  Pure Node app-icon generator
```

Recipe timings and ingredient quantities are demo content and should be independently reviewed before publishing as cooking guidance.

## UI system

Our colours, focus and radius tokens live in `src/ui/tokens.css`; reusable buttons and filter chips are in `src/ui/controls.tsx`. The recipe dialog uses Radix Primitives for accessible focus management, dismissal and screen-reader semantics. Lucide provides utility action icons, while Nibblepot's mascot, food artwork and playful colour palette stay custom.

## Settings and refreshing the PWA

Open **Settings** in the desktop or mobile navigation. The page provides a **Refresh app** action, data backup/restore, a summary of local favourites/larder/shopping, and an explicitly confirmed local data reset.

On touch devices, drag down from the top of the page until **Release to refresh** appears. This uses the same PWA refresh operation as the Settings button: check the service worker for an update, allow any waiting worker to activate, then reload the complete app (not only React state). Pulling on inputs or in recipe dialogs won't trigger it. Offline reloads fall back to the cached PWA shell. Saved data stays under the existing localStorage key.

## Illustrated recipe collection

All sixteen recipes use bespoke self-contained SVG artwork in `public/recipes/`, with a shared colour and layout language. Cards and recipe details load the same local file using the GitHub Pages-aware Vite base URL, without external image services or image dependencies. The illustration catalogue is checked by Vitest and Playwright.
