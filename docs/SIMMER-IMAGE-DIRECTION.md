# Simmer — image direction and production workflow

## Art direction
A premium, welcoming family-dinner editorial photograph. The **food is the hero**: one recognisable cooked recipe, realistic portions, warm daylight, ceramic plates or bowls, modest props, rich appetising textures. Use a subtle navy/forest-green woven tartan tablecloth in *some* shots as a visual signature, never a distracting background across the app. Do not bake labels, text, watermarks, people or logos into photographs.

## Reusable image-generation brief
> Editorial food photograph of [RECIPE TITLE], made with [KEY INGREDIENTS], realistic and appetising family dinner served in a handmade ceramic [BOWL/PLATE], overhead-to-three-quarter camera angle, warm soft natural window light, tactile linen and a restrained navy/forest-green woven tablecloth accent, authentic textures, natural food styling, premium modern cookbook aesthetic. Composition: food prominent in the **right or central two-thirds**, darker visually calm area on the left/bottom for white UI text overlay. No writing, no logos, no illustration, no extra dishes, no people. Landscape 16:10, sharp detailed food, believable portions.

Use real recipe ingredients; never show foods not in the recipe that could misrepresent allergens or preparation. Manually review each result against the actual recipe.

## Asset specification
- Preferred: 1200×750 AVIF or WebP, plus 800×500 and 480×300 responsive derivatives when the component supports srcset. Keep a JPEG fallback if needed.
- Aim for <150 KB on mobile hero, <250 KB on desktop hero; visual quality and text contrast take precedence over arbitrary byte targets.
- Save assets under `public/recipes/<recipe-id>.webp`; set the existing recipe `image` field to `recipes/<recipe-id>.webp`. Do not change recipe IDs or storage keys.
- Keep the existing local `public/recipes/<recipe-id>.svg` illustration as fallback for missing/failed images and offline use.
- Maintain image provenance (generated vs licensed, model/source, creation date, reviewer) in an asset ledger. Do not import web imagery without suitable reuse rights.
- Hero image: eager loading/high priority only for current recipe; non-hero cards lazy-load. Maintain dimensions/aspect ratio and apply a dark gradient for overlay contrast.
- Test cropping on 320, 360, 390, 768 and 1280px widths; ensure dish stays visible and title remains readable.
- Avoid auto-rotation; navigation is swipe, arrows or Surprise me. Respect reduced motion.

## Review checklist
1. Recipe pictured is identifiable and ingredients plausible.
2. Food is appealing on both dark and light displays.
3. No illegible text on top of the photograph at any crop.
4. Files are compressed and served locally for PWA offline caching.
5. Image failure retains the SVG fallback; no blank hero.
6. User favourites, planner and shopping list remain unchanged.
