# Onboarding on a phone

> Part of [`mobile-pages`](README.md) — principles and kit there. **Any PR that changes one of
> these behaviors modifies this file in the same diff.**

## A. Context

`routes/signup` is the first contact with Gladys: five short steps (welcome, account,
preferences, house, success) and, from the first one, the restore of a Gladys Plus backup. A box
is often installed with a phone in the hand — the box is in a cupboard, the computer in another
room — so the whole flow must be done from a phone, end to end. On a phone it was the desktop
card that wraps:

- five numbered pills above a card with 3 rem of padding: a third of the first screen before the
  first word;
- fields of 15 px (iOS zooms into each of them), with no hint for the keyboard nor the autofill:
  a capital letter in the e-mail address, no proposal of a strong password, no way to read the
  password typed on a small keyboard;
- the button of each step at the end of its form, under the keyboard;
- in the house step, a 300 px map that takes the scroll of the page, and rooms typed one by one.

## B. The shell (< 768 px)

`routes/signup/layout.jsx` renders, below the phone breakpoint, `MobileSignupLayout` instead of
the card:

- the **navigation bar** of the kit, with the logo and "Gladys Assistant" as its title, and the
  way back only where going back makes sense (the account step goes back to the welcome; once
  the account exists, a step has no back control);
- **where the user is** (`MobileSteps`): "Step 2 of 5 · Create account" above a segmented
  progress bar;
- the content of the step, on the wallpaper of the logged-out pages; each step starts at the top
  of the page (the router keeps the scroll position, a step reached from the button at the
  bottom of the previous one would open on its end);
- **one primary action per step, in the bottom bar** (README C.4), with a spinner while its
  request is in flight and its error above it.

Each step file exports a component that picks its layout with `withMobileViewport`; the
containers (`index.js` of each step) and the store actions (`actions/signup/*`) are the ones of
the desktop flow: **the phone flow sends the same requests, in the same order**.

## C. The steps

### C.1 Welcome (`/signup`)

The title, what Gladys is and how long the setup takes, the sentence about the data staying
local. **Create local account** is the primary action, in the bottom bar. **Gladys Plus backup
restore** is a row under the text (section D). The links to the documentation, the forum and
Gladys Plus are footnotes.

### C.2 Account (`/signup/create-account-local`)

`MobileCreateAccount` is built on the handlers of the desktop tab (the validation and the
`POST /api/v1/signup` stay in the container); `components/user/profile.jsx`, shared with the
profile and user pages, is not touched.

| Field | Keyboard and autofill |
| --- | --- |
| First name | `autocomplete="given-name"`, capitalized words |
| Last name | `autocomplete="family-name"`, capitalized words |
| E-mail | `type="email"`, `autocomplete="email"`, no capitals, no correction |
| Language | the native list of the system |
| Password, repeated | `autocomplete="new-password"` (the phone proposes and keeps a strong password), no capitals, no correction |

- Each password field has a **reveal button** in the same control (`aria-pressed`); it shows or
  hides both.
- The validation is the one of the container (first name, last name, a valid e-mail, 8
  characters, the same password twice). **The error of a field is next to it** (`role="alert"`),
  and submitting brings **the first refused field into view and focuses it**: it may be a screen
  above the button.
- A refusal of the server (network, instance already configured, e-mail taken, unknown) shows in
  the bottom bar.
- The form is a `<form>`: the keyboard's key submits it.

- The fields the account needs (first name, last name, e-mail, both passwords) say so to
  assistive technologies before any submission (`aria-required`).

### C.3 Preferences (`/signup/preference`)

- **Temperature unit** and **distance unit** are segmented controls (Celsius / Fahrenheit,
  Kilometers / Miles — the same values as the desktop selects: `celsius` / `fahrenheit`,
  `metric` / `us`).
- **Keep device state history** is the native list, with a footnote saying what it is and that
  it can be changed later.
- **Save settings** in the bottom bar; an error of the save shows above it.

### C.4 House (`/signup/configure-house`)

