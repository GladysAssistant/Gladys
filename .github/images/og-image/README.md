# Social preview (og:image)

`../gladys-og-image.png` is the 1280×640 image uploaded to
**Settings → General → Social preview**. GitHub reuses it for the Open Graph
and Twitter cards shown when the repository is shared.

It is generated from `og-image.html`, which reuses the v5 dashboard screenshot
(`../gladys-dashboard-en.webp`), the app icon and the "Horizon" glass gradient
of the default dashboard theme (`front/src/routes/dashboard/style.css`).

To regenerate it after a UI refresh:

1. Update `../gladys-dashboard-en.webp` with a new dashboard screenshot.
2. Run:

```bash
npm install playwright && npx playwright install chromium
node .github/images/og-image/generate.mjs
```

Keep the PNG under 1 MB — that is GitHub's upload limit for a social preview.
