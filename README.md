# Nibblepot 🍲

**Good grub. Zero faff.** A colourful, installable family recipe book with 16 recipes, a surprise-me button, favourites, larder, ingredient matching, and Tesco shopping links.

## Stack

React 19, Vite, TypeScript, custom CSS, `vite-plugin-pwa`, Vitest and Playwright. Static-hosted on GitHub Pages. No backend, authentication, tracking or runtime API required.

## Get started

Requires Node.js 22.12+.

```sh
npm install
npm run dev
```

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
