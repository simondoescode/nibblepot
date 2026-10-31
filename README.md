# Nibblepot 🍲

**Good grub. Zero faff.** A colourful, installable family recipe book with 16 recipes, a surprise-me button, favourites, larder, ingredient matching, and Tesco shopping links.

## Stack

React 19, Vite, TypeScript, custom CSS, `vite-plugin-pwa`, Vitest and Playwright. Static-hosted on GitHub Pages. No backend, authentication, tracking or runtime API required.

## Get started

Requires Node.js 22.12+.

```sh
npm ci
npm run dev
```

Open http://localhost:5173/nibblepot/ in development. The base path stays the same in preview and on GitHub Pages.

Commands:

- `npm run build`: TypeScript check and production build to `dist/`.
- `npm run test`: recipe, larder, shopping and storage unit tests.
- `npm run test:e2e`: desktop and mobile Chromium smoke tests (install with `npx playwright install chromium` first).
- `npm run check`: run all three above.

## Deploy

The GitHub Actions workflow runs on PRs and `main`. It tests the app first, then deploys the build output to GitHub Pages. In GitHub **Settings → Pages**, choose **GitHub Actions** under *Build and deployment*.

Live URL after a successful deployment: https://simondoescode.github.io/nibblepot/

`vite.config.ts` sets `/nibblepot/` as the production base. Generated JS, CSS, PWA manifest, icons and service worker are scoped to the repository's GitHub Pages path. Builds generate installable 192px and 512px icons from the original pot motif.

## Data and privacy

- `src/data/recipes.json`: edit recipes here. The original 16 meals are preserved.
- `src/data/ingredients.json`: cupboard, fridge, and freezer ingredient catalogue.
- `src/lib/storage.ts`: uses the original `nibblepot-demo-v1` localStorage key, so previous favourites, larder and shopping data survive **on the same browser and origin**. It does **not** sync devices.
- `src/lib/recipes.ts`: search, ingredient matching, surprise-me selection and shopping-list consolidation.
- Tesco links open product searches, **not** the user's basket.
- The app works offline after its first successful installation/load; external Tesco searches need internet.

## Structure

```text
src/
  App.tsx                  App state, interactions and navigation
  components/              Separately testable UI screens, cards and dialog
  data/                    Recipes and ingredient catalogue
  lib/                     Recipe logic and localStorage compatibility
  styles.css               Original playful visual design
public/icons/              PWA and favicon icons
scripts/generate-icons.mjs  Pure Node app-icon generator
```

Recipe timings and ingredient quantities are demo content and should be independently reviewed before publishing as cooking guidance.

## UI system

Our colours, focus and radius tokens live in `src/ui/tokens.css`; reusable buttons and filter chips are in `src/ui/controls.tsx`. The recipe dialog uses Radix Primitives for accessible focus management, dismissal and screen-reader semantics. Lucide provides utility action icons, while Nibblepot's mascot, food artwork and playful colour palette stay custom.

## Settings and refreshing the PWA

Open **Settings** in the desktop or mobile navigation. The page provides a **Refresh app** action, data backup/restore, a summary of local favourites/larder/shopping, and an explicitly confirmed local data reset.

On touch devices, drag down from the top of the page until **Release to refresh** appears. This uses the same PWA refresh operation as the Settings button: check the service worker for an update, allow any waiting worker to activate, then reload the complete app (not only React state). Pulling on inputs or in recipe dialogs won't trigger it. Offline reloads fall back to the cached PWA shell. Saved data stays under the existing localStorage key.

## Illustrated recipe collection

All sixteen recipes use bespoke self-contained SVG artwork in `public/recipes/`, with a shared colour and layout language. Cards and recipe details load the same local file using the GitHub Pages-aware Vite base URL, without external image services or image dependencies. The illustration catalogue is checked by Vitest and Playwright.

## Adding recipes and generating images

- [IMAGE_STYLE.md](IMAGE_STYLE.md): premium food-cutout style, real transparent alpha, low three-quarter angle, **800×504 WebP**, target 80–180 KB, hard cap **250,000 bytes**, and a copyable AI generation prompt.
- [ADDING_RECIPES.md](ADDING_RECIPES.md): end-to-end recipe/ingredient workflow including generating, optimising and validating the new food image.
- [AGENTS.md](AGENTS.md): project guardrails for coding and image agents.

Original recipes keep their SVG illustrations. A new recipe can set an optional `image` field such as `"recipes/new-recipe.webp"` to use a local optimised WebP; GitHub Pages paths remain safe.

### AI food photos — first batch

The first 10 recipes now use individually generated, transparent 800 × 504 WebP images in `public/recipes/` (roughly 60–100 KB each). Six remaining recipes continue using their existing SVG illustrations. The recipe `image` property selects the WebP, and the SVG catalogue remains available as fallback. Image sizing and transparency are covered by unit/browser tests. See [IMAGE_STYLE.md](IMAGE_STYLE.md).

### AI food photos — second batch

Five additional recipes use individually optimised transparent 800 × 504 WebP food images: fish finger butties, meatball spaghetti, tomato soup, ham & cheese toasties, and bean chilli jackets (roughly 63–77 KB each). In total 15 of 16 recipes use WebP. The chicken & potato traybake retains its existing SVG for now: the generated photo contained sausages, which are not in that recipe, and should not be published under a misleading title. Replace only when correct chicken-and-potatoes artwork is available. See [IMAGE_STYLE.md](IMAGE_STYLE.md).

