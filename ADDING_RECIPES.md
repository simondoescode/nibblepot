# Adding a recipe to Simmer

## 1. Check the recipe and ingredients

Check [the recipe catalogue](src/data/recipes.json) for an existing version. Choose a short, unique, lower-kebab-case ID such as `lentil-bolognese`. Keep existing IDs stable because favourites, shopping lists and meal plans refer to them.

Write the recipe for four servings. Include prep time in the total, name the ingredients clearly and give cooking times and signs of doneness in the method. Simmer scales the ingredient list when servings change, so keep quantities out of the steps unless they are needed for a technique or a safety instruction.

Reuse IDs from [the ingredient catalogue](src/data/ingredients.json) so the recipe matches ingredients already in the larder. For a genuinely new ingredient, add an entry such as `"red-lentils": ["Red lentils", "Cupboard"]`. Choose `Cupboard`, `Fridge` or `Freezer`. The catalogue name is also used for shopping and Tesco searches.

## 2. Add the recipe to the catalogue

Append one object to the JSON array in [src/data/recipes.json](src/data/recipes.json). This example uses existing ingredient IDs. Replace the sample review date with the date you checked your recipe.

```json
{
  "id": "lentil-bolognese",
  "title": "Easy lentil bolognese",
  "description": "Red lentils simmered in a simple tomato sauce.",
  "emoji": "🍝",
  "color": "#eacaa9",
  "mins": 35,
  "ing": [
    { "id": "red-lentils", "qty": "200 g" },
    { "id": "pasta", "qty": "350 g" },
    { "id": "chopped-tomatoes", "qty": "2 tins" },
    { "id": "onion", "qty": "1" },
    { "id": "garlic", "qty": "2 cloves" },
    { "id": "oil", "qty": "1 tbsp" },
    { "id": "cheese", "qty": "40 g", "optional": true }
  ],
  "steps": [
    "Rinse the lentils. Finely chop the onion and garlic, then soften the onion in the oil over medium heat for 5 minutes. Add the garlic and stir for 30 seconds.",
    "Add the lentils, tomatoes and 400 ml water. Simmer gently for 20–25 minutes until the lentils are tender, stirring occasionally and adding a splash of water if the sauce gets too thick.",
    "While the sauce simmers, cook the pasta according to the packet. Drain and serve with the lentil sauce and grated cheese, if using."
  ],
  "onePot": false,
  "safety": "Cook the lentils until tender and serve the sauce piping hot throughout.",
  "storage": "Cool and refrigerate within two hours. Eat within 48 hours or freeze. Reheat only once, until steaming hot throughout.",
  "reviewedOn": "2026-11-08",
  "image": "recipes/lentil-bolognese.webp"
}
```

- **Quantities** use a number followed by a unit the app can scale, such as `250 g`, `500 ml`, `2 tins` or `0.5 tsp`. Use decimal fractions in JSON. Simmer formats them for display. See [the quantity parser](src/lib/quantities.ts) for supported units.
- **Optional ingredients** use `"optional": true` for toppings and seasonings the dish can do without. Required ingredients drive larder matching.
- **One-pot meals** use `"onePot": true` when the entire meal cooks in one pot.
- **Safety and storage** appear on the recipe page and in Cooking Mode. Use guidance that fits the dish, including the separate rules for cooked rice when it applies. See the [Food Standards Agency's cooking guidance](https://www.gov.uk/government/publications/cooking-your-food/cooking-your-food).

## 3. Add a food photo

Use the prompt in [IMAGE_STYLE.md](IMAGE_STYLE.md) to generate a single photo of the finished dish with its actual visible ingredients. Export it as an **800 × 504 WebP with real transparency**. Check the full dish fits inside the frame, the corners have zero alpha and the file is under 250,000 bytes.

Save it to `public/recipes/<id>.webp` and set `"image": "recipes/<id>.webp"` in the recipe. This relative path lets the same image load on GitHub Pages and in the offline app.

## 4. Check and publish

Update any fixed catalogue counts in [the recipe tests](tests/recipes.test.ts), [the quality gate](tests/recipeQuality.test.ts) and [browser tests](e2e/). Keep the tests for existing recipe IDs and their artwork.

```sh
npm ci --legacy-peer-deps
npx playwright install chromium
npm run check
npm run preview
```

Open `/nibblepot/` in the preview and find the recipe by title and by a distinctive ingredient. Open `/nibblepot/recipes/<id>/` directly and check the photo and method on a phone-width and a desktop viewport. Try changing servings, adding missing ingredients to Shopping, saving to Favourites and opening Cooking Mode. Check the new photo still loads offline after the service worker has finished caching.

Open a pull request with the recipe, any catalogue entries, the photo and the test updates. Merge after CI passes, then verify the direct recipe URL and photo on the deployed site. In the installed app, **Settings → Refresh app** loads the new release.
