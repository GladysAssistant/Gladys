# Settings sub-pages on a phone

> Part of [`mobile-pages`](README.md) — principles and kit there. **Any PR that changes one of
> these behaviors modifies this file in the same diff.**

## A. Context

The settings navigation is already a row of chips (`SettingsLayout`, `ChipsScroll`), but the
content of six sub-pages was a desktop table or a grid of cards: on a phone the sessions, the
services, the jobs, the backups and the API keys scrolled sideways or wrapped their cells until
they were unreadable, a 16 px trash icon revoked a session at once, the error of a failed job had
a fixed width of 20 rem, and "Reboot host" sat one tap away from a paragraph of text.

These are **list and consultation pages**: they keep the app's mobile top bar, the "Settings"
title and the chips (README C.1); only their content changes. On a phone it is **the same
stacked-rows pattern everywhere** (README C.2) — one row per session, service, job, backup,
container or key — in a column at most 40 rem wide (`routes/settings/mobileSettings.css` holds
what the kit does not carry). Each page keeps its container: the phone layout is picked with
`withMobileViewport` and receives the same props and callbacks as the table.

**From 768 px nothing changes**: the tables, the tiles and the two columns of cards are the ones
that were there.

## B. Sessions (`settings-session`)

- One row per session: an icon for what it runs on (phone, tablet, computer, a key for an API
  key, a question mark when unknown), its name — the browser and the device the user agent tells
  ("Safari · iPhone"; the parts the parser does not know are left out, "Unknown device" when none
  is known; "API key" for an API key) — and "Registered: 3 days ago".
- Three groups: **This device** (the session whose id is the `session_id` of the signed-in user,
  marked with a "This device" pill), **Other devices** ("No other device is signed in." when
  there is none), and **API keys** when there are some.
- **Revoking is confirmed.** The 44 px trash button of a row opens a confirmation sheet naming
  the session and saying what will happen — the device is signed out; for the session of this
  device, the user is; for an API key, what uses it no longer reaches Gladys. Confirming calls the
  same `revokeSession` action; the button shows a spinner while the request runs. A success closes
  the sheet, removes the row and shows a "Session revoked" toast; a failure says so in the sheet
  and keeps the row.

## C. Services (`settings-service`)

- A **search** field (16 px; matches the name and the internal name, ignoring case and accents)
  and the states as **chips with their count** — All, Running, In error, Stopped (every other
  state: stopped, disabled, not loaded). A state no service is in is not offered. The search and
  the chip combine; "No service matches." when nothing is left.
- One row per service: its name (the translated name of its integration), its internal name, and
  its **state as a pill with its word** (green when running, red in error, orange when stopped
  by the user, neutral otherwise).
- **A service is started and stopped from its sheet, not from the list**: stopping Zigbee2mqtt
  must not be one stray tap in a list of forty rows. Tapping a row opens a sheet titled with the
  service: the sentence explaining its state (the tooltip of the desktop table, which a touch
  screen cannot show), a "Service started" switch — not offered for a service that is disabled or
  not loaded, as in the table — its internal name and its state, and "Open the integration" when
  the service has a page. The switch calls the same `actionOnService`; while the request runs it
  is disabled and the row says "Starting…" / "Stopping…"; a failure says so in the sheet.

## D. Background jobs (`settings-background-jobs`)

- A one-line lead instead of the paragraph of the card.
- One row per job: an icon and a pill for its status ("Success", "Failure", or **its progress in
  percent** while it runs, with a progress bar under its details), its type, when it started, and
  on the whole width of the row what it did — the same `JobData` renderers as the table (target,
  counts, current step) and its duration.
- **Errors are readable where they are**: wrapped, never wider than the row. An error Gladys
  knows is shown as its sentence; an unknown one is shown as it was thrown, in a monospace block
  folded on four lines when it is long (a stack trace), with "Show the whole error" / "Show
  less".
- Pagination: "Previous" and "Next" as two 52 px buttons, disabled at the ends, hidden when
  there is a single page.

## E. Backups (`settings-backup`)

- The description, the alert when the backups are failing (`GatewayBackupHealth`, unchanged) and
  the error of the last restoration first; then **"Backup now" as the primary button** (a spinner
  while the request runs, "Backup started…" once it is accepted — the page then leads to the
  jobs, as before).
- "N backups": one row per backup — its date and time, how long ago, its size.
- **A restoration is confirmed.** Tapping a backup opens a confirmation sheet: "Gladys will go
  back to its state of <date> and restart. Everything changed since then will be lost.", with a
  destructive "Restore backup". Confirming calls the same `restoreBackup` action; the button
  shows a spinner while the request runs, and a restoration that does not start says so in the
  sheet. Once started, the page shows the restoration in progress, as before.
