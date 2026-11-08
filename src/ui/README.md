# Simmer UI primitives

The Weeknight Cookbook pairs Fraunces display type with DM Sans UI text, an Evergreen pot identity and Ember primary actions. Planner, Shopping and Larder use quiet paper surfaces and compact rows.

- `tokens.css` defines colours, radii, elevation and focus tokens.
- `Button` and `IconButton` keep native button semantics and consistent visual variants.
- `FilterChip` is an accessible, toggle-style filter with `aria-pressed`.
- `@radix-ui/react-dialog` provides focus trapping, Escape and outside-click dismissal, aria semantics and background scroll locking for the recipe dialog.
- `lucide-react` is for utility actions; use the two-steam pot for the brand.

Add new primitives only when interaction complexity warrants them.
