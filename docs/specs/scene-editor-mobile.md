# Scenes on mobile — a mobile-native list and editor

> **Living specification — source of truth.** This document specifies how the scene list and the
> scene editor behave on a phone, and the editor behaviors shared by every screen size (unsaved
> changes, local draft, save errors, step summaries). **Rule: any PR that changes one of these
> behaviors modifies this file in the same diff.**
>
> Status: **phases 1 and 2 implemented** (sections C to F). Section G lists what is designed but
> not built yet.

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

- **Breakpoint.** "Mobile" is a viewport narrower than **768 px**, or **a phone held in
  landscape**: a touch screen at most 500 px high
  (`(max-width: 767.98px), (max-height: 500px) and (pointer: coarse)`, `utils/mobileViewport.js`),
  evaluated with `matchMedia` and re-evaluated when it changes (rotation, window resize). A phone
  in landscape is wider than 768 px, but it is the same device: turning it must not swap the
  mobile editor for the desktop one in the middle of an edit (open sheets and all). A tablet is
  higher than 500 px and a low desktop window has a mouse: both keep the current layout, as does
  every other screen from 768 px up.
- **Landscape.** On a low screen the content keeps the width of a phone (40 rem, centered, clear
  of the notch through the safe-area insets), a sheet is a dialog taking the height there is, and
  the bottom bar is thinner.
- **No data model or API change.** The mobile editor edits the same `scene` object with the same
  mutations as the desktop editor (`front/src/routes/scene/edit-scene/index.js`: `addAction`,
  `deleteAction`, `deleteActionGroup`, `moveCardGroup`, `updateActionProperty`, `addTrigger`…). The
  variable-path bookkeeping those mutations carry (renaming `{{1.0.…}}` references when steps move)
  is therefore shared, never re-implemented.
- **The step and trigger parameter forms are shared.** A sheet renders the very component the
  desktop card renders (`actionComponents.js`, `TriggerParams.jsx`). The sheet dresses that form
  for a phone (E.11) — its styles, plus a few fields that render another control below 768 px
  (the device fields of E.10, the times, dates and days of E.11) — but there is one form per step
  type, never a mobile copy of it.
- **Mobile-native means:** one decision per screen or sheet, primary actions in the bottom third,
  rare actions behind "•••", every touch target ≥ 44 px, fields ≥ 16 px, no nested scroll areas,
  and nothing destructive without an undo or a confirmation.

## C. Behaviors shared by every screen size

### C.1 Summaries name things

A collapsed step or trigger (desktop card, mobile row) shows a short summary (`summary.js`). **A
summary never shows an identifier whose name the editor knows:**

- **Devices and features** (resolved through the devices the editor loads): "Kitchen spots", not
  `kitchen-spots`. A device state trigger names its feature ("Living room sensor (Temperature)");
  with several features of one kind, the device names alone ("Hall motion, Bedroom motion").
- **Values**: the label of a constant ("Open", not `1`), a number with its unit ("< 18 °C"), and
  the operators as signs (≠, ≥, ≤).
- **Users, houses, scenes, calendars and areas**: the first name of the user, the name of the
  others ("Tony · Home", not `tony · home`; "Good night", not `good-night-ob31`). The editor loads
  those lists when it opens (`getNames`: one request per list, each failing on its own).
- **Variables**: the label the step exposing it declared — a condition reads "Living room sensor
  (Temperature) < 19", not `0.0.last_value < 19`, and a text typed with variables shows them
  between brackets ("It is [Living room sensor (Temperature)] °C").