- No backup yet, backups that cannot be loaded: each says so. Without Gladys Plus, or with a plan
  without backups, the page is the same card as on a wider screen.

## F. System (`settings-system`)

One column, in this order:

1. **Status** — one row per figure, its value on the right: connection (ping), disk, host IP
   and CPU temperature when known (its icon turns orange from 60 °C and red from 75 °C), uptime,
   version. Readable at 320 px, where five tiles are not.
2. **Updates** — what the "Operations" card says. Up to date: a row with the version as a pill
   and "Check for updates" (its icon spins while it checks; the result shows above the button).
   An update available: the version, the explanation, the warnings (fixed image, no Docker), the
   error of a failed update, and **"Update now", which is confirmed** ("Gladys restarts during
   the update and is unavailable for a few minutes."). While the update runs, the Watchtower
   messages are shown in full in the page, wrapped — not in a 300 px scroll box.
3. **Containers** — one row per container (name, age, state as a pill), in the flow of the page.
4. **Preferences** then **Maintenance** — the cards of the desktop page, **the same
   components**, dressed for a thumb by their wrapper: fields 48 px high and 16 px (the time zone
   list included), buttons at least 44 px and full width, one under the other; the "Save" of the
   local address goes under its field group so the name stays readable. Preferences: time zone,
   clock, local address, battery alert, system messages, history retention, state expiry.
   Maintenance: logs, database cleaning, DuckDB migration, and the power of the host last.
5. **Nothing restarts or stops on a single tap.** Cleaning the database (Gladys is unavailable
   meanwhile) and rebooting or shutting down the host are confirmed in a sheet on a phone; the
   DuckDB migration and purge keep their inline confirmation.

## G. Open API keys (`settings-gateway-open-api`, Gladys Plus)

- The description, then **"Create an API key" as the primary button**, then "N keys": one row
  per key — its name, when it was created, when it was last used ("Never used") — with a 44 px
  revoke button.
- **A key is created in a sheet**: its name (required: "Give the key a name."), "Generate", then
  the same sheet shows **the key, once**, under the warning that it will not be shown again, with
  **"Copy the key"** (the button says "Key copied"; where the clipboard is not available, the
  key is selected so the system "Copy" is one tap away) and "Done". Until the page is left, the
  key also stays readable in its row, as in the table.
- **Revoking is confirmed** in a sheet naming the key; a success shows a "Key revoked" toast, a
  failure says so in the sheet.

## H. What does not change

- From 768 px: every page as before.
- The containers, the store actions and the requests: `revokeSession`, `actionOnService`,
  `getJobs`, `createBackup` / `restoreBackup`, the system requests, the gateway client calls. The
  only additions are read-only: the sessions page also reads the session and the status of a
  revocation from the store, the backups page the status of its requests.

## I. Tests

- Cypress, phone viewport, `front/cypress/e2e/routes/settings/SettingsMobile.cy.js` (the lists
  are stubbed, so nothing real is revoked, stopped, restored or restarted):
  - sessions: the rows and their names, this device first with its pill, a 44 px revoke button;
    a revocation cancelled (no request), confirmed (the request, the toast, the row gone), failed
    (the error in the sheet, the row kept);
  - services: the rows and their state, the 16 px search, the chips, the search, no result; a
    service stopped from its sheet (the request, the switch, the pill in the sheet and in the
    list); no switch for a disabled service; "Open the integration";
  - jobs: the rows, the progress of a running job, a known error, a long error folded then
    opened, nothing scrolling sideways; the two pages;
  - backups: the rows, a restoration cancelled (no request), confirmed (the payload), failing
    (the error in the sheet); "Backup now" leading to the jobs;
  - system: the status rows and the containers, 16 px fields, nothing scrolling sideways; an
    update cancelled (no request), confirmed, in progress with a Watchtower message; the cleaning
    and the reboot confirmed before their request;
  - on a wider screen, each page keeps its table (its tiles for System).
- The Open API keys page only exists in a Gladys Plus build (its route is compiled out
  otherwise, and its requests go through the end-to-end encrypted gateway client): it is checked
  in a phone emulation (Playwright) with an in-memory gateway client — the keys, a name refused
  when empty, the key shown once and copied to the clipboard, a revocation confirmed.
- Every page is also checked in a phone emulation at 390 px and 320 px, light and dark: no
  horizontal scroll, no field below 16 px, no target below 44 px (links inside a sentence
  excepted).
