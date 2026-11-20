# Nibblepot image style guide

**Creative direction.** Photograph everyday family dinners with the clarity of a restaurant menu. Each image shows one recognisable serving, with enough detail to tell dishes apart at thumbnail size.

The reference is the individual food photography across [Wagamama’s UK menu](https://www.wagamama.com/menu). The small sauce bowls read by colour and surface texture. The children’s katsu plates repeat their composition so the change of sauce is immediately visible. Upright juice glasses read by silhouette. Apply that discipline to Nibblepot’s own recipes and crockery.

## Choose the shot before writing the prompt

| Menu reference | Direction for Nibblepot |
| --- | --- |
| Festive | Let a seasonal ingredient identify the dish. Show it where it is actually served, such as cranberry sauce over a cutlet. |
| Lunch time | For a wrap, turn one cut end towards the lens. For a lunch box, shoot overhead and show the whole arrangement in a single vessel. |
| Sides | Group a believable serving on a small plate. Leave enough separation to read the shape of a wedge, dumpling or skewer. |
| The main event | Shoot bowls and plated dinners overhead. Let rice, sauce and protein meet naturally, leaving enough of each visible to identify the meal. For a mixed dish such as sausage and bean casserole, bring a piece of sausage and a few beans to the surface. |
| Extras | Use a close overhead view of one small ramekin. Let the swirl of a thick sauce, the sheen of a pickle or the cut edge of a chilli carry the image. |
| Desserts and sweet treats | Use overhead for a distinctive top or drizzle. Lower the camera for a slice whose crumb, filling or layers identify it. Choose a plate that separates the dessert’s edges from the rim. |
| Drinks | Shoot a single glass near eye level, with a slight view of the rim. Keep its base in frame, verticals straight, and a narrow highlight on the glass. |
| Kids | Show the smaller serving. Keep recognisable components in loose groups and include a small sauce pot only when served separately in the recipe. |
| Gluten free | Follow the same composition as the corresponding dish. Show substitutions that change its appearance and leave dietary labels to the interface. |

For related recipes, lock the vessel, orientation, camera height and apparent serving size. Let the actual difference between the recipes be visible in the same part of the frame. For example, shoot two jacket potato fillings on the same plate with the split potato facing the same way.

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

> Create one photorealistic menu photograph of **[RECIPE TITLE]**. Show one realistic home-cooked serving containing **[VISIBLE INGREDIENTS AND RECIPE ACCOMPANIMENTS]** on **[SIMPLE MATTE VESSEL]**. Use **[ANGLE FROM THE SHOT GUIDE: OVERHEAD / HIGH THREE-QUARTER / NEAR EYE LEVEL FOR DRINKS]** to make **[DEFINING INGREDIENT, FILLING OR TEXTURE]** easy to see. Frame the complete vessel with 10–12% clear space and centre it by visual weight. Use soft directional light from the upper left, natural ingredient colours, believable cooking textures and a short, soft contact shadow if needed. Isolate the vessel and food on genuine transparent alpha. Exclude surfaces, props, extra accompaniments, lettering, borders and artificial gloss.

For jacket potatoes and beans, use an overhead view of a split baked potato on a warm off-white plate. Show the crisp skin and spooned-in beans. Add a modest amount of grated cheddar only if the recipe includes it. For a filled wrap, use a high three-quarter view and face the cut end towards the camera.

**Generate separately for each recipe.** Do not prompt for a 10-dish grid and then crop it: scale and transparency become inconsistent. Asking for alpha does not guarantee the model delivers alpha. Reject nontransparent renders or properly remove the background before export.

## Export and quality gate

1. Compare the AI image with the actual recipe JSON: no extra or missing main ingredients.
2. Open over a checkerboard in an editor and inspect the **alpha channel**, including all four corners. Fake checkerboard and a white/black matte fail.
3. Prepare an **800×504** transparent canvas with 10–12% padding. Do not distort the food or crop off the plate.
4. Export WebP with transparency, quality around 80, sRGB, metadata stripped. Adjust compression to stay below 250,000 bytes.
5. Hide the title and preview at roughly 100 px wide. A viewer should be able to pick out the defining ingredient or shape. Check for white fringes, clipped rims and shadows that make the vessel float. Inspect at mobile card size and in the full recipe view. Check that the main ingredient is recognisable, the full dish fits the crop, and the edges and shadow look clean over light and dark backgrounds.
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