# Houses and rooms on a phone

> Part of [`mobile-pages`](README.md) — principles and kit there. **Any PR that changes one of
> these behaviors modifies this file in the same diff.**

## A. Context

`/dashboard/settings/house` lists the houses and edits each of them: its name, where it is, its
rooms, its alarm code. From 768 px it is an accordion (`HouseCard`) opening the form
`components/house/EditHouse.jsx`. On a phone that form was a desktop form that wraps:

- a 300 px interactive map in the middle of the page: a finger scrolling the page pans the map
  instead, and the house can only be placed by zooming in from a view of the whole world;
- the rooms as a column of small text fields, each with a `×` that removes the room on a tap;
- "Save" and "Delete" at the very end of the page, next to each other, with a "Saved" notice
  that shows where the user is not;
- nothing uses what a phone knows: **where it is**.

The location pieces are shared with the house step of the onboarding
([`onboarding.md`](onboarding.md), C.4).

## B. The list (< 768 px)

- The page keeps the app's top bar and the settings menu (a list page, README C.1): its title, a
  sentence, a **search** field (the same store action as the desktop one; the sort select is not
  shown, the order is still applied), then **one row per house** — the house icon, its name and
  what it holds on one line: "6 rooms · Located · Alarm code set". A house with local changes
  that are not saved shows the "Unsaved changes" pill, a house that was never saved "Not saved
  yet".
- A floating **"+"** creates a house (the store action of the desktop button) and opens it. With
  no house at all, an empty state offers the same action; a search without result says so.
- Tapping a row opens the house **in a focus view that takes the place of the list** (C). There
  is no route per house — a house that was never saved has no selector yet — so the view is a
  state of the page. To the system it still behaves like a page:
  - opening the editor adds **one entry of the same URL** to the history; the system "back" (the
    Android button, the iOS edge swipe, the browser button) leaves that entry, which **closes the
    editor** instead of leaving the settings — through the leave guard when there are unsaved
    changes (the editor stays, its entry is put back, and the guard asks);
  - closing the editor from its own controls goes back in the history (past the entry a sheet
    may have left above it, `sheetHistory.js`). If that traversal does not happen, the editor
    still closes;
  - the entry carries the id of the editor it belongs to: after a reload of the page made while
    an editor was open, the entry found there is not taken for a live one (it becomes an ordinary
    entry of the page);
  - the list comes back where it was scrolled.
- A toast confirms what happened to the house that was open: "Saved", "House deleted"
  (README C.6). It belongs to the page, so it is still there when the editor closes.

## C. Editing a house (< 768 px)

A focus page (README C.1): "‹ Houses", the name of the house as the title, the save in the bottom
bar. It is rendered by the container of the desktop form (`EditHouseComponent`, `mobile` prop):
the validation, the store actions (`actions/house.js`) and the requests are the same.

### C.1 Name

A text field (40 characters at most), with its error next to it when it is empty.

### C.2 Location (`MobileLocationField`)

One sentence says what the position is for (weather, sunrise and sunset, presence) and that it is
optional. Then three ways to set it, from the fastest on a phone to the most precise:

- **Use my current location** (`LocateMeButton`): asks the browser for the position
  (`navigator.geolocation`, high accuracy, 15 s) and sets the house there. When the browser
  cannot answer, the reason is said under the button:
  - the page is not served over a secure connection (`window.isSecureContext === false`: a local
    address typed in the browser) — browsers only share the position over HTTPS, and the message
    says so and points to the two other ways;
  - the permission was refused;
  - the position is not available (no fix, timeout, no geolocation at all).
- **Address search** (`AddressSearch`, `mobile` prop: the search is the same Nominatim request,
  on an explicit action only): a search field and its button as one control, the keyboard's
  "search" key, and the results as **rows** — tapping one sets the position. The notice about the
  third-party service stays under the field.
- **The map**. The map of the page is a **preview**: it shows the pin (zoomed on the house when
  it is located, the world otherwise) and **takes no gesture** — the page scrolls under the
  finger. One button over it, "Place on the map" / "Adjust on the map", opens the **map in a
  full-height sheet**: there, a tap moves the pin, and the map pans and zooms freely (the sheet
  is not dragged down from the map, `data-no-sheet-drag`). **OK** closes the sheet; the position
  is part of the unsaved changes like every other field.

Under the preview, one line says whether the position is set.