Anything unknown (deleted, or not loaded yet) is shown as is. On a phone a summary takes up to
**two lines** in the editor: its end is often what matters.

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
   settle included — unless a draft not offered yet is stored: that one is kept. After a logout (the session reset
   clears the storage and marks the session disconnected, local and Gladys Plus sessions alike),
   the editor writes nothing back: a draft never outlives its session, and
   the user id in the key keeps another account of the same browser from ever reading it.
   Edits made while the forms settle are written as soon as the drafts are enabled (the end of
   that window), and a write still pending when the editor unmounts (swipe-back, global
   navigation) is flushed then — including an edit made before the window ended.
   - The draft is removed when the scene is saved (edits made while the save was in flight are
     written again at once, against the version just saved — also when the save lands after the
     editor is gone, provided the stored draft is still the one that editor wrote), when the user leaves without saving,
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
a sticky banner above the bottom bar, so it is visible wherever the user is. That banner sits over
the timeline the user has to reach to fix the step: it has a **close button** (44 px) and its text
never grows past 30 % of the screen height (it scrolls inside). Closing it only hides the alert,
the changes stay unsaved.

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
`tags`), then the scene rows. The search, the tags and the order **combine**: changing one keeps the
others in the URL (typing a search while a tag is selected filters inside that tag; this holds for
the desktop list too). The sort select is not shown on a phone (the order of the URL is
still applied). A **floating "+" button** (60 px, bottom right, above the safe area) creates a
scene.

### D.2 A scene row

A row is ≥ 64 px high and holds: the scene icon tile (44 px), the name (16 px, two lines at most), the
description (one line, ellipsis), and a third line with the last execution ("Last run 6 hours ago",
from `last_executed`, relative and localized; "Never run" when null). The scene manager stamps
`last_executed` when a run starts (`scene.execute`: a write that is not awaited, never fails the
run and leaves `updated_at` alone), and a scene update never overwrites it (`scene.update` drops
the field: an editor saves the scene it loaded before the run). The row follows the
`scene.started` websocket event, whose payload carries `startedAt`. A disabled scene shows a gray
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
  applies), the scene icon and name in the middle (tap = scene settings), "•••" on the right. The
  two sides share the room the name leaves: a short name is centered, a long one is only cut
  when it reaches the buttons.
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
- While the scene runs, the row whose action is executing is marked, at every level (root steps
  and branches). The `scene.executing-action` / `scene.finished-executing-action` websocket
  events name the action by its **path** and its scene
  (`{ path: "2.0.then.0.0", sceneSelector: "good-night" }`), the path being the one the editor
  gives each step: the desktop card and the mobile row are both matched on it. These events are
  sent to every client, whichever scene runs: an editor ignores those of another scene (and an
  event without a path), or two scenes running at once would mark each other's steps. Actions of
  a group run at the same time and are each marked on their own.
- "+ Add a step" (dashed, full width) ends the timeline; a scene with no step shows "Add a first
  step" instead. A hint says rows can be swiped.

### E.4 Sheets

- Tapping a row opens **its sheet**: a bottom sheet (portaled on `<body>`, page scroll locked
  while open, focus kept inside) titled with the type label, holding **the parameter form of that
  step or trigger**, followed by a list of actions:
  - for a step: **Add a simultaneous action** (not for if/while), **Insert a step after** (root
    steps only), **Delete the step**;
  - for a trigger: **Delete the trigger**;
  - for an if/while block: its own fields (the while's max iterations), its **conditions as rows**
    (each opening its own sheet, stacked above) and "+ Add a condition". The conditions are
    combined with an AND, **written between two rows** as between the boxes of the desktop block.
- **Closing a sheet** (`components/sheet/BottomSheet.jsx`). A form sheet shows **OK** (a 44 px
  pill), a sheet with nothing to validate (a picker, a menu) a **×** at the same place. Every
  sheet also closes on its backdrop, on Escape, and:
  - **dragged down**: the sheet follows a finger that takes it by its handle or its header, or by
    its content once that content is scrolled back to its top (never from a field, a slider or a
    row being swiped). Released past 30 % of its height (140 px at most) or flicked, it closes;
    otherwise it goes back up. The centered dialog of wider screens does not move.
  - with **the system "back"** (the Android button, the iOS edge swipe, the browser button): it
    closes the sheet on top instead of leaving the editor, one sheet per press
    (`sheetHistory.js`). While a sheet is open, one history entry of the same URL sits above the
    page's one. That entry is never popped by the code when the sheet closes another way (a
    `history.back()` is asynchronous: a navigation started right after would be undone): it stays
    and is reused by the next sheet, a "back" leaving it with no sheet open is passed on at once
    (the user leaves the page in one press), and a navigation started from a sheet (the leave
    guard, the delete confirmation, "Duplicate", the creation of a scene) **replaces** it, so
    "back" from the next page lands on the editor once.
  - A closing sheet **slides out** while its backdrop fades (200 ms).
