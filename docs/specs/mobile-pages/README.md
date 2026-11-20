# Mobile-first pages — Gladys as an app on a phone

> **Living specification — source of truth.** This folder specifies how the pages listed in
> section D behave on a phone, and the kit they share. **Rule: any PR that changes one of these
> behaviors, or the kit, modifies the file that owns it in the same diff.** The dashboard and the
> scene pages have their own specs (`dashboard-flexible-layout-and-widgets.md`,
> `scene-editor-mobile.md`); this folder extends the same model to the rest of the app.

## A. Context

After the dashboard editor and the scene pages, the remaining pages were still desktop forms that
wrap on a phone: a grid of cards per device feature, tables that scroll sideways, a four-step
wizard laid out in `col-md-3` columns, a map form where the zone is drawn below the fold. An audit
of those pages in an iPhone 13 (390 px) and iPhone SE (320 px) emulation found the same problems
the scene audit had measured:

1. **iOS zooms into every field** (15 px fields; Safari zooms on focus below 16 px).
2. **Tiny and destructive targets**: a 16 px trash icon revokes a session without a word, a `×`
   removes a room.
3. **The primary action is at the end of the page**: "Save" sits under every feature card of a
   device, three screens down.
4. **Tables**: sessions, services, jobs, backups and API keys scroll sideways or wrap their
   cells until they are unreadable.
5. **No feedback where the user is**: a save error shows at the top of a page the user is at the
   bottom of; a successful save shows nothing.

The goal: **Gladys is usable from a phone as if it were a native app, end to end** — installing
it (onboarding), signing in, configuring the house, renaming a device, checking the system,
drawing a zone, setting up an energy contract.

## B. Scope and principles

- **Breakpoint.** "Phone" is the rule of the scene pages (`utils/mobileViewport.js`): a viewport
  narrower than **768 px**, or a phone held in landscape (a touch screen at most 500 px high).
  It is evaluated with `matchMedia` and re-evaluated when it changes — a component gets it as the
  `isMobile` prop from `withMobileViewport` (`components/mobile/MobileViewport.jsx`). From 768 px
  the pages keep their current layout, unless the file of a page says otherwise.
- **One logic, two layouts.** A page keeps **one** container (state, requests, validation); the
  phone layout is another presentational component fed by the same props and callbacks. A phone
  page never re-implements a request, a validation or a mutation, and never changes a payload:
  **no data model or API change** comes with these layouts.
- **Mobile-native means** (same list as the scene pages): one decision per screen or sheet, the
  primary action in the bottom third, rare actions behind a row or "•••", every touch target
  ≥ 44 px, every field ≥ 16 px, no nested scroll area, nothing scrolling sideways (a chips row
  excepted), and nothing destructive without a confirmation or an undo.
- **Nothing is lost silently.** A page that edits something (a device, a house, a zone, a
  contract) tells when there are unsaved changes and asks before leaving through its back
  control (C.4).
- **Feedback where the thumb is.** A successful action shows a toast; an error shows in the
  bottom bar or in the sheet the user is in, never only at the top of the page.
- **A Gladys that is unreachable is said once, by the shell.** The "Gladys is unreachable"
  notice floats under the app's top bar on every signed-in page, and under an open navigation
  drawer (`components/header/ConnectionLostNotice.jsx`; its behavior is specified with the app
  navigation, `../dashboard-flexible-layout-and-widgets.md`, H2). A page does not build its own.
  **It is at the top on purpose, the one exception to "feedback where the thumb is"**: it is
  not the feedback of something the user just did but a state of the app, which lasts; on a
  phone the bottom is where everything is operated (the dashboard dock, the bottom bar, the
  floating "+", the toast) and a card that stays for minutes must not sit on any of it. Its
  button is a convenience — the notice leaves, or reloads a dashboard, by itself.

## C. The kit (`front/src/components/mobile/`)

The surfaces the pages share. Same vocabulary and values as the scene pages
(`routes/scene/mobile.css`), which keep their own copy for now; a new page uses the kit.
`kit.css` holds the styles (a CSS module, exported as `kitStyle`), `index.js` exports the
components.

### C.1 Navigation bar and focus pages

- A **list or consultation page** (devices, settings, energy dashboard) keeps the app's mobile
  top bar and its own title.
- An **edit page or a flow** (a device, a house, a zone, the contract wizard, the onboarding) is a
  **focus page**: `FocusPage` sets `body.gladys-focus-page` while mounted, the app's mobile top
  bar gives way, and the page brings its own `MobileNavBar` (56 px, sticky): the way back on the
  left ("‹ Devices" — the name of the page it returns to), the title centered (one line,
  ellipsis; the two sides share what the title leaves), and at most one action on the right
  (a text button such as "Save" / "Done", or a 44 px icon button such as "•••").
- The content of a focus page is `kitStyle.content`: at most 40 rem wide, centered, clear of the
  notch (safe-area insets), with room for the bottom bar (`contentWithBottomBar`).

