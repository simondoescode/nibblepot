# PR #62 — remaining food artwork

The data/schema migration is now done, but **the original 15 food photos have not been generated**.

Before merging, create a *distinct*, visually accurate and transparent 800 × 504 WebP photo for each recipe, observing [IMAGE_STYLE.md](../IMAGE_STYLE.md). Use real alpha and less than 250,000 bytes per file; check crops on mobile.

- [ ] `public/recipes/creamy-chicken-broccoli-rice.webp`
- [ ] `public/recipes/sticky-honey-garlic-chicken.webp`
- [ ] `public/recipes/mild-chicken-sweet-potato-curry.webp`
- [ ] `public/recipes/chicken-veggie-meatballs.webp`
- [ ] `public/recipes/mini-shepherds-pies.webp`
- [ ] `public/recipes/mild-lamb-koftas.webp`
- [ ] `public/recipes/lamb-sweet-potato-stew.webp`
- [ ] `public/recipes/hidden-veg-beef-bolognese.webp`
- [ ] `public/recipes/cheesy-beef-rice-bowls.webp`
- [ ] `public/recipes/beef-potato-hotpot.webp`
- [ ] `public/recipes/beef-meatballs-tomato-sauce.webp`
- [ ] `public/recipes/salmon-potato-fishcakes.webp`
- [ ] `public/recipes/creamy-fish-pie.webp`
- [ ] `public/recipes/homemade-fish-fingers-wedges.webp`
- [ ] `public/recipes/creamy-salmon-pea-pasta.webp`

Once images are committed, run `npm run check:recipes`, `npm run build`, `npm run test` and `npm run test:e2e`. Verify direct recipe pages, favourites, larder, shopping, planner and offline images in a browser. Only then take this PR out of draft and merge it.