- A sheet title takes one line whenever it fits between the buttons, two otherwise.
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
  except the active switch and the last run, which keep their current (server) values.
- Deleting a **condition** leaves the sheet of its block open (the user is still working on the
  block's conditions); any other deletion goes back to the timeline. The toast is rendered on
  `<body>`, above the sheets, so Undo stays within reach.
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

### E.9 Reordering the steps

- **A long press** (≈ 0.4 s without moving) on a root step of the timeline lifts it
  (`mobile/timelineDrag.js`): it follows the finger, the other steps slide to make room, and
  releasing drops it there. A press that moves before the delay stays what it was — a scroll, or
  the swipe of the row — and a long press released without moving does nothing (it is not a tap
  either: no sheet opens). The page scrolls by itself when the finger nears the top or the bottom
  of the visible timeline, once it has gone that way. A hint under the timeline says so.
- **Reorder mode** ("•••" menu) is the equivalent without a gesture: it lists the root steps with
  a ⊖ delete button and ↑ / ↓ buttons (44 px each) per step. "Done" (bottom bar or navigation
  bar) leaves the mode.
- Both go through `moveCardGroup`, so variable references follow the steps. Steps inside branches
  keep their order (G).

### E.10 Device fields: the picker sheet

On a phone, a react-select with several devices is the wrong tool inside a sheet: a menu of every
device of the house opening over the form, one pick per opening, chips that wrap, and the keyboard
coming up on each tap. The **device fields** of the scene forms — the ones selecting several
devices and the ones selecting a single one — therefore become, below 768 px, a
`DevicePickerField` (`components/device/DevicePickerField.jsx`):

- the selection as **rows** (category icon, device name, and underneath what is measured and the
  room), each with a 44 px **remove** button; "No device selected." when empty;
- one button — "Choose devices", then "Add or remove devices" — opening the **device picker of
  the dashboard** (`DeviceFeaturePicker`, `dashboard-flexible-layout-and-widgets.md` A.3.1:
  search that does not open the keyboard by itself, room chips, checkbox rows with the current
  value, a pinned "Done" with the pending `+2 · −1`) in a **full-height sheet above the step's
  one** (`depth` 10). Devices are added and removed in **one validation**; closing the sheet
  (×, Escape, outside) keeps the selection as it was;
- a field taking **one device** (`single`) shows it without a remove button, under a "Change the
  device" button ("Choose a device" while empty). In the picker its rows are **radios** and there
  is nothing to confirm: **tapping a row selects it and closes the sheet**. Only an optional field
  (`clearable`: the camera of a question to the AI) keeps the remove button.

From 768 px the field renders its children: the select the form already had, unchanged.

The fields concerned, and what they select:

| Form | Selection | Picker options |
| --- | --- | --- |
| Turn on / turn off / toggle the lights | device selectors (`devices`) | `pickDevices` |
| Turn on / turn off / toggle the switches | device selectors (`devices`), writable switches only | `pickDevices` |
| Blink the lights | device selectors (`devices`), lights and switches | `pickDevices` |
| Change the thermostats' schedule | device selectors (`devices`), the thermostats of the schedule's house; disabled until a schedule is chosen | `pickDevices` |
| "Device state change" trigger | feature selectors (`device_features`) | `sameKindOnly` |
| Check the presence of a user | feature selectors (`device_features`), the first presence feature of each device | — |
| Get the last state | one feature selector (`device_feature`) | `single` |
| Control a device | one feature selector (`device_feature`), writable features only | `single` |
| Speak on a speaker | one device selector (`device`) | `pickDevices`, `single` |
| Play music | one device selector (`device`) | `pickDevices`, `single` |
| Send a camera image | one device selector (`camera`) | `pickDevices`, `single` |
| Ask the AI | one device selector (`camera`), optional | `pickDevices`, `single`, `clearable` |

- `pickDevices`: a row is a **device**, selected as a whole (an action on lights takes lights, not
  their features); its icon and value are those of its first accepted feature. A device row only
  shows a value it has ("No value" on every camera or speaker is noise), and a device whose
  features tell no icon takes the field's `defaultIcon` (a camera).
- `sameKindOnly`: the features of a trigger share one condition, so they must be comparable. Once
  a first feature is ticked, **only the features of its category and type are listed** (with a
  line saying so), exactly as the select narrows its options; unticking everything lists every
  kind again. The row under the finger stays in view when the list narrows.

`SelectDeviceFeature` opts in with `mobilePicker`, for a multi-selection (`sameKindOnly`) as for a
single one (`single`): its other callers — the dashboard widgets — keep the select. The fields
that select something else than a device (a user, a house, a calendar, a schedule, the variable
of a condition) keep their select too. A selector whose device no longer
exists keeps its row in the field ("Device not found", removable), and is never dropped by a
validation of the picker. No data contract changes: the forms write the same `devices` /
`device_features` arrays.

### E.11 Forms dressed for a phone

The forms of the desktop cards mix native selects, react-selects, text fields, checkboxes and
tabs, each with the look of its library, under paragraphs of explanation. In a sheet they are
dressed by the card that holds them (`mobile/SheetForm.jsx` and the "sheet forms" styles of
`mobile.css`), without a second copy of any form:

- **One look for every field**: text fields, native selects, react-selects and fields with
  variables are 48 px high with the same border, radius and focus ring; every list shows the
  same chevron; a field and its unit are one control.
- **A checkbox is a row** — its label on the left, a switch (51 × 31 px) on the right, the whole
  row being the target.
- **"Simple / Computed"** is a segmented control; buttons inside a form are 44 px.
- **Explanations are footnotes**: one size (13 px) and one gray. An explanation longer than 120
  characters is **folded on two lines** with a chevron; a tap (or Enter / Space) opens it, another
  folds it back. Colored alerts are warnings: never folded. Unfolding is not an edit (C.2). The
  card marks the help texts of the forms as it finds them (`data-help-fold`) and watches for the
  ones a form adds later, so every form — the ones declared by integrations included — gets it.
- **Variables** inserted in a text are accent pills, with a 24 px remove button.
- **Times and dates** use the native field of the system (`<input type="time">` /
  `type="date"`: the wheels of iOS, the clock of Android) instead of the desktop picker — a list
  of times opening over the sheet (`components/scene/PhoneNativeField.jsx`; scheduled trigger,
  time condition). The stored formats do not change (`HH:mm`, `yyyy-MM-dd`).
- **Days of the week** are seven toggles on one line (`components/scene/DayPills.jsx`: short
  names in the user's language, 44 px, `aria-pressed`) instead of a multi-select of seven options
  (scheduled trigger, time ranges, time condition). The selection is stored in the order of the
  week, as before; the time ranges keep their rule (the last day cannot be unticked).
- **The table of the time ranges** stacks: start, end and the delete button on one line, the
  duration under them. Nothing scrolls sideways in a sheet.

From 768 px the forms are untouched.

## F. Accessibility and motion

- Every control is a real `<button>`/`<a>`/`<input>`, with an `aria-label` when it has no visible
  text; switches use `role="switch"` and `aria-checked`.
- Sheets are `role="dialog"` with `aria-modal="true"`, named by their title, trap the focus and
  give it back to the element that opened them.
- Toasts are `role="status"`.
- Every gesture has an equivalent without it: the swipe actions (the sheet buttons, the menu), the
  drag of a sheet (OK / ×, Escape, the backdrop), the long-press drag of a step (reorder mode).
- Sheet and toast animations, and the slide of the steps during a drag, are skipped under
  `prefers-reduced-motion: reduce`.
- Dark mode: the new surfaces follow the app-wide inversion like the other Horizon sheets, with
  the exceptions an audit of every screen asked for (`mobile.css`, "Dark mode"). Colors that carry
  a meaning are **inverted back to themselves**: the swipe actions, the destructive button of the
  delete confirmation, the floating "+" (whose icon must not be inverted a third time), and the
  switch (white knob on the accent when on, on a dark track when off). Two global rules of
  `style/dark-mode.css` are undone where they do not fit: the search field of the list is a
  transparent field in its pill (the rule for inputs painted a darker rectangle in it), and the
  running / stop button follows the page (the rule for outline buttons gave it back a dark green
  on the dark bottom bar). The search icon of the device picker sits above its field, which the
  input rule turns into a stacking context. The switches of the forms (E.11) get their track
  back (the input rule painted it the color of the card), and the selected segment of a segmented
  control stays lighter than its track.

## G. Designed, not built yet (phase 2)

- "Weekdays / Weekend / Every day" shortcuts above the day toggles.
- **"Insert a value" chip bar** above text fields accepting variables, replacing the typed `{{`.
- Reordering inside branches (the long press moves root steps only).
- A dark theme of its own for these pages (dark mode is the app-wide inversion, see F).
- Opening a deeply nested branch (3+ levels) in its own sheet with a breadcrumb.
- **Test a draft without saving** (needs a server endpoint running an unsaved scene).
- Scene templates in the creation sheet.
- Bringing the timeline + sheet model to the desktop editor (side panel instead of a sheet).

## H. Tests

- Cypress, desktop viewport (unchanged default): the existing scene specs keep passing.
- Cypress, phone viewport (`cy.viewport('iphone-x')`), `front/cypress/e2e/routes/scene/SceneMobile.cy.js`:
  create a scene from the "+" sheet (name only), cancel its trigger picker without being left with
  an unsaved change, add a trigger and a step through the type picker
  sheets, see the bottom bar switch to "unsaved", save, delete a step from its sheet and undo, get
  the leave guard on "‹ Scenes", add a step to the Then branch of an if block, delete a condition
  from its block's sheet (the sheet stays, Undo is reachable), close a save error, leave a scene the
  forms normalize without being asked, get a
  draft back after a reload, disable the scene from its status line, delete it from the menu.
- Cypress, phone viewport, `SceneMobileDevicePicker.cy.js`: the features of a device state
  trigger picked in the sheet (only the features of the selected kind are listed), removed from
  the field, the lights of an action picked as devices, a closed picker keeping the selection,
  the saved payload, a single device replaced in one tap (no confirmation, no remove button);
  and the select kept on a wider screen.
- Cypress, phone viewport, `SceneMobileGestures.cy.js`: summaries naming the user and the house,
  the system "back" closing the sheet on top then leaving the editor in one press, a sheet
  dragged down by its header (kept when barely moved), a step moved by a long press (a quick move
  moves nothing), a long explanation folded and opened, the days picked with toggles and the time
  with the native field (saved payload). The touch gestures are driven with synthetic touch
  events; they are also checked with real ones in a phone emulation (Playwright), as is the
  landscape rule — the Cypress browser has a mouse, not a touch screen.
- The swipe gesture itself (`SwipeRow`) is not driven by Cypress: the pointer events Cypress
  synthesizes do not reach the row's handlers in its browser. It is checked in a phone emulation
  with a real pointer (Playwright); every swipe action has a non-gesture equivalent that the specs
  above cover.
