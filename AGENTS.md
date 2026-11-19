# Simmer agent instructions

**Project:** a warm, editorial UK family recipe PWA, built with React + Vite + TypeScript, custom CSS, Radix accessible dialogs and Lucide utility icons.

## Mandatory guides

- **UI/UX design and review:** use [UI UX Pro Max](.agents/skills/ui-ux-pro-max/SKILL.md) (upstream CLI 2.15.0) to check mobile and tablet layouts, touch interactions, accessibility and motion. Follow Simmer’s existing visual direction, components and tokens when applying its guidance.
- **Food image generation, optimisation, or replacement:** read [IMAGE_STYLE.md](IMAGE_STYLE.md) first. Use real transparent **800×504 WebP** cutouts at a low three-quarter angle, restrained saturation, and a **250,000-byte maximum**.
- **Adding or editing recipes:** follow [ADDING_RECIPES.md](ADDING_RECIPES.md), including generating and checking the food image.
- **Architecture/deployment:** refer to [README.md](README.md), `src/types.ts`, `src/ui/tokens.css` and `src/styles/recipe-refresh.css`.

## Non-negotiable guardrails

- Follow The Weeknight Cookbook direction. Keep recipe discovery editorial and everyday tasks easy to scan. Use the shared Simmer tokens and primitives.
- Keep the static, offline-capable PWA and the GitHub Pages **`/nibblepot/`** base path; use `import.meta.env.BASE_URL` for local images.
- Preserve recipe IDs, `nibblepot-demo-v1` localStorage data, favourites, larder, shopping and working refresh controls.
- Use the existing JSON recipe and ingredient models. Keep ingredients and instructions accurate; don't hallucinate food quantities, allergens or food-safety rules.
- Generate **one recipe image per request**, never multi-dish grids for final images. Check alpha, image content, visual quality, physical byte size and mobile crop before committing.
- Existing SVGs are fallbacks; new WebP images are optional via the recipe `image` field. Avoid external image CDNs and large source PNGs under `public/`.
- Prefer small, reviewed changes. Maintain keyboard accessibility and responsive behaviour.

## Versioning and user-facing releases

- Read [docs/releases.md](docs/releases.md) before preparing or changing a release. Use Conventional Commit PR titles so Release Please can select the appropriate SemVer bump.
- Keep the Release Please workflow in manifest mode: define `release-type` in `release-please-config.json`, not as an action input. Supplying the action input bypasses the saved manifest/config and can propose the wrong initial version. For the 0.x prototype, keep `bump-minor-pre-major` enabled and review any proposed move to 1.0.0 explicitly.
- `package.json.version` is the single source of truth for the app version. Settings imports it directly; never hardcode a separate display version or use a Git SHA/deployment number as the release version.
- Every versioned release must update `package.json`, the root/package version entries in `package-lock.json`, `.release-please-manifest.json` and `CHANGELOG.md` together through the reviewed release PR. The Git tag and GitHub Release must use that same version.
- Include short, friendly user-facing release notes for every version, accessible offline from **Settings → What's new?**. Review the generated changelog's first three visible bullets; do not show notes newer than the installed app version.
- A feature merge or GitHub Pages deployment alone does not bump the app version. Distinguish “deployed changes” from a completed versioned release; do not claim that Settings has a new version until the release PR is merged and its deployment succeeds.
- Before calling a release complete, verify that the release tag, package/lockfile/manifest versions, changelog section, deployed Settings version and newest visible release-note version agree. Verify the PWA's explicit update/refresh path as well; an older installed/cached app can keep its old version until updated. Preserve saved data and do not interrupt an active cooking session to force an update.
- Check the release workflow result as well as build/deploy checks. If publication is blocked (for example, GitHub Actions cannot create release PRs), report the exact blocker and which version remains installed; do not invent a version or silently bypass the release process.

## Before merge

Run `npm run build`, `npm test` and `npm run test:e2e` for UI/image changes; ensure the CI workflow passes. Do not claim generation, merge, successful deployment or real alpha unless independently verified.
