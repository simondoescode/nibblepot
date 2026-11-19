# Social previews

`public/social/simmer-og.jpg` is a 1200×630 JPEG sharing card. Generated with the built-in image generation tool, then resized and JPEG-compressed with Pillow. All text and the final crop were visually inspected.

Prompt: Create a premium editorial Open Graph sharing card for Simmer, a warm UK family dinner recipe and meal planning app. Wide 1.905:1 landscape composition to crop cleanly to 1200x630. Warm ivory paper background, deep forest green #153c32 typography, muted peach accent. Large beautifully typeset exact text 'Simmer' at left, below it exact text 'Dinner, sorted.' and small line 'Simple recipes. Easier weeks.' On the right a restrained appetising photograph of a single simple tomato pasta dinner in a ceramic bowl, low three-quarter view. Minimal elegant cookbook design, ample whitespace and generous safe margins. No extra text, no devices, no watermark.

The four current route-specific cards are `public/social/simmer-shopping-og.jpg`, `public/social/simmer-meal-plan-og.jpg`, `public/social/simmer-recipe-og.jpg` and `public/social/simmer-general-og.jpg`. Full prompts are in `docs/social-card-prompts.json`. Each is 1200×630, below 250 KB and reviewed at 300×157. The earlier `simmer-og.jpg` is retained as a legacy asset.

The build writes Open Graph and Twitter card metadata into the static homepage and generated route HTML, with absolute GitHub Pages image URLs. Recipe pages use the recipe sharing card with their own title and description; Recipe structured data retains the actual recipe food photo. Shared-week links use the meal-plan card: their private URL fragment is not available to social crawlers. A per-week dinner preview would require server-readable storage or generated public pages.

WhatsApp caches previews; old conversations may keep an earlier cached card after deployment. Actual WhatsApp rendering needs checking after deployment.
