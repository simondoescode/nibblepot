# Mobile app continuity and motion — issue 28

Implemented in dependency order on top of the merged mobile shell (PR 29).

## Phases 1–3

- Shared motion tokens, live reduced-motion handling, touch press feedback and fine-pointer-only hover effects.
- Explicit route direction, browser-history-aware back, per-route scroll restoration before paint, and per-tab browsing context in session storage. Deep links have a Recipes fallback.
- Incoming-only route transitions: outgoing screens are unmounted, preventing duplicate controls, IDs or live announcements.
- Shared Radix dialog presentation: CSS-managed exit lifecycle, keyboard/focus semantics, modal history entry, close controls and handle-only downward dismissal. The visual viewport bounds sheets when the software keyboard changes available height.
- Refresh starts update checking immediately and waits for the release transition before reload; status stays visible. Gesture state is limited to one React update per animation frame. Layer promotion only applies while pulling/settling.
- Heart pulse only after an explicit save, toast entry/exit, filter-only results fade, stable shopping rows, planner week direction and changed-day feedback, and directional cooking steps with transform-based progress.
- Existing fixed cooking controls, timer/session data, user-data schema, base path and offline behaviour retained.

## Phase 4 validation

Local typecheck/build and unit tests run successfully. Local Chromium cannot launch in this workspace: process singleton socket creation is denied before a page opens. Browser regression validation therefore runs in GitHub Actions with the repository's preinstalled Chrome configuration.

Added browser coverage for tab/recipe context restoration, sheet Back/Forward and draft cancellation, handle drag dismissal, live reduced-motion changes, stable shopping rows, direct entry and rapid navigation. Added unit coverage for update work overlapping settling and offline/update-error reload fallback.

Physical Android and iOS installed-PWA testing, VoiceOver/TalkBack, real-device frame timing, keyboard overlap on iOS, and before/after recordings have not been performed. They remain manual acceptance checks; CI browser emulation does not substitute for these checks.

No new runtime dependencies. Baseline/current bundle comparison and final CI result are recorded in the PR description after verification.

## Local review status

- Production build/typecheck: passed.
- Unit tests: 101 passed across 13 files, including modal-history and refresh-barrier regressions.
- Baseline (PR 29), Vite report: main JS 397.83 KB / 119.07 KB gzip; CSS 68.25 KB / 14.11 KB gzip.
- Current Vite report: main JS 404.84 KB / 121.39 KB gzip; CSS 73.86 KB / 15.15 KB gzip. Gzip increase: approximately 2.32 KB JavaScript and 1.04 KB CSS. No added runtime packages.
- User approved publication to simondoescode/nibblepot. Local command-line Git has no write credentials; publish through the connected GitHub integration. CI browser validation and deployment verification are pending.
