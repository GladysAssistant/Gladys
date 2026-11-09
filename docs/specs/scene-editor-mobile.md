# Scenes on mobile — a mobile-native list and editor

> **Living specification — source of truth.** This document specifies how the scene list and the
> scene editor behave on a phone, and the editor behaviors shared by every screen size (unsaved
> changes, local draft, save errors, step summaries). **Rule: any PR that changes one of these
> behaviors modifies this file in the same diff.**
>
> Status: **phase 1 implemented** (sections C to F). Section G lists what is designed but not built
> yet.

## A. Context

A field report from the maintainer, after editing scenes from an iPhone over a weekend: the scene
pages are usable on a phone, but they are a desktop form that wraps, not an app. A mobile UI/UX
audit of `front/src/routes/scene/**`, run in an iPhone 13 (390 px) and iPhone SE (320 px) emulation,
measured the problems:

1. **Edits are lost silently.** The back button, the iOS swipe-back gesture and a reload leave the
   editor without a word; nothing keeps the unsaved changes.
2. **No save state on a phone.** The "Unsaved changes / Saved" indicator is hidden below 576 px, and
   a save error is shown at the top of a page the user is at the bottom of.
3. **iOS zooms into every field.** Fields are 15 px; iOS Safari zooms on focus below 16 px.
4. **Tiny, destructive targets.** Move / delete / expand are 15×17 px, side by side, the delete in
   the middle, with neither confirmation nor undo.
5. **Desktop pickers in the page flow.** The type picker opens at the bottom of the page, half
   under the footer, in a box that scrolls inside the page.
6. **Chrome before content.** The app bar plus the footer take ~20 % of the screen; on an iPhone SE
   no step is visible when a scene opens.

The answer is a different interaction model on phones, not more media queries: **read the scene as
a timeline, edit each element in a bottom sheet**, with the pickers made for a thumb and a save
model that never loses work.

## B. Scope and principles

- **Breakpoint.** "Mobile" is a viewport narrower than **768 px** (`(max-width: 767.98px)`),
  evaluated with `matchMedia` and re-evaluated when it changes (rotation, window resize). From
  768 px up, the list and the editor keep their current layout.
- **No data model or API change.** The mobile editor edits the same `scene` object with the same
  mutations as the desktop editor (`front/src/routes/scene/edit-scene/index.js`: `addAction`,
  `deleteAction`, `deleteActionGroup`, `moveCardGroup`, `updateActionProperty`, `addTrigger`…). The
  variable-path bookkeeping those mutations carry (renaming `{{1.0.…}}` references when steps move)
  is therefore shared, never re-implemented.
- **The step and trigger parameter forms are shared.** A sheet renders the very component the
  desktop card renders (`actionComponents.js`, `TriggerParams.jsx`). Phase 1 changes the shell
  around the forms, not the forms themselves (except the shared fixes of section C).
- **Mobile-native means:** one decision per screen or sheet, primary actions in the bottom third,
  rare actions behind "•••", every touch target ≥ 44 px, fields ≥ 16 px, no nested scroll areas,
  and nothing destructive without an undo or a confirmation.

## C. Behaviors shared by every screen size

### C.1 Step summaries name things

A collapsed step (desktop card, mobile row) shows a one-line summary (`summary.js`). Light, switch
and blink steps show **device names** (resolved through the devices the editor loads), not
selectors: "Kitchen spots", not `kitchen-spots`. A selector whose device is unknown (deleted, or
devices not loaded yet) is shown as is.

### C.2 Unsaved changes are never lost silently

"Unsaved" means the scene differs from the last version the server acknowledged
(`savedSceneSnapshot`); the `active` switch is excluded (it is persisted on its own).

The step forms normalize their step when they mount (a default unit, the `if` / `then` / `else`
arrays of a block…). Those writes are not changes: about 1.5 s after the load, once every form is
mounted, if the user has not acted on the editor yet (no input, no change, no key press on a
field or a focused step other than Tab / Escape / modifiers — the steps also move with the arrow
keys; a key pressed on the page itself only scrolls it —, no click other than a
navigation one — back, opening a row or a sheet, closing it, the active switch, save / test / run
/ stop: the elements marked `data-not-an-edit` and the sheet backdrops), the saved version is
re-based on the normalized
scene. Before that moment, the back control leaves without asking when the user has not acted
(whatever differs is normalization; a draft from an earlier session stays stored). Without this,
the leave guard would ask about a scene nobody edited.

1. **Leave guard.** Leaving the editor through its back control with unsaved changes opens a
   confirmation: **Save and leave** / **Leave without saving** (destructive) / **Keep editing**. It
   is a bottom sheet on a phone and a centered dialog from 576 px. **Keep editing** while a *Save
   and leave* is in flight cancels the leave: the save may land, the editor stays; so does leaving
   the editor another way (browser history) before the save lands.