### C.2 Groups and rows

The replacement for a table, a grid of cards and a list of form-groups: **rows in grouped
cards**, the pattern of the devices list.

- `MobileSectionHeader`: an uppercase micro-title above a group, with an optional action on its
  right.
- `MobileGroup`: one white card (radius 16 px) holding rows separated by hairlines.
- `MobileRow` (≥ 56 px; ≥ 64 px as its own card): an icon tile (40 px), a title (16 px, two
  lines at most), up to two secondary lines, the value the row is set to (right-aligned, one
  line), then a chevron when the row opens something — or a trailing control (a `MobileSwitch`,
  a `MobilePill`, a 44 px `MobileRowButton`). **The whole row is the target** when it opens
  something (a link or a button); a row holding its own control is not itself a button.
- `MobilePill`: a status ("Running", "Failed") in a neutral / success / warning / danger /
  accent tone — never the color alone: the pill always carries its word.
- `MobileNotice`, `MobileEmptyState`: an information / warning / error block, and what a list
  shows when it is empty.

### C.3 Fields

- `MobileField`: the label above, the control, then the error (`role="alert"`, named
  `${htmlFor}-error` so the control can point to it with `aria-describedby`) or the help as a
  13 px footnote.
- **One look for every control** (`fieldClass.input` / `.select` / `.textarea`): 48 px high,
  16 px text, the same border, radius (14 px) and focus ring; a select shows the same chevron; a
  field and its unit or its reveal button are one control (`fieldClass.group` + `.addon`). An
  invalid control keeps its red border in dark mode (`fieldClass.invalid`, `.groupInvalid`).
- `MobilePasswordField`: a password and its **reveal button** in one control (`aria-pressed`,
  named by `mobileKit.togglePassword`), without capitals nor correction. `autocomplete` is
  "current-password" (the phone fills the saved one) or "new-password" (it proposes a strong
  one). A form that shows two passwords together drives both (`revealed` / `onToggleReveal`).
- The right keyboard for each field: `inputmode`, `autocomplete`, `autocapitalize`,
  `enterkeyhint`, and the native field of the system for a date or a time.
- `MobileSwitch` (52 × 32 px in a 60 × 44 px target, `role="switch"`), `MobileSegmented` (two to
  four options that are all visible, 44 px segments, `aria-pressed`), filter chips
  (`kitStyle.chips` / `.chip`, 44 px): the row scrolls sideways and bleeds to the edges of the
  screen — a page whose gutter is not 16 px sets `--kit-gutter`.
- `MobileSteps`: "Step 2 of 4 · Preferences" above a segmented progress bar, for a flow of
  several screens.

### C.4 Bottom bar and save model

- `MobileBottomBar`: a frosted bar fixed at the bottom, above the safe area, holding the primary
  action of the page as `BigButton`s (52 px; primary / danger / dangerSoft / ghost; `loading`
  shows a spinner and disables the button).
- **An edit page** shows there "● Unsaved changes" (`DirtyLabel`) and **Save** as soon as
  something differs from what was loaded; Save is disabled while nothing changed or while it is
  in flight. A failed save shows its message **in the bar** (`error`, with a close button), so it
  is visible wherever the user is. A successful save shows the "Saved" toast.
- **Leave guard.** Leaving an edit page through its back control with unsaved changes opens a
  confirmation sheet: **Save and leave** / **Leave without saving** (destructive) / **Keep
  editing** (`mobileKit.leave*`). While there are unsaved changes the page also registers a
  `beforeunload` handler.
- **The system "back" goes through the same guard** (the Android button, the iOS edge swipe, the
  browser button): `SystemBackGuard`, rendered by the phone layout of an edit page with its
  `dirty` state and the handler that opens its leave sheet.
  - It shares the history entry of the sheets (`components/sheet/sheetHistory.js`): while the
    page has unsaved changes, **one** entry of the same URL sits above the page's one, with or
    without a sheet open. A "back" that pops it closes the sheet on top if there is one;
    otherwise it asks the guard, the leave sheet opens and the entry is put back, so the next
    "back" is caught too. A second "back" therefore closes the leave sheet, like "Keep editing".
  - With nothing to lose the "back" leaves in **one** press, also right after a save (the entry
    left behind is passed on at once, as for the sheets).
  - Leaving from the sheet leads where the back control of the page leads, with
    `route(url, isSheetEntryOnTop())`: the navigation replaces the entry of the guard.
  - It is a phone behavior: from 768 px the pages keep what they did (the desktop cards have no
    leave guard). The houses editor, which is not a route of its own, keeps its own entry
    (`house-and-rooms.md` B); the scene editor relies on its local draft
    (`scene-editor-mobile.md` C.2).

### C.5 Sheets and confirmations

- A secondary form (adding a room, renaming a feature, the parameters of a zone) opens in the
  `BottomSheet` of the scene pages (`components/sheet/BottomSheet.jsx`): a bottom sheet on a
  phone, a centered dialog from 576 px, dragged down to close, closed by the system "back",
  stackable. A form sheet shows **OK**, a picker or a menu shows **×**.
