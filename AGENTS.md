# Nibblepot agent instructions

**Project:** a playful, colourful, no-fuss UK family recipe PWA, built with React + Vite + TypeScript, custom CSS, Radix accessible dialogs and Lucide utility icons.

## Mandatory guides

- **Food image generation, optimisation, or replacement:** read [IMAGE_STYLE.md](IMAGE_STYLE.md) first. Use real transparent **800×504 WebP** cutouts at a low three-quarter angle, restrained saturation, and a **250,000-byte maximum**.
- **Adding or editing recipes:** follow [ADDING_RECIPES.md](ADDING_RECIPES.md), including generating and checking the food image.
- **Architecture/deployment:** refer to [README.md](README.md), `src/types.ts`, `src/ui/tokens.css` and `src/styles/recipe-refresh.css`.

## Non-negotiable guardrails

- Keep the recognisable Nibblepot art direction: warm, minimal, characterful; not generic AI UI or a large design-system migration.
- Keep the static, offline-capable PWA and the GitHub Pages **`/nibblepot/`** base path; use `import.meta.env.BASE_URL` for local images.
- Preserve recipe IDs, `nibblepot-demo-v1` localStorage data, favourites, larder, shopping and working refresh controls.
- Use the existing JSON recipe and ingredient models. Keep ingredients and instructions accurate; don't hallucinate food quantities, allergens or food-safety rules.
- Generate **one recipe image per request**, never multi-dish grids for final images. Check alpha, image content, visual quality, physical byte size and mobile crop before committing.
- Existing SVGs are fallbacks; new WebP images are optional via the recipe `image` field. Avoid external image CDNs and large source PNGs under `public/`.
- Prefer small, reviewed changes. Maintain keyboard accessibility and responsive behaviour.

## Before merge

Run `npm run build`, `npm test` and `npm run test:e2e` for UI/image changes; ensure the CI workflow passes. Do not claim generation, merge, successful deployment or real alpha unless independently verified.