2. **Reload / tab close.** While there are unsaved changes, the page registers a `beforeunload`
   handler (the browser shows its own prompt).
3. **Local draft.** While there are unsaved changes, the editor writes a draft to `localStorage`
   (key `gladys-scene-draft:<user id>:<scene selector>`, debounced ~500 ms):
   `{ version: 1, base: <saved version without its server-managed fields>, scene: <scene>, saved_at: <ISO date> }`.
   The server-managed fields — `active` (patched on its own), `updated_at`, `last_executed`,
   `created_at` — are left out of the base, so a toggle or a run never orphans a draft; a restored
   draft takes them from the version just loaded.
   The page's `beforeunload` writes the pending draft at once, an edit made while the forms
   settle included. After a logout (the session reset
   clears the storage and marks the session disconnected, local and Gladys Plus sessions alike),
   the editor writes nothing back: a draft never outlives its session, and
   the user id in the key keeps another account of the same browser from ever reading it.
   Edits made while the forms settle are written as soon as the drafts are enabled (the end of
   that window), and a write still pending when the editor unmounts (swipe-back, global
   navigation) is flushed then — including an edit made before the window ended.
   - The draft is removed when the scene is saved (edits made while the save was in flight are
     written again at once, against the version just saved — also when the save lands after the
     editor is gone), when the user leaves without saving,
     when the scene is deleted, and when the edits are undone back to the saved version. A draft
     offered back (banner below) and neither restored, discarded nor superseded by a save stays
     stored when the user leaves (not when the scene is deleted); a save closes the banner.
   - When the editor opens a scene and finds a draft **whose `base` equals the scene just loaded
     from the server** (or its normalized version, server-managed fields left out of both), it shows a banner: "Unsaved changes from <relative date> were kept" with
     **Restore** / **Discard**. Restore loads the draft scene (variables are re-initialized from it,
     as on load) and shows it as unsaved. A draft whose base differs (the scene was saved elsewhere
     since) is discarded silently: restoring it would overwrite newer work; edits made meanwhile
     are written in its place.
   - Every `localStorage` access is guarded: storage may be unavailable (private mode, quota); the
     editor then works without drafts.
   - This is what protects the cases no guard can catch: the iOS swipe-back gesture, the global
     navigation, and iOS killing the home-screen app in the background.

### C.3 Save errors are visible

A failed save (client-side validation or server refusal) shows the existing error alert **and
brings it into view**: the page scrolls to the alert on desktop; on a phone the error is shown in
a sticky banner above the bottom bar, so it is visible wherever the user is.

### C.4 Fields never trigger the iOS zoom

Below 768 px, every text field, select and react-select input of the scene pages has a computed
`font-size` of at least 16 px.

### C.5 The condition picker speaks about conditions

When the type picker chooses a **condition** (the "if" list of an if/while block), its search field
says "Search for a condition…", and the descriptions come from `editScene.conditionsDescriptions`
(falling back to `editScene.actionsDescriptions` for a type with no condition-specific text). The
"only continue if" type is described as "Compare variables", not "Stop the scene here if…", which
is wrong inside an if block.

## D. Mobile scene list (`/dashboard/scene`, < 768 px)

### D.1 Layout

From top to bottom: the page title, a full-width search field (16 px), a horizontally scrolling row
of **tag chips** ("All" + one chip per tag, multi-select, same URL parameters as today: `search`,
`tags`), then the scene rows. The sort select is not shown on a phone (the order of the URL is
still applied). A **floating "+" button** (60 px, bottom right, above the safe area) creates a
scene.

### D.2 A scene row