## Dedicated recipe routes

Each recipe now has a full-page, shareable URL such as [Jacket potatoes & beans](https://simondoescode.github.io/nibblepot/recipes/jacket/). Recipe cards are real links that support opening in new tabs. The surprise-me dialog takes users to the selected recipe page.

Routing uses the browser History API and the existing Vite base path (no added router dependency). `npm run build` generates a real `dist/recipes/<id>/index.html` entry for every recipe, plus static entrypoints for Favourites, Larder, Shopping and Settings. GitHub Pages can therefore load copied recipe URLs and refresh them directly without relying on a fragile 404 redirect. The generated HTML includes recipe titles, canonical links, Open Graph metadata and Recipe structured data. The app keeps localStorage saved data intact and handles browser back/forward navigation.

## v0.4 — quantity-aware shopping

Recipe pages now support 1–8 servings (original recipes assume four), calculate scaled ingredient quantities and distinguish genuinely optional additions. Optional ingredients are added only if ticked, and ingredients already marked in the larder are excluded when adding a recipe.

The Shopping page now sums compatible quantities across linked recipes (e.g. 350 g + 350 g pasta = 700 g), preserving incompatible units as separate amounts rather than inventing conversions (4 large potatoes + 750 g). Vague quantities such as 'A little' remain descriptive rather than made-up numbers. Changes to recipe servings automatically update the shopping list. Copy list includes amounts.

Saved-data migrations preserve the existing `nibblepot-demo-v1` key, recipe IDs and shopping references. A new optional `servings` map stores recipe choices (1–8); older saved lists default to four servings. Larder items are binary in-stock flags, **not stock quantities**; the app cannot claim to subtract partial amounts. The Settings backup includes servings, if set.

## v0.5 — weekly planner and searchable larder

Open **Planner** to plan Monday–Sunday. Each day can be a recipe, leftovers, freezer night or empty; the starter plan suggests five cooked dinners and two easy nights. Use **Shuffle dinners** to randomly replace cooked dinners without repeating them, or edit days individually. Change weeks with the arrows. Plans are saved by Monday date in the existing localStorage data and included in Settings backups.

The planner's preview counts missing ingredients across all scheduled dinners, applies saved servings and combines matching units. **Add week to shopping** replaces the *previous planner-generated* shopping contributions with the selected week's items while preserving manually added entries and checked items. Repeated recipes count multiple times; optional toppings are excluded by default. Shopping contents update when you choose Add week again, not automatically on changing meals. The larder is searchable across cupboard, fridge and freezer with instant filtering and clear search.

The app remains offline-capable, GitHub Pages-hosted and account-free. New deep link: `/nibblepot/planner/`. The larder is still an in-stock flag, not an amount tracker.

## v0.6 — Cooking Mode

Every recipe page now has **Start cooking**, which opens a distraction-free full-page guide at `/nibblepot/recipes/<id>/cook/`. Follow one step at a time with generous mobile-sized controls, a progress indicator and checklist of ingredients (scaled to the saved serving count). Checked ingredients and step progress are kept in per-recipe `sessionStorage`, so refreshing within the same browser tab keeps your place. **Cook again** resets the current session.

Cooking Mode includes an optional, local countdown timer. Use +/- minute controls, or select durations **explicitly named** in the current recipe step (for ranges, both ends are offered). Start, pause and reset are supported. An absolute timestamp prevents cumulative drift when the tab is backgrounded, and a running countdown is restored after reload in the same tab. It does not provide guaranteed background alarms/notifications or verify food safety; always follow the recipe and check food is thoroughly cooked.

The dedicated cook URLs are generated as physical GitHub Pages HTML entrypoints so direct visits and refreshes work. Cook pages declare `noindex,follow` and canonicalise to the normal recipe page to avoid SEO duplication. Existing saved recipes, shopping lists and planner data remain unchanged.

### Mobile Cooking Mode improvements

On screens up to 750px, Cooking Mode uses a **fixed bottom Previous/Next action bar** and a compact **Ingredients / Timer toolbar**. The toolbar opens accessible, dismissible bottom sheets, leaving large recipe text unobscured while cooking. The timer state and ingredient ticks remain identical to desktop and are stored in the same per-recipe session; resizing between mobile and desktop doesn't create duplicate countdowns. Mobile controls use larger touch targets, safe-area spacing and readable step text, with keyboard/Escape/focus handling provided by Radix Dialog. Desktop retains the two-panel layout.

## Native-feeling mobile navigation

The mobile footer is a five-slot tab bar with lightweight Lucide icons for Recipes, Planner, Larder, Shopping and More. More opens a keyboard-accessible sheet for Favourites and Settings. Current tab, shopping count and safe-area spacing are preserved; desktop navigation keeps its existing layout. Touch feedback and reduced-motion behaviour are tested in Playwright.

Pull-to-refresh applies a resistance-limited translation to the app's content (not its fixed tab bar) with a spring-like release animation; it still calls the existing full PWA reload. Scrollable inputs, horizontal swipe gestures, dialogs and cooking mode don't start a refresh, and pull animation is disabled for reduced-motion users. This is a web approximation of iOS overscroll, not a promise of native haptics or exact Safari bounce behaviour.
