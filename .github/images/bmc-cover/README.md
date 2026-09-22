# Buy Me a Coffee cover

`../gladys-bmc-cover.png` and `../gladys-bmc-cover-fr.png` are the 1600×400
cover images for the Buy Me a Coffee page
([buymeacoffee.com/gladysassistant](https://buymeacoffee.com/gladysassistant) →
**Edit page → Cover image**). Buy Me a Coffee also serves the cover as the
`og:image` of that page, so it is what shows up when the page is shared.

The page carries both an English and a French description, hence the two
variants — upload whichever one leads.

Both are generated from `bmc-cover.html`, which reuses the app icon and the
"Horizon" glass gradient of the default dashboard theme
(`front/src/routes/dashboard/style.css`), the same recipe as the repository
social preview in `../og-image/`. `?lang=fr` swaps the copy and the screenshot.

The copy sits a little above the optical centre and keeps clear of the
bottom-left corner: Buy Me a Coffee lays the round profile picture over the
bottom of the cover.

## Regenerating

The screenshot behind the cover comes from the demo mode of the front, so
nothing on it is from a private instance. To refresh it after a UI change:

```bash
npm install playwright sharp && npx playwright install chromium

# Serves the demo on http://localhost:1445
(cd front && npm run start-demo)

node .github/images/bmc-cover/capture-demo.mjs   # ../gladys-demo-dashboard[-fr].webp
```

Then render the covers (this step needs no server):

```bash
node .github/images/bmc-cover/generate.mjs
```
