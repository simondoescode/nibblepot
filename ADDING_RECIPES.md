# Adding a recipe to Simmer

## 1. Check the recipe and ingredients

Check [the recipe catalogue](src/data/recipes.json) for an existing version. Choose a unique, permanent **four-character lowercase alphanumeric ID** such as `g4p2` and a separate descriptive slug such as `garlic-butter-pea-pasta`. Recipe pages use the slug; favourites, shopping lists, meal plans and shared snapshots use the ID.

Write the recipe for four servings. Include prep time in the total, name the ingredients clearly and give cooking times and signs of doneness in the method. Simmer scales the ingredient list when servings change, so keep quantities out of the steps unless they are needed for a technique or a safety instruction.

Reuse IDs from [the ingredient catalogue](src/data/ingredients.json) so the recipe matches ingredients already in the larder. For a genuinely new ingredient, add an entry such as `"red-lentils": ["Red lentils", "Cupboard"]`. Choose `Cupboard`, `Fridge` or `Freezer`. The catalogue name is also used for shopping and Tesco searches.

## 2. Add the recipe to the catalogue

Append one object to the JSON array in [src/data/recipes.json](src/data/recipes.json). This example uses existing ingredient IDs. Replace the sample review date with the date you checked your recipe.

```json
{
  "id": "g4p2",
  "slug": "garlic-butter-pea-pasta",
  "title": "Garlic butter pea pasta",
  "description": "A quick pasta with sweet peas and garlic butter.",
  "emoji": "🍝",
  "color": "#eacaa9",
  "mins": 20,
  "prepMins": 5,
  "cookMins": 15,
  "tags": ["budget", "kid-friendly", "minimal-prep"],
  "ing": [
    { "id": "pasta", "amount": 350, "unit": "g" },
    { "id": "frozen-peas", "amount": 200, "unit": "g" },
    { "id": "butter", "amount": 40, "unit": "g" },
    { "id": "garlic", "amount": 2, "unit": "clove" },
    { "id": "cheese", "amount": 40, "unit": "g", "optional": true }
  ],
  "steps": [
    "Cook the pasta according to the packet. Add the frozen peas for the final few minutes, following the packet instructions for the peas.",
    "Scoop out a mug of pasta water, then drain the pasta and peas. Melt the butter in the empty pan over medium-low heat and stir the finely chopped garlic for 30 seconds.",
    "Return the pasta and peas to the pan with a splash of pasta water. Toss until coated and piping hot, then serve with grated cheese if using."
  ],
  "onePot": true,
  "safety": "Cook the frozen peas according to the packet and serve the dish steaming hot throughout.",
  "storage": "Cool and refrigerate within two hours. Eat within 48 hours or freeze. Reheat only once, until steaming hot throughout.",
  "reviewedOn": "2026-11-08",
  "image": "recipes/garlic-butter-pea-pasta.webp"
}
```

- **Quantities** use numeric `amount` and canonical `unit` (`g`, `ml`, `tin`, `slice`, `clove`, etc.). Use decimal fractions. Simmer formats these for display and scales from four servings. `npm run check:recipes` enforces supported units.
- **Optional ingredients** use `"optional": true` for toppings and seasonings the dish can do without. Required ingredients drive larder matching.
- **One-pot meals** use `"onePot": true` when the entire meal cooks in one pot.
- **Safety and storage** appear on the recipe page and in Cooking Mode. Use guidance that fits the dish, including the separate rules for cooked rice when it applies. See the [Food Standards Agency's cooking guidance](https://www.gov.uk/government/publications/cooking-your-food/cooking-your-food).

## 3. Add a food photo

Use the prompt in [IMAGE_STYLE.md](IMAGE_STYLE.md) to generate a single photo of the finished dish with its actual visible ingredients. Export it as an **800 × 504 WebP with real transparency**. Check the full dish fits inside the frame, the corners have zero alpha and the file is under 250,000 bytes.

Save it to `public/recipes/<slug>.webp` and set `"image": "recipes/<slug>.webp"` in the recipe. This relative path lets the same image load on GitHub Pages and in the offline app.

## 4. Check and publish

Update any fixed catalogue counts in [the recipe tests](tests/recipes.test.ts), [the quality gate](tests/recipeQuality.test.ts) and [browser tests](e2e/). Keep existing four-character IDs stable and verify artwork paths separately.

```sh
npm ci --legacy-peer-deps
npx playwright install chromium
npm run check
npm run preview
```

Open `/nibblepot/` in the preview and find the recipe by title and by a distinctive ingredient. Open `/nibblepot/recipes/<slug>/` directly and check the photo and method on a phone-width and a desktop viewport. Try changing servings, adding missing ingredients to Shopping, saving to Favourites and opening Cooking Mode. Check the new photo still loads offline after the service worker has finished caching.

Open a pull request with the recipe, any catalogue entries, the photo and the test updates. Merge after CI passes, then verify the direct recipe URL and photo on the deployed site. In the installed app, **Settings → Refresh app** loads the new release.
