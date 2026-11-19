# PR #62 — family recipe artwork status

## Technical status

All **15** generated food images are committed at `public/recipes/<recipe-slug>.webp`, matching the explicit `image` paths in `src/data/recipes.json`.

- [x] 15 distinct WebP file paths
- [x] 800 × 504 pixels, transparent alpha with clear corners
- [x] Each WebP below the 250,000-byte limit
- [ ] Visual editorial approval of every image
- [ ] Full green CI and responsive/mobile image review

These paths use recipe slugs as explicitly configured in the JSON; [IMAGE_STYLE.md](../IMAGE_STYLE.md) describes an ID-based naming convention for future standardisation.

## Six images still needing editorial attention

- [ ] **chicken-veggie-meatballs** — Chicken mince and hidden vegetables are not visually verifiable; extra parmesan garnish
- [ ] **mini-shepherds-pies** — Shows one large pie rather than four individual pies
- [ ] **mild-lamb-koftas** — Extra tomatoes visible with lamb koftas, flatbread and cucumber yoghurt
- [ ] **cheesy-beef-rice-bowls** — Sweetcorn not clearly visible
- [ ] **beef-meatballs-tomato-sauce** — Extra green peas shown despite not being in recipe
- [ ] **creamy-fish-pie** — Fish filling beneath mash cannot be verified visually

## Before merging

Run `npm run check:recipes`, `npm run build`, `npm run test` and `npm run test:e2e`, resolve any failures, inspect all 15 images on mobile and desktop, and confirm PWA offline loading. Keep the PR in draft until the six editorial issues above have been accepted or corrected.

Related issue: #61.