A row is ≥ 64 px high and holds: the scene icon tile (44 px), the name (16 px, one line), the
description (one line, ellipsis), and a third line with the last execution ("Last run 6 hours ago",
from `last_executed`, relative and localized; "Never run" when null). A disabled scene shows a gray
icon tile and a "Disabled ·" prefix on its second line. Tapping the row opens the editor (keeping
the list's search and tags in the URL, as today). On the right, a **44 px round play button** starts
the scene; while it runs, the button becomes the existing running/stop control (`RunningStopButton`).

### D.3 Swipe actions

Swiping a row to the left reveals two actions: **Disable / Enable** (patches `active`, as the
desktop switch does) and **Duplicate** (opens the existing duplicate page). The gesture only starts
on a clear horizontal move (> 8 px and more horizontal than vertical), so vertical scrolling is not
captured; releasing past half of the actions' width keeps them open, otherwise the row snaps back.
Tapping anywhere else closes an open row. A hint under the list says the gesture exists.

### D.4 Creating a scene

The "+" button opens a **New scene** bottom sheet asking for the **name only** (autofocused,
`enterkeyhint="go"`). The icon is **guessed from the name**
(`front/src/routes/scene/guessSceneIcon.js`: the first rule whose keyword appears in the name,
compared without case nor accents with the **whole words** of the name — a keyword ending with
`*` is a stem matching the words that start with it — in the four languages of the interface —
night → `moon`,
morning / wake → `sunrise`, leave → `log-out`, water / leak → `droplet`, solar → `sun`, movie /
TV → `film`, alarm → `shield`, home / back → `home`, heating → `thermometer`, music → `music`,
reminder → `bell`, light → `zap`; `zap` when nothing matches) and previewed in the sheet; it can be changed later in the scene settings. Creating posts
the scene (same payload as the desktop page) and opens the editor with `?new=1`: on a phone, the
editor then opens the **trigger type picker** right away (the first thing a new scene needs). A
409 shows "A scene with this name already exists" in the sheet. The `/dashboard/scene/new` page is
unchanged and stays reachable.

## E. Mobile scene editor (`/dashboard/scene/:selector`, < 768 px)

### E.1 Chrome

- The app's mobile top bar is hidden while the editor is shown (`body.gladys-focus-page`); the
  editor brings its own **navigation bar** (56 px): "‹ Scenes" on the left (the leave guard of C.2
  applies), the scene icon and name in the middle (tap = scene settings), "•••" on the right.
- Under it, a **status line**: "Scene active / disabled" with a labelled switch (patched on its own,
  as today) and the last execution.
- The content scrolls between the navigation bar and the **bottom bar** (E.7); there is no other
  scroll area on the page.

### E.2 "When" — triggers

Each trigger is a **row** (≥ 64 px, the whole row is the button): type icon tile, type label, and
the trigger summary. Rows are separated by an "OR" pill. "+ Or when…" below the rows opens the
trigger type picker. A scene with no trigger shows a single dashed "Choose a trigger" button.

### E.3 "Then" — the timeline

The action groups of the root level render as a **numbered vertical timeline**:

- a group with **one action** is one row (icon tile, type label, summary);
- a group with **several actions** is one card "AT THE SAME TIME" holding one row per action (an
  if/while block keeps its branches there too) and a "+ Simultaneous action" button;
- an **if/then/else** or **while** action is one card: its header row ("If" / "While" + the
  conditions' summary, opening the block's sheet), then the **Then** branch (or **Repeat** for a
  while) and the **Else** branch (if/then/else only) as indented lists of rows, each with its
  "+ Add to Then / Else / Repeat" button. A branch with no action shows "No action".
- The groups of a branch are rendered with the same rules, recursively (a group of several
  actions is an "AT THE SAME TIME" card with its own "+ Simultaneous action" button), each level
  indented behind a thin rail (blue for Then / Repeat, gray for Else).
- The trailing empty groups the data model keeps at the end of every level are never rendered.
- While the scene runs, the root row whose action is executing is marked (the existing
  `scene.executing-action` websocket events, already used by the desktop editor).
- "+ Add a step" (dashed, full width) ends the timeline; a scene with no step shows "Add a first
  step" instead. A hint says rows can be swiped.

### E.4 Sheets

- Tapping a row opens **its sheet**: a bottom sheet (portaled on `<body>`, closing on the backdrop,
  on "OK" and on Escape, page scroll locked while open, focus kept inside) titled with the type
  label, holding **the parameter form of that step or trigger**, followed by a list of actions:
  - for a step: **Add a simultaneous action** (not for if/while), **Insert a step after** (root
    steps only), **Delete the step**;
  - for a trigger: **Delete the trigger**;
  - for an if/while block: its own fields (the while's max iterations), its **conditions as rows**
    (each opening its own sheet, stacked above) and "+ Add a condition".
- Sheets **stack**: a condition sheet opens above its block's sheet; closing it returns to the
  block.
- **Invariant — every form stays mounted.** The step and trigger forms register the variables they
  expose (`setVariables`, `setVariablesTrigger`) and initialize their action (`if`/`then`/`else`
  arrays…) when they mount. So the mobile editor mounts **one sheet per action and per trigger, for
  the whole scene, all the time**, and only shows the open ones. A sheet never mounts its form on
  opening. (The desktop editor keeps the same invariant by hiding collapsed card bodies.)
- Sheets are addressed by position (path, trigger index). After a change of structure — a step,
  condition or trigger inserted, deleted, moved, or an undo — every sheet is remounted (keys carry a
  structure version), so no form keeps the local state of the step that used to sit at its
  position.
- **Adding** a step, a condition or a trigger first adds an empty one (`type: null`) through the
  shared mutations, then opens its sheet on the **type picker** (E.5). Picking a type turns the
  same sheet into the parameter form: one transition. Closing the sheet while the type is still
  `null` removes the empty element (nothing half-created is left in the scene).

### E.5 Type picker sheet

The type picker (`TypePicker.jsx`, unchanged content: search, categories, descriptions, external
integration declarations) fills a sheet of 92 % of the viewport height, with no inner scroll box of
its own, and **focuses its search field** when it opens.

### E.6 Deleting and undoing

- Swiping a step, condition or trigger row to the left reveals **Delete** (same gesture rules as
  D.3). The sheet's "Delete" button does the same.
- A deletion shows a toast "Step deleted" / "Trigger deleted" / "Condition deleted" with **Undo**
  for 5 seconds. Undo restores the scene (and its variables) as they were just before the deletion,
  except the active switch, which keeps its current (server) value.
- Deleting the scene itself is confirmed in a sheet ("Delete “<name>”? This cannot be undone.").

### E.7 Bottom bar

A frosted bar fixed at the bottom (above the safe area) whose content follows the state:

| State | Content |
|---|---|
| Saved, not running | **Run the scene** (full width) |
| Saved, running | the running/stop control, full width |
| Unsaved changes | "● N changes" · **Test** · **Save** |
| Unsaved changes, running | "● N changes" · the running/stop control · **Save** |
| Saving | the buttons disabled, a spinner in **Save** |
| Reorder mode | **Done** |

- "N changes" counts the triggers and root steps that differ from the saved version, plus one per
  changed setting (name, description, icon, tags), plus one if only the order changed.
- **Test** saves, then starts the scene: on a phone, starting always runs what is on screen. (The
  desktop "Start" button keeps its current behavior.)
- A successful save shows a "Scene saved" toast.

### E.8 "•••" menu

A sheet with: **Name, icon and tags** (the settings form in a sheet), **Reorder steps**, **Duplicate
the scene** (the existing duplicate page), and **Delete the scene** (destructive, confirmed — E.6).

### E.9 Reorder mode

Lists the root steps with a ⊖ delete button and ↑ / ↓ buttons (44 px each) per step; the moves go
through `moveCardGroup`, so variable references follow the steps. "Done" (bottom bar or navigation
bar) leaves the mode. Steps inside branches keep their order in this phase (G).

## F. Accessibility and motion

- Every control is a real `<button>`/`<a>`/`<input>`, with an `aria-label` when it has no visible
  text; switches use `role="switch"` and `aria-checked`.
- Sheets are `role="dialog"` with `aria-modal="true"`, named by their title, trap the focus and
  give it back to the element that opened them.
- Toasts are `role="status"`.
- Swipe actions always have a non-gesture equivalent (the sheet buttons, the menu, reorder mode).
- Sheet and toast animations are skipped under `prefers-reduced-motion: reduce`.
- Dark mode: the new surfaces follow the app-wide inversion like the other Horizon sheets.

## G. Designed, not built yet (phase 2)

- **Device picker by room** (full-height sheet, search, rows with check marks) replacing the
  react-select device fields on a phone.
- **Day pills** (M T W T F S S + "Weekdays / Weekend / Every day") and the native
  `<input type="time">` in the scheduled trigger.
- **"Insert a value" chip bar** above text fields accepting variables, replacing the typed `{{`.
- Long-press drag & drop in the timeline (the shared pointer engine already supports touch), and
  reordering inside branches.
- Opening a deeply nested branch (3+ levels) in its own sheet with a breadcrumb.
- **Test a draft without saving** (needs a server endpoint running an unsaved scene).
- Scene templates in the creation sheet.
- Bringing the timeline + sheet model to the desktop editor (side panel instead of a sheet).

## H. Tests

- Cypress, desktop viewport (unchanged default): the existing scene specs keep passing.
- Cypress, phone viewport (`cy.viewport('iphone-x')`), `front/cypress/e2e/routes/scene/SceneMobile.cy.js`:
  create a scene from the "+" sheet (name only), add a trigger and a step through the type picker
  sheets, see the bottom bar switch to "unsaved", save, delete a step from its sheet and undo, get
  the leave guard on "‹ Scenes", add a step to the Then branch of an if block, leave a scene the
  forms normalize without being asked, get a
  draft back after a reload, disable the scene from its status line, delete it from the menu.
- The swipe gesture itself (`SwipeRow`) is not driven by Cypress: the pointer events Cypress
  synthesizes do not reach the row's handlers in its browser. It is checked in a phone emulation
  with a real pointer (Playwright); every swipe action has a non-gesture equivalent that the specs
  above cover.
