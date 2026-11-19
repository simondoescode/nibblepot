# Simmer animation review — Dinner, with a little bounce

Source baseline: `291a6aad43671a98557960cd1d7fc1c6dd4034db`, 14 November 2026. Implements the motion enhancements in #78; physical-device sign-off remains with #31.

## Interaction inventory and decisions

| Interaction | Baseline | Decision and resulting treatment | Owner |
| --- | --- | --- | --- |
| Buttons/cards | Generic mobile .97 scale; some legacy transforms | Spring release on shared buttons/chips, image-only press on recipe link; no whole-card scaling around nested controls | motion.css |
| Save favourite | 200ms CSS pulse with animation-end state reset | Local heart pop and four sparks only on a new save; cancel on removal/unmount/preference change | MotionMark, useChangeMotion |
| Recipe inspiration | Keyed image node swaps immediately | Retain image/title/trigger nodes; short lift/settle on loaded food and title, shuffle-icon turn; preserve focus | TonightInspiration |
| Add dinner from detail | Date dialog and explicit date toast | Retain confirmation, no artificial delay or shopping-sync changes | PlanDinnerDialog, App, Toast |
| Place/swap dinner | Whole-row highlight, cleared by bubbled animation-end | Stamp only the destination meal thumbnail; repeat safely; Undo/clear/shuffle cancels old placement | WeekPlannerPage |
| Drag lift/destination | Floating meal and dashed ghost | Retain working finger-tracking, pickup and destination cues; placement stamp completes successful drop | useDinnerDrag, planner-drag.css |
| Bottom tabs | Selected background and press transform | Pop only the newly selected icon; preserve stationary navigation targets and existing swipe model | Navigation |
| Filters/results | Selected chip, result fade keyed by filter | Small selected-chip pop; preserve results fade and immediate search; no per-card cascades | controls, HomePage |
| Shopping/larder/ingredients | Native checks and background change | Native checkbox pop only on a new check; preserve labels, row order and checked state | MotionCheckbox |
| Quantities | Immediate numeric replacement | Brief serving-count pop without moving +/- buttons | RecipePage |
| Sheets/backdrops | 240ms entry/200ms exit | 260ms entry/180ms exit via existing accessible lifecycle; retain drag ownership | motion.css, dialog |
| Toast | Small slide/fade | Spring arrival; retain status announcement and dismissal lifecycle | motion.css, Toast |
| Cooking steps/timer | Directional steps and persistent timer | Retain; replace mount-based completion reveal with action-triggered badge and sparks | CookingMode |
| Week completion | Counts only | “Week, sorted.” badge; celebrate empty-to-complete only within the same week, never browsing/restoring a completed week | WeekPlannerPage |
| Pull refresh | Scoped spring and reduced-motion handling | Retain existing gesture/update lifecycle and shell separation | usePullToRefresh, motion.css |

## Implementation review

Shared `useChangeMotion` animates committed value changes with the browser Web Animations API. It skips initial/restored values; an optional scope suppresses celebration when browsing between weeks. Cleanup cancels all owned animations on a superseding change, unmount or live reduced-motion change. No app state depends on animation completion or decorative timers. Unsupported animation APIs leave functional state changes immediate.

Existing route/sheet transitions and drag behaviour remain intact. Sparks are decorative, local and invisible at rest. No loop, full-screen confetti, audio, vibration, additional dependency or storage/schema change. The current Favourites navigation and Recipes-only mobile header remain intact.

New browser regression tests pause only JS feedback to inspect interruption deterministically, while CSS sheet/navigation lifecycles run normally. They cover rapid save/remove/save, restored favourites, reduced-motion changes, bounded shuffle effects and focus, cooking completion/restoration, meal placement/Undo and screenshots at 360/390/820/1180/1440px in normal/reduced motion. CI uploads these previews for visual review.

## Validation and limits

- Local production build/typecheck passes; all 135 existing unit tests pass.
- Local browser execution is blocked at Chromium startup by the workspace socket restriction. The attempted suite therefore does **not** validate browser behaviour. GitHub CI is the browser-validation gate.
- Physical Android/iOS PWA, TalkBack/VoiceOver, live frame-rate/long-task comparisons and visual review of CI previews remain outstanding. No physical-device performance pass is claimed.
- Baseline build main CSS/JS gzip: 22.02/137.85 kB. Updated build: 22.26/139.04 kB (about +1.43 kB combined gzip). No new dependency; precache entry count remains 123.
- Food-image shared-element navigation remains an optional future experiment, not a runtime dependency.

Release wording and semver workflow are recorded in `docs/releases.md`; the generated release notes remain accessible through Settings for the installed release.