- `ConfirmSheet`: the confirmation of a destructive action — what will happen in one sentence,
  the confirming button (red when destructive, a spinner while it runs), "Cancel". **Nothing is
  deleted, revoked, restored or restarted on a single tap.**

### C.6 Toast

`MobileToast`: a short message at the bottom of the screen (`role="status"`), rendered on
`<body>` above the sheets, gone after 4 s — 5 s when it carries **Undo**. It sits above the
bottom bar on a page that has one (`aboveBar`).

### C.7 Accessibility, motion, dark mode

- Every control is a real `<button>` / `<a>` / `<input>`, named by its text or an `aria-label`.
- Animations are skipped under `prefers-reduced-motion: reduce`.
- Dark mode is the app-wide inversion. `kit.css` ends with the exceptions: colors that carry a
  meaning (primary and danger buttons, the floating "+", a selected chip, the switch) are
  inverted back to themselves, and the fields of the kit are light surfaces that invert with
  their card (the global rule for inputs paints them a solid dark and inverts them back).

### C.8 A page that changes layout while it is open

A window resized across the breakpoint swaps the two presentations of a page, with its container
and its state kept. A Leaflet map unmounted by that swap is removed with `removeMapWhenSettled`
(`utils/mapTileLayer.js`): the basemap layer settles a resize on the next animation frame without
checking that its map is still there, and a map removed at once made that frame throw. The same
helper ends a zoom animation still running before it removes the map: Leaflet finishes it from a
timer that would otherwise throw on the removed map (a zone page left right after its map was
fitted).

### C.9 Glass variant

The kit is made of opaque white surfaces, for pages that sit on the gray of the app. A page that
sits on the **Horizon wallpaper** (the logged-out pages: [`auth.md`](auth.md) and the
onboarding, [`onboarding.md`](onboarding.md)) sets the global
class `gladys-mobile-glass` on its shell, and the same components are then the **frosted glass
of the theme** (`kit.css`, "Glass variant", with the `--gl-*` tokens of the glass scene):

- the navigation bar and the bottom bar are frosted — dense enough (88 %) for what scrolls
  under them to stay out of the way where the blur is not rendered;
- a group and a row card are a glass card (translucent, blurred, the white border and the soft
  shadow of the theme); the rows of a group are part of its glass;
- the fields are the translucent white of the theme's controls, solid once focused; a chip is
  a translucent control like a field, and a selected chip is the ink of the theme;
- on a card of fields (`kitStyle.formCard`, the glass card of the page) a group of rows is
  nested glass: it loses its own blur and shadow;
- the buttons join the pill family: **the primary action is the ink pill** of the Horizon
  buttons, the others a frosted capsule.

A sheet or a toast is rendered on `<body>`, outside the shell: it keeps the opaque surfaces of
the kit above the glass page.

Only the material changes: sizes, targets, structure and behaviors are the ones above. In dark
mode the glass is derived by the app-wide inversion — the ink pill inverts with the theme into a
light pill, like the Horizon primary buttons.

## D. Pages

Each file owns the phone behavior of its pages.

| File | Pages |
| --- | --- |
| [`device-edit.md`](device-edit.md) | Editing a device (`components/device/UpdateDevice*.jsx`), shared by the integrations |
| [`house-and-rooms.md`](house-and-rooms.md) | Houses and rooms (`settings/settings-house`, `components/house/`) |
| [`settings-pages.md`](settings-pages.md) | Settings sub-pages: sessions, services, background jobs, backups, system, Open API keys |
| [`energy.md`](energy.md) | Energy monitoring: consumption, "My devices", contracts and the contract wizard |
| [`map-areas.md`](map-areas.md) | Zones of the map (`routes/map/NewArea.jsx`, `NewAreaMap.jsx`) |
| [`onboarding.md`](onboarding.md) | Onboarding (`routes/signup`), the five steps |
| [`auth.md`](auth.md) | The logged-out pages: sign-in, password recovery, keypad of an armed house, and the Gladys Plus sign-in, two-factor, e-mail and account pages |
| [`integration-devices.md`](integration-devices.md) | The "Devices" and "Discovery" tabs of the integrations (`components/integration/mobile/`): Matter, MQTT, Bluetooth, Airplay, LAN Manager, Enedis, Thermostat, external integrations |

## E. Tests

- Cypress keeps its default desktop viewport for the existing specs: they must keep passing
  unchanged, which is what checks that the desktop layouts did not move.
- Each page file lists its phone specs (`cy.viewport('iphone-x')`), which drive the phone layout
  through its `data-cy` attributes.
- The checks every phone page passes, run in a phone emulation with a real touch screen
  (Playwright, iPhone 13 and a 320 px wide screen, light and dark): no horizontal scroll, no
  field below 16 px, no target below 44 px, and the gestures Cypress cannot drive (the drag of a
  sheet, the drag of a zone on the map).
