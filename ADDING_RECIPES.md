# Adding a recipe to Nibblepot (including AI image generation)

Follow this complete checklist for every new meal. Read [IMAGE_STYLE.md](IMAGE_STYLE.md) **before** generating an image and [AGENTS.md](AGENTS.md) when working as an AI agent.

## 1. Check the meal

Nibblepot recipes are cheap, satisfying, recognisable UK family meals with few everyday supermarket ingredients. Avoid duplicates and fussy additions. A recipe must give sensible quantities for **four people**, realistic total prep+cook minutes, and clear, practical instructions. For meat, fish and poultry, make cooking/doneness guidance safe and correct. Do not guess important cooking instructions.

Choose a stable, lower-kebab-case ID (e.g. `lentil-bolognese`). **Never change existing IDs**: favourites and shopping items are saved under those IDs in localStorage.

## 2. Add or reuse ingredients

Check `src/data/ingredients.json`; use existing ingredient IDs where possible. Add any genuinely missing ingredient using the existing `Cupboard`, `Fridge` or `Freezer` categories:

```json
"red-lentils": ["Red lentils", "Cupboard"]
```

Each recipe `ing[].id` must refer to a real catalogue ingredient; these IDs power search, the larder, shopping list and Tesco product searches.

## 3. Add the recipe JSON

Append an object to `src/data/recipes.json` (valid JSON, with commas between recipes). Example structure; **review recipe quantities, steps and total time before publishing**:

```json
{
  "id": "lentil-bolognese",
  "title": "Easy lentil bolognese",
  "description": "A filling cupboard-friendly tea.",
  "emoji": "🍝",
  "color": "#eacaa9",
  "mins": 35,
  "ing": [
    { "id": "red-lentils", "qty": "200g dry" },
    { "id": "pasta", "qty": "350g dry" },
    { "id": "chopped-tomatoes", "qty": "2 tins" },
    { "id": "onion", "qty": "1" },
    { "id": "garlic", "qty": "2 cloves" }
  ],
  "steps": [
    "Soften the chopped onion and garlic in a pan.",
    "Add lentils, tomatoes and enough liquid to cook the lentils fully; stir, simmer and top up liquid as needed.",
    "Cook pasta according to the pack and serve with the lentil sauce."
  ],
  "onePot": false,
  "image": "recipes/lentil-bolognese.webp"
}
```

`image` is optional for existing recipes that already have `public/recipes/<id>.svg`; new recipes should have a dedicated WebP. Keep `emoji` and `color` for compatibility, even though the food cards use a dedicated image.

## 4. Generate the food image

**One recipe = one isolated AI image. No collage.**

1. Open [IMAGE_STYLE.md](IMAGE_STYLE.md) and copy the **AI image generation prompt**.
2. Substitute the new recipe's *real visible ingredients* and correct bowl, pot, baking dish or plate. Example: “Lentil bolognese, no meat, tomato-and-lentil sauce over pasta in a simple warm-white bowl.”
3. Request a premium natural editorial photo, **low three-quarter side view**, slightly muted saturation, soft daylight, **real transparent alpha**, no background/scene, no text, no accessories.
4. Check the output carefully. A generator may fake transparency with solid white or a checkerboard; remove the background properly or regenerate it. Reject food that doesn't match the recipe, over-garnished or shiny CGI-looking dishes, and clipped plates.
5. Export **800×504 transparent WebP** (quality ~75–82); aim for **80–180 KB** and absolutely **no more than 250,000 bytes**.
6. Commit it at `public/recipes/lentil-bolognese.webp` and set `"image": "recipes/lentil-bolognese.webp"` in the JSON.

If the agent has no image-generation capability, **do not fabricate a file or claim success**. Flag the recipe as blocked on imagery until a real approved image or SVG fallback is supplied.

## 5. Verify everything

```sh
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

Manually confirm desktop and mobile cards, the enlarged recipe dialog, 404-free image loading from `/nibblepot/recipes/<id>.webp`, genuine alpha over the Nibblepot card surface, local offline display after cache priming, and no layout shift. Check search, Surprise Me, ingredient counts, larder matching, shopping links and favourites after reload. New recipes must not break existing saved favourites. Update fixed-count tests when intentionally changing the recipe count.

CI checks local image files, WebP signatures and the **250,000-byte** size cap. A CI pass does not verify artistic quality or transparency: inspect those separately.

## 6. Ship

Commit recipe JSON + ingredient updates + optimised WebP + relevant tests together. Open a PR, fix failures, merge after CI is green, and verify GitHub Pages deployment. Installed PWA users can use **Settings → Refresh app** to load newer artwork.

**Definition of done:** a real, cookable family recipe with correct ingredient IDs, consistent premium food image, quick loading and preserved functionality.