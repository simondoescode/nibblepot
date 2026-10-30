# Nibblepot UI primitives

The app uses its own visual language: chunky buttons, soft warm colours, illustrated food and a pot mascot. No global themed component kit.

- `tokens.css` defines colours, radii, elevation and focus tokens.
- `Button` and `IconButton` keep native button semantics and consistent visual variants.
- `FilterChip` is an accessible, toggle-style filter with `aria-pressed`.
- `@radix-ui/react-dialog` provides focus trapping, Escape and outside-click dismissal, aria semantics and background scroll locking for the recipe dialog.
- `lucide-react` is for utility actions; keep food emoji and illustrated mascot as brand elements.

Add new primitives only when interaction complexity warrants them.
