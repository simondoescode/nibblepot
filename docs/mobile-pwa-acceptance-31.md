# Issue #31 — Mobile PWA acceptance and device test record

This checklist is an execution plan, **not evidence that physical device testing happened**. Browser emulation cannot validate Safari home-screen quirks, native Android back gestures, frame timing or VoiceOver/TalkBack.

## Automated gate
Run `npm ci && npm run check`. The additional `e2e/pwa-release-smoke.spec.ts` checks manifest/scope/icon availability, viewport overflow at 320/390/430px, and runtime reduced-motion toggling. Existing suites remain responsible for recipe, planner, larder, shopping, navigation and offline regressions.

## Physical device matrix (unverified until executed)
| Test | Android Chrome installed PWA | iOS Safari Add to Home Screen |
|---|---|---|
| Icon, splash and standalone launch | NOT TESTED | NOT TESTED |
| Sticky header and bottom tabs while scrolling | NOT TESTED | NOT TESTED |
| Safe areas, landscape and software keyboard | NOT TESTED | NOT TESTED |
| Open recipe, back, restore filters and scroll | NOT TESTED | NOT TESTED |
| Sheet swipe handle, nested scroll, Escape/Back | NOT TESTED | NOT TESTED |
| Cooking step and timer while offline | NOT TESTED | NOT TESTED |
| Refresh/update without losing saved data | NOT TESTED | NOT TESTED |
| Screen reader and focus restoration | NOT TESTED | NOT TESTED |
| Mid-range device frame profile and recording | NOT TESTED | NOT TESTED |

## Reproduction protocol
1. Record device model, OS/browser version, display size, installation method, network state and deployed commit SHA.
2. Install fresh, then repeat with an existing installation containing favourites, larder quantities, planner selections and checked shopping items.
3. In Recipes, select multiple food types, scroll midway, open a recipe, navigate back using in-app and system controls. Verify filter/scroll restoration.
4. Open each mobile sheet, drag only its handle, cancel a partial drag, interact with scrollable content, focus an input and open the keyboard. Verify no trapped or hidden controls.
5. Repeat at reduced motion and with screen reader enabled. Check focus return and announcements.
6. Disconnect network, open a cached recipe and Cooking Mode, then reconnect and test refresh/update. Verify stored data survives.
7. Capture a performance recording of scrolling, tab switching and opening/closing sheets on a mid-range device. Record measured frame timing rather than estimating it.
8. Attach screenshots, traces, timings and pass/fail evidence to #31. Log each defect with reproduction steps and add regression coverage before merging fixes.

## Closure
- [ ] Existing #28 criteria reconciled with merged PR #30.
- [ ] Full CI green on release commit.
- [ ] Android physical-device matrix complete.
- [ ] iOS physical-device matrix complete.
- [ ] Accessibility and performance evidence attached.
- [ ] Deployment and installed-app update verified.
- [ ] Close #28 and #31 only after the remaining acceptance evidence exists.
