# Nibblepot image style guide

**Creative direction:** premium, minimal, editorial food photography — real, appetising family food, not glossy AI advertising. This is the required brief for every new AI-generated food image. Existing SVGs remain valid fallbacks until replaced individually.

## Look and composition

- **View:** low three-quarter, more side-on than overhead, about **20–30° above table level**. Show depth, the front of the food and the side/rim of the plate or casserole.
- **Food:** one recognisable finished portion from the recipe, prepared with its actual ingredients. Honest UK family cooking, not restaurant plating or exaggerated fine dining.
- **Backdrop:** **genuinely transparent alpha**, not a white backdrop, coloured backdrop, gradient, table, studio scene or checkerboard baked into pixels. A very subtle contact shadow belonging to the cutout is okay.
- **Framing:** complete serving vessel in frame with **10–12% clear padding**. Centre the visual mass just below the middle. Avoid clipping at narrower mobile card crops.
- **Colour:** restrained natural saturation, warm-neutral white balance, realistic browns/greens, gentle contrast. Never neon orange, saturated red sauces, HDR sheen or plasticky CGI.
- **Light:** soft diffused natural daylight, usually from upper-left; good readable texture with controlled highlights.
- **Tableware:** simple matte/satin off-white stoneware, neutral ceramics or restrained muted enamel. Only a vessel needed to present the dish; no cutlery or styling props.
- **Garnish:** minimal and recipe-accurate. No random parsley or cherry tomatoes where they don't belong.
- **No text, logos, badges, people, hands, extra food props, frames, collages, borders or multiple viewpoints.**

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

> A single finished serving of **[RECIPE TITLE]**, accurately containing **[VISIBLE INGREDIENTS]**, served in **[SIMPLE SPECIFIC DISH/PLATE]**. Contemporary British editorial food photography, photorealistic, natural, understated and premium. Camera at a low front three-quarter side angle about 25 degrees above the table, not overhead; full plate or dish visible with generous clear margins. Soft diffused daylight from the upper left, realistic subtle textures, gentle shadows, refined colour grading with muted natural saturation. **Isolated food cutout on an actual transparent alpha background, absolutely no surface, environment or studio backdrop.** One serving only. No props, cutlery, people, text, logos, borders, collage, exaggerated garnish, overly glossy sauce, fluorescent saturation or artificial 3D look.

For jacket potatoes & beans, for example: a crisp-skinned split baked potato filled with baked beans and a **modest** amount of cheddar, on a plain off-white plate. Maintain the above angle, lighting, alpha and restraint.

**Generate separately for each recipe.** Do not prompt for a 10-dish grid and then crop it: scale and transparency become inconsistent. Asking for alpha does not guarantee the model delivers alpha. Reject nontransparent renders or properly remove the background before export.

## Export and quality gate

1. Compare the AI image with the actual recipe JSON: no extra or missing main ingredients.
2. Open over a checkerboard in an editor and inspect the **alpha channel**, including all four corners. Fake checkerboard and a white/black matte fail.
3. Prepare an **800×504** transparent canvas with 10–12% padding. Do not distort the food or crop off the plate.
4. Export WebP with transparency, quality around 80, sRGB, metadata stripped. Adjust compression to stay below 250,000 bytes.
5. Inspect at mobile size and in the full recipe dialog: crisp edges, believable food, enough negative space, no excessive shadows.
6. Save `public/recipes/<id>.webp`, add `"image": "recipes/<id>.webp"` to that recipe and run the tests described in [ADDING_RECIPES.md](ADDING_RECIPES.md).
7. Compare against at least three other Nibblepot images for consistent angle, scale, colour and realism.

Optional ImageMagick example **when the source already has real alpha** (confirm scaling/padding manually):

```sh
magick input.png -resize 800x504 -background none -gravity center -extent 800x504 -strip -quality 80 public/recipes/example.webp
```

This is an example, not an automatic quality guarantee; `-resize` alone may not give ideal margins. **Never flatten transparency** for the final WebP.

## UI requirements

The image contains food **only**. Time badges, favourite hearts, card background and titles belong to the UI. Use the same local image in cards and recipe details, reserve intrinsic size, lazy-load card images and keep the PWA offline capable. No external image CDN or root-relative `/recipes/` URLs.

**Reject images that feel corny, hyper-saturated or like a generic AI food advert.** Negative space and believable textures matter more than visual noise.