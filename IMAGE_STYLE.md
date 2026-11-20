# Nibblepot image style guide

**Creative direction.** Photograph everyday family dinners with the clarity of a restaurant menu. Each image shows one recognisable serving, with enough detail to tell dishes apart at thumbnail size.

[Wagamama’s festive menu](https://www.wagamama.com/menu?category=festive) is the reference for the individual dish cards. The overhead katsu plates show the rice, curry and salad clearly, and the wrap cards show the filling through the cut end. The complete silhouettes read against both dark cards and the light hover state.

## Look and composition

- **Camera angle.** Default to overhead (approximately 80–90° above the table) for plated meals, pasta, rice dishes and bowls whose toppings identify the recipe. Use a high three-quarter angle (45–60°) when a wrap’s filling, a pie’s layers or a tall serving needs depth to read. Use one viewpoint per image.
- **Food.** Style one realistic serving with the ingredients and accompaniments called for in the recipe. Arrange them loosely so the main ingredient is easy to pick out. Keep craggy crumbs, browned edges and the natural variation in cooked food.
- **Tableware.** Choose a simple matte plate, bowl or dish that fits the recipe. Use warm off-white, stone or muted charcoal where it gives the food a clear edge. Show the full vessel with 10–12% clear padding around it and centre the dish by its visual weight.
- **Lighting and colour.** Use soft directional studio light from the upper left, with enough contrast to see texture and enough fill to retain details in dark food. Keep the white balance neutral to warm and let the real ingredient colours provide the accents. Allow a short, soft contact shadow close to the vessel.
- **Background.** Use genuine transparent alpha. Keep the food and its vessel isolated from any table, gradient, coloured backdrop or baked-in checkerboard. Use clean edges that hold up over both light and dark cards.
- **Styling.** Include garnish only when the recipe calls for it. Keep table linens, cutlery, hands, seasonal props, typography, logos, badges and borders out of the asset.

## Technical export specification

| Setting | Requirement |
| --- | --- |
| File | **WebP with real alpha transparency**, RGB in sRGB colour space |
| Canvas | **800 × 504 px**, landscape aspect ratio matching current recipe art |
| Typical WebP export | Quality **75–82**, tune visually; strip EXIF and unnecessary metadata |
| Target compressed size | **80–180 KB** per image, prefer under 200 KB |
| Hard maximum | **250,000 bytes**; CI test rejects larger WebPs |
| Naming | `public/recipes/<recipe-id>.webp`, where `<recipe-id>` is the stable recipe ID |
| Canvas padding | **10–12%** around the complete serving and any subtle shadow |
| Runtime | Load via Vite `import.meta.env.BASE_URL` (GitHub Pages path `/nibblepot/`) |
| Legacy fallback | `public/recipes/<recipe-id>.svg` when no `image` field exists |

Do not commit huge generated PNGs as production assets. WebP lossy *with alpha* usually gives a better size/quality balance for photorealistic food cutouts. Confirm final dimensions, file bytes, actual alpha and how each image looks at small mobile card size. Sixteen images at 80–180 KB each total roughly **1.3–2.9 MB**.

## AI image generation prompt (one dish at a time)

> Create one photorealistic menu photograph of **[RECIPE TITLE]**. Show one realistic home-cooked serving containing **[VISIBLE INGREDIENTS AND RECIPE ACCOMPANIMENTS]** on **[SIMPLE MATTE VESSEL]**. Use **[OVERHEAD 80–90° / HIGH THREE-QUARTER 45–60°]** to make **[DEFINING INGREDIENT, FILLING OR TEXTURE]** easy to see. Frame the complete vessel with 10–12% clear space and centre it by visual weight. Use soft directional light from the upper left, natural ingredient colours, believable cooking textures and a short, soft contact shadow if needed. Isolate the vessel and food on genuine transparent alpha. Exclude surfaces, props, extra accompaniments, lettering, borders and artificial gloss.

For jacket potatoes and beans, use an overhead view of a split baked potato on a warm off-white plate. Show the crisp skin and spooned-in beans. Add a modest amount of grated cheddar only if the recipe includes it. For a filled wrap, use a high three-quarter view and face the cut end towards the camera.

**Generate separately for each recipe.** Do not prompt for a 10-dish grid and then crop it: scale and transparency become inconsistent. Asking for alpha does not guarantee the model delivers alpha. Reject nontransparent renders or properly remove the background before export.

## Export and quality gate

1. Compare the AI image with the actual recipe JSON: no extra or missing main ingredients.
2. Open over a checkerboard in an editor and inspect the **alpha channel**, including all four corners. Fake checkerboard and a white/black matte fail.
3. Prepare an **800×504** transparent canvas with 10–12% padding. Do not distort the food or crop off the plate.
4. Export WebP with transparency, quality around 80, sRGB, metadata stripped. Adjust compression to stay below 250,000 bytes.
5. Inspect at mobile card size and in the full recipe view. Check that the main ingredient is recognisable, the full dish fits the crop, and the edges and shadow look clean over light and dark backgrounds.
6. Save `public/recipes/<id>.webp`, add `"image": "recipes/<id>.webp"` to that recipe and run the tests described in [ADDING_RECIPES.md](ADDING_RECIPES.md).
7. Compare against at least three other Nibblepot images for consistent scale, lighting, colour and realism. Check that the chosen angle shows what makes the dish recognisable.

Optional ImageMagick example **when the source already has real alpha** (confirm scaling/padding manually):

```sh
magick input.png -resize 800x504 -background none -gravity center -extent 800x504 -strip -quality 80 public/recipes/example.webp
```

This is an example, not an automatic quality guarantee; `-resize` alone may not give ideal margins. **Never flatten transparency** for the final WebP.

## UI requirements

The image contains food **only**. Time badges, favourite hearts, card background and titles belong to the UI. Use the same local image in cards and recipe details, reserve intrinsic size, lazy-load card images and keep the PWA offline capable. No external image CDN or root-relative `/recipes/` URLs.

**Reject images that feel corny, hyper-saturated or like a generic AI food advert.** Negative space and believable textures matter more than visual noise.