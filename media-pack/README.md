# Sui.ski Media Pack

Reusable brand assets for engineering, design, and social previews.

## Files

- `sui-ski-logo-mark.svg`
  - Icon/mark only (mountain + wave).
  - Gradient: `#60a5fa -> #a78bfa`.

- `sui-ski-logo-lockup.svg`
  - Horizontal lockup: icon + `sui.ski` wordmark.
  - Intended for large backdrops and banners.

- `sui-ski-logo-vertical.svg`
  - Vertical lockup: icon centered above `sui.ski` wordmark.
  - ViewBox: 512x560. Same gradient and geometry as logo mark.

- `sui-ski-logo-vertical.png`
  - Pre-rendered PNG of the vertical lockup (1024px wide).

## Notes

- These are source-of-truth brand vectors for this repo.
- Keep gradients, geometry, and proportions aligned with the in-app logo renderer (`generateLogoSvg` in `src/utils/og-image.ts`).