Built with the pieces of the house settings ([`house-and-rooms.md`](house-and-rooms.md)):

- its **name**, with its error next to it; a save without a name brings the field back into
  view;
- its **location** (`MobileLocationField`, house-and-rooms C.2): "Use my current location", the
  address search with its results as rows, the preview map and the map sheet. Optional, and said
  to be;
- its **rooms**: the common rooms as toggles (`RoomSuggestions`, house-and-rooms C.3) — nothing
  is saved before the end of the step, so a tap adds a room and another tap removes it — and a
  field to add a room by its name, which joins the chips. A room already in the list is refused
  with a message;
- **Save house** in the bottom bar: the house then its rooms are created by the store action of
  the desktop step (`saveHouse`); a failure shows above the button.

The desktop step keeps its map, created by a store action on an element of the desktop layout
(`initLeafletMap`); the container only creates it when that layout is the one shown. The phone
step sets the same store fields through two actions that send nothing: `setHouseLocation` and
`addRoomNamed` (`actions/signup/signupConfigureHouse.js`).

- The desktop map is rebuilt when the layout comes back from the phone one (and on a change of
  theme): the pin is put back from the stored position (`initLeafletMap`), instead of keeping a
  marker of the map that was removed.

### C.5 Success (`/signup/success`)

The title, the three panels (integrations, scenes, open source) stacked as cards, the closing
line, and **Go to dashboard** in the bottom bar.

## D. Restoring a Gladys Plus backup (`/signup/create-account-gladys-gateway`)

The same four screens as on desktop, in the shell of section B (titled "Restore a backup",
without the five-step progress, with the way back to the welcome):

1. the **Gladys Plus sign-in** — the shared form (`GatewayLoginForm`), with fields of 16 px and
   targets of a phone inside this shell;
2. the **backup key**: one field (no capitals, no correction: a key is pasted or typed as it
   is), its help, **Save** in the bottom bar;
3. the **backups** as rows — the date of the backup, then how long ago and its size — with "Change
   backup key" and "Refresh" under them. **Tapping a backup opens a confirmation** (`ConfirmSheet`)
   naming it: the restore replaces the instance, it never starts on a single tap;
4. the **restore in progress**, or its failure with the two ways out.

On screens 2 and 3, "Create a local account" is a row leading to the account step.

## E. What does not change

- From 768 px: the card, the pills and every step, as before — the desktop spec
  (`0-signup/SignUp.cy.js`) passes unchanged.
- The requests and their payloads, the route of each step, the confetti of the last one.
- The existing translations are reused; the new ones are under `signup.mobile` (and
  `housesSettings.mobile` for the pieces shared with the house settings).

## F. Tests

- Cypress, phone viewport, `front/cypress/e2e/routes/signup/SignupMobile.cy.js`, **with the API
  stubbed**: the real onboarding only exists on a fresh instance, where the desktop spec creates
  the account every other spec logs in with — a second spec cannot create it too, and its place
  in the run is not guaranteed. Stubbed, the phone spec runs on any instance and writes nothing;
  it checks what the phone layout shows and **sends**: the welcome (progress, one primary
  action, the restore row, nothing scrolling sideways); the account form (autofill attributes,
  16 px fields, four errors next to their fields and the first one focused, a short password, the
  reveal button, a different repeated password, no request sent, the way back); the whole flow —
  the `POST /signup` body, the preferences picked with the segmented controls and their two
  requests, the house refused without a name, located from an address then from the phone, its
  rooms toggled and typed, the `POST /house` body and one `POST …/room` per room, the last
  screen; the restore path (the key, the backups as rows, the confirmation that can be
  cancelled, the way to a local account); the card kept on a wider screen.
- Phone emulation with a real touch screen (Playwright, 390 px and 320 px, light and dark), **on
  a fresh instance, without stubs**: the five steps end to end — the account, the preferences,
  the house located with the position of the phone and its rooms created on the server — then
  the dashboard; no horizontal scroll, no field below 16 px, no target below 44 px (links in a
  sentence excepted).
