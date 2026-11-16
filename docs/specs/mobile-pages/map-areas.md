# Zones of the map on a phone

> Part of [`mobile-pages`](README.md) — principles and kit there. **Any PR that changes one of
> these behaviors modifies this file in the same diff.**

## A. Context

A zone is a circle on the map — a center and a radius — that scenes use to know when a user
enters or leaves a place. The position of the users comes from Owntracks, **an app that runs on
their phone**: the natural moment to create the "Work" zone is standing at work, phone in hand.

`routes/map/NewArea.jsx` was a desktop form: a card with the name, the radius typed as a number,
a color select, then a 300 px map under the fold where a click places the center. On a phone the
map was a strip one had to scroll to, panning it scrolled the page, the radius could only be
typed blind (no idea of what 150 m covers until the circle is drawn), and "Delete zone" sat next
to "Update zone", deleting on a single tap.

## B. The page (< 768 px)

`/dashboard/maps/area/new` and `/dashboard/maps/area/edit/:areaSelector`, rendered by
`MobileNewArea.jsx` from the state of the same container (`NewArea.jsx`).

- **A focus page** (README C.1): the navigation bar shows "‹ Map", the title — "New zone", or the
  name of the zone being edited — and, for an existing zone, a **delete** button (E).
- **The map fills the screen** between the navigation bar and the panel: the page is exactly as
  high as the screen and never scrolls, so a finger on the map only ever moves the map or the
  zone.
- **The panel** under the map (C.4 of the README does not apply as such: the primary action lives
  in the panel, which is the bottom third of the screen) holds, from top to bottom:
  - a **row** showing the color and the name of the zone, opening the sheet of D — "Name the
    zone", in the accent color, while it has none;
  - the **radius** (D);
  - an error of the last save or deletion, closable;
  - **one line of text**: what is missing to save the zone (C), or how the gestures work;
  - the primary button, **Create zone** / **Update zone**, disabled while something is missing
    or — for an existing zone — while nothing changed, with a spinner while it is in flight.
    Saving goes back to the map, where the zone shows.
- **In landscape** (a screen at most 500 px high) the panel goes **beside** the map, on the
  right, and scrolls by itself if it must: the map keeps the whole height. On a short phone in
  portrait (at most 640 px high) the panel tightens and drops the line about the gestures.
- The attribution of the basemap stays visible above the rounded edge of the panel, on one line
  (smaller, and without the "Leaflet" prefix).
- A zone that cannot be loaded says so in the panel.

## C. Drawing the zone with a finger (`MobileAreaMap.jsx`)

- **A tap** on the map places the center under the finger. When the zone would be too small to
  be seen at the current zoom (a 20 m zone tapped on a map of the country), the map comes closer
  around the tap, four zoom levels at most at a time: a tap from far away is not precise, the
  next ones refine it.
- **The circle is dragged to move the zone.** A press that starts on the circle never reaches
  the map, which does not pan under it; the circle keeps the point it was taken by under the
  finger. A press that moves less than 4 px stays a tap. The **handle of the center** (a 44 px
  target around a dot of the color of the zone) moves the zone the same way, and stays there to
  be taken when the circle is too small on screen.
- **The handle on the edge** (a 44 px target, "↔") is dragged to **resize** the zone: the radius
  is the distance from the center to the finger, rounded to a sensible step (D) and kept within
  the bounds; the circle follows, **the radius is written above the handle** ("150 m",
  "1.2 km") — above, so the finger does not hide it — and the panel shows the same number, live.
  Released, the handle goes back on the edge of the circle, in the direction it was left in. It
  is hidden while the circle is less than 26 px in radius on screen (it would sit on the handle of
  the center): the radius is then set from the panel.
- **Anywhere else**, one finger pans the map and two fingers zoom it, as on any map.
- **The view follows the zone, not the other way round.** A change made from the panel or by
  "my position" / "my house" fits the map to the whole zone, with room for its handle and its
  label and clear of the attribution. A gesture on the map leaves the view to the user: it only
  moves when the zone has left it (a zone dragged or resized past the edge).
- The longitude stored is the one of the main copy of the world, whichever copy was touched.
- The houses that have a position show their pin; a tap on one places the zone there, like a tap
  anywhere else.
- Dark mode rebuilds the map on the other set of tiles, on the same view.

**What is missing.** A zone needs a center, a radius and a name. The panel says which one is
missing, the most basic first — "Tap the map to place the zone.", "Enter the radius of the zone,
from 10 m to 50 km.", "Give the zone a name to save it." — and the primary button stays disabled
until none is: nothing is sent that the server would refuse for a missing field.

**Every gesture has an equivalent without it:**

