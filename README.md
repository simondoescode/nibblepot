# Nibblepot 🍲

**Good grub. Zero faff.** A colourful, installable family recipe-book PWA, with a random dinner button, favourites, a larder, and Tesco search links for missing ingredients.

**Live site (after Pages deployment):** https://simondoescode.github.io/nibblepot/

## Local development

Requires Node.js 20+. No third-party npm dependencies.

```sh
npm ci
npm run check
npm run dev
```

Open http://localhost:4173. `npm run build` generates the deployable static site in `dist/`. `npm test` validates the built output; `npm run check` runs both in order.

## GitHub Pages

The workflow at `.github/workflows/pages.yml`:

- Builds and tests on pull requests to `main`.
- Builds, tests and deploys `dist/` automatically on pushes to `main` (or manual workflow dispatch).
- Uses GitHub's supported Pages artifact/deployment actions; no `gh-pages` branch or personal access token is needed.

**One-time repo setting:** **Settings → Pages → Build and deployment → Source: GitHub Actions**. Then push to `main` / rerun the workflow, and open the live URL above. Pages deployments use repository-relative paths, so the app, icons, manifest, and service worker work under `/nibblepot/`.

## Notes

- Recipes, larder, favourites and shopping list all work in the browser; state is stored in `localStorage`, not synced between devices.
- App shell caches offline after first online visit. Tesco search links still require an internet connection, and do not add products directly to a basket.
- Build generates PNG icons with Node built-ins from the Nibblepot pot motif; SVG favicon is in `src/icons/`.
- This is an MVP demo. Recipe timings and ingredient quantities should be reviewed before publishing as cooking guidance.