`components/house/Map.jsx` serves the three maps (desktop form, preview, sheet): `interactive`
false removes every gesture, `zoom` is how close a located house opens, `class` sizes it. Its
Leaflet map is removed two animation frames after the component unmounts: the basemap layer
(maplibre-gl-leaflet) settles a resize or a zoom on the next frame without checking that its map
is still there, and a page switching between its phone and desktop layouts unmounts the map in
the very resize that queued that frame.

### C.3 Rooms

- The section title counts them ("6 rooms"), with an **Add** action on its right. Each room is a
  **row**; a room added since the last save says "Not saved yet". A house with no room shows one
  dashed button, "Add the rooms of the house".
- **Tapping a room** opens its sheet: its name in a field, and "Delete the room". The new name is
  applied when the sheet is validated (**OK**, or the keyboard's key): an empty name or the name
  of another room of the house is refused with a message, and never reaches the house.
- **Deleting a room** is local until the house is saved (as on desktop: a saved room is flagged,
  a new one is dropped), so it needs no confirmation: a toast "“Kitchen” deleted" offers **Undo**
  for 5 seconds. A footnote in the sheet says what the deletion does to the devices of the room.
- **Add** opens a sheet that stays open while several rooms are added:
  - a field and its "Add" button (the keyboard's key adds too); a name already in the house is
    refused with a message;
  - **Common rooms** (`RoomSuggestions`): living room, kitchen, bedroom, bathroom, entrance,
    office, dining room, kids' room, toilet, garage, laundry room, garden — in the language of
    the user (`housesSettings.mobile.roomSuggestions`), without the ones the house already has
    saved. A chip is a **toggle** (`aria-pressed`): a tap adds the room, another tap removes the
    room it just added. The rooms typed in the field join the chips, selected.

### C.4 Alarm

- The **alarm code**: a numeric keypad (`inputmode="numeric"`), hidden like a password, with a
  reveal button in the same control; its error next to it (4 to 8 digits). A footnote says what
  the code is for.
- The **delay before arming**: the native list of the system, with a footnote saying when it
  applies.

### C.5 Saving, leaving, deleting

- **Bottom bar** (README C.4): "● Unsaved changes" — "● Not saved yet" for a house that was never
  saved — and **Save**, disabled while nothing changed or while a field is invalid, with a
  spinner while the save is in flight. A failed save (validation, a house or a room of the same
  name, any other failure) shows its message in the bar, with a close button.
- **Leave guard** (README C.4) on "‹ Houses" and on the system "back": **Save and leave** (leaves
  once the save went through, stays when it failed or when a field is invalid) / **Leave without
  saving** / **Keep editing**. Leaving without saving drops the local edits: the houses are
  loaded again from the server (a house that was never saved disappears). `beforeunload` is
  registered while the house has unsaved changes.
- **Delete house**, at the end of the page, opens a confirmation sheet naming the house
  (`ConfirmSheet`, README C.5). The editor closes when the house is gone; a deletion that failed
  shows its error in the bottom bar.

## D. What does not change

- From 768 px: the accordion and the form, as before.
- The containers (`routes/settings/settings-house/index.js`, `EditHouseComponent`), the store
  actions and every request and payload. The phone layout adds no request: the address search
  and the geolocation run in the browser.
- The existing translations of the form are reused; the new ones are under
  `housesSettings.mobile`.

## E. Tests

- Cypress, phone viewport, `front/cypress/e2e/routes/settings/HousesMobile.cy.js`: the houses as
  rows and a house opened in the focus view (the list and the settings menu give way, 16 px
  fields, nothing scrolling sideways, a clean editor left without a question); a room renamed
  (a taken name refused), deleted with Undo, rooms added from a suggestion — a toggle — and by
  name, the saved requests and the resulting rooms; the position set from the phone, from an
  address result and the map sheet, and the saved coordinates; the reason given when the position
  of the phone is refused; an invalid alarm code blocking the save, the numeric keypad and the
  reveal button; the leave guard on the back control and on the system "back", and the edits
  dropped; a house created from the "+" and deleted after a confirmation; the accordion kept on a
  wider screen.
- Phone emulation with a real touch screen (Playwright, 390 px and 320 px, light and dark): no
  horizontal scroll, no field below 16 px, no target below 44 px (the attribution links of the
  map excepted), the page scrolling over the preview map, the map of the sheet panned without
  dragging the sheet, a reload made while the editor is open.