| Gesture | Equivalent |
| --- | --- |
| Tap, drag of the circle or of its center | **My position** and **My house**, two 44 px buttons over the map |
| Drag of the handle on the edge | The radius controls of the panel (D) |
| Pinch | The zoom buttons of the map |

- **My position** asks the browser for the position (`navigator.geolocation`, high accuracy,
  10 s) and places the zone there; the button shows a spinner meanwhile. When the position is
  refused — or the page is not served over HTTPS, where browsers refuse it — a message says so
  and what to do instead; another one when it cannot be found.
- **My house** places the zone on the house; with several located houses it opens their list in
  a sheet. The button is not shown when no house has a position.
- Both show a message above the panel ("Zone placed at “Home”."), with **Undo** when the zone
  already had a center: it goes back where it was. Messages about the map are shown at the bottom
  of the map, never over the panel, and go after 5 s.

## D. Name, color and radius

- **Name and color** are edited in a sheet (README C.5), closed with **OK** or the Enter key: the
  name (focused when the zone has none), and the color as **44 px swatches** — the six colors of
  the desktop select (`areaColors.js`, shared with `ColorPicker.jsx`), the selected one ringed
  and checked, each named for a screen reader, the name of the selected one written under them.
  The circle on the map takes the color at once.
- **The radius** has three controls, which all write the same value:
  - a **numeric field** (`inputmode="numeric"`, 16 px) with its unit. A value being typed that
    is not a radius yet (empty, or below 10 m on the way to "150") is kept in the field while the
    zone waits; leaving the field brings a value out of bounds back to the nearest bound;
  - a **slider**, logarithmic from **10 m to 50 km** — a zone is as often a house as a town, a
    linear slider would give the houses a few pixels;
  - **− / +** (44 px), going to the next round value below or above.
- The slider, the buttons and the handle of the map stop on round values: every 5 m below 100 m,
  10 m below 500 m, 50 m below 2 km, 100 m below 10 km, 500 m above (`areaRadius.js`). The field
  accepts any whole number of meters within the bounds. The radius of an existing zone outside
  these bounds is shown as it is and only changes when a control is used.

## E. Leaving and deleting

- **Leave guard** (README C.4): "‹ Map" with unsaved changes opens the confirmation — **Save and
  leave** (not offered while the zone cannot be saved), **Leave without saving**, **Keep
  editing** — and the page registers `beforeunload` meanwhile. "Changed" compares the name, the
  color, the radius and the center with the zone as loaded (or with an empty new zone).
- **Deleting** an existing zone is confirmed in a sheet (README C.5) that names it and says that
  the scenes it triggers will no longer run; then the page goes back to the map. A failed
  deletion shows in the panel.

## F. The map page on a phone (`routes/map/Map.jsx`)

- **"Create new zone"** comes down to the bottom right of the map, above the attribution, where
  a thumb reaches it (it stays at the top right from 768 px).
- **Opening a zone**: the 18 px handle of a zone gets an invisible 44 px target, and its name —
  the largest thing to aim at — opens it too.

## G. What does not change

- From 768 px: the card form (`NewArea.jsx`, `NewAreaMap.jsx`), as before.
- The requests and their payload: `POST /api/v1/area` and `PATCH /api/v1/area/:selector` with
  `name`, `color`, `radius`, `latitude`, `longitude`; `DELETE /api/v1/area/:selector`. The phone
  layout sends the radius as a number.
- The container keeps the state and the requests; the phone layout calls `setName`, `setColor`,
  `setLatLong`, `setRadiusValue`, `saveArea` and `removeArea`.

## H. Tests

- Cypress, phone viewport, `front/cypress/e2e/routes/maps/MapsMobile.cy.js`: "Create new zone"
  in the lower half of the map page, the zone page as a focus page with the map and the save both
  on screen and a 16 px field; what is missing said in turn (center, radius, name) with the save
  disabled, a tap placing the zone, the radius typed then stepped and written on the map, the name
  and the color in their sheet, the created payload; the leave guard (keep editing, leave without
  saving) and a zone that did not change left at once; a zone edited (name, color, radius from the
  slider and its upper bound, place) and the updated payload; a deletion cancelled then confirmed;
  the card form kept on a wider screen.
- Cypress, desktop viewport: `Maps.cy.js` unchanged.
- The finger gestures need a touch screen and are checked in a phone emulation with real touch
  events (Playwright, portrait and landscape): the circle dragged (the zone moves by the distance
  of the finger, the map does not pan), the handle of the edge dragged outward and inward (the
  radius, its label and the field follow during the drag and keep their value on release), the
  handle of the center dragged, a drag and a pinch outside the zone still panning and zooming the
  map, a tap, the slider dragged with a finger and the map fitted to the zone, the saved payload;
  "my position" refused then allowed, "my house" and its Undo; a zone opened from the map page by
  a tap on its name and beside its handle.
