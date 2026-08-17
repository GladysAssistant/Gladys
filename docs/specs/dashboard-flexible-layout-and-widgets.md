# Dashboard: flexible layout & wall-panel widgets

> **Living specification — source of truth.** This document specifies the evolution of the Gladys dashboard towards wall-panel-grade layouts: section-based flexible layout, compact "chip" widgets, scene buttons with live state, an energy-flow widget, a "house view" widget (image with live data pins, optionally AI-generated through Gladys Plus), per-dashboard appearance, and icon-based tablet navigation. **Rule: any PR that changes one of these behaviors or contracts modifies this file in the same diff** — spec first, code second.
>
> Status: **phases 1–4 implemented** (sections layout, chips bar + quick actions + scene status subtitles, appearance + tablet tab bar, house-view widget with asset storage — see Phases). Phases 5–6 are design only.

## Context

Community members build wall-mounted tablet dashboards (see [forum topic 10553](https://community.gladysassistant.com/t/dashboard-mise-en-page-flexible-pouvoir-melanger-les-lignes-a-1-2-et-3-colonnes/10553)) that today require workarounds: the reference example mixes a row of compact status chips (alarm, garage, lock, "all openings closed", temperatures, next trash collection), a large solar-energy panel with live values pinned on an isometric house illustration, small temperature tiles, a camera, and scene buttons showing device state ("Open shutters · 0/4 open").

The current dashboard cannot express this density:

- The layout is **N equal-width columns** for the whole dashboard (`front/src/routes/dashboard/BoxColumns.jsx` renders `col-lg-${12 / boxesLength}`), and every box spans the full width of its column.
- The smallest display unit is a **card**; there is no chip/badge-scale widget and no way to place mini-widgets side by side inside a column.
- There is no energy-flow visualization (the `energy-consumption` box is a table) and no way to overlay live values on an image.
- Scene boxes are plain triggers with no state feedback.
- Appearance (background, card style) is not configurable per dashboard, and tablet mode switches dashboards through a dropdown.

**Design goals (the Gladys philosophy, non-negotiable):**

1. **A few clicks, never YAML.** Every feature below must be configurable entirely from the dashboard editor with visual choices. No free-text prompt or config file is ever required.
2. **Beautiful by default.** Icons, colors, and layout behavior derive automatically from device feature categories and fixed design presets. Users pick *content*, Gladys guarantees *rendering*.
3. **Backward compatible.** Existing dashboards keep working unchanged; migrations are lazy and lossless.
4. **Open-source first.** Every widget is fully usable without Gladys Plus. Plus makes some of them *personalized* (AI-generated illustration), never *possible*.

## A. Flexible layout: sections

Decided with the maintainer in forum topic 10553: instead of a per-row column count (which conflicts with the column-based storage model) or a free grid (rejected, see Alternatives), the dashboard becomes a **vertical stack of sections, each with its own column count**.

### A.1 Current data model

`t_dashboard.boxes` is a JSON column validated by a Joi schema (`server/models/dashboard.js`): an **array of columns**, each column an **array of box objects** (`{ type, ...per-type fields }`). The renderer derives the column width from the array length.

### A.2 Target data model

`boxes` becomes an **array of sections**:

```js
// New shape
[
  { columns: [ [box, box], [box] ] },          // section 1: 2 columns
  { columns: [ [box], [box], [box], [box] ] }, // section 2: 4 columns
]
```

- **No SQL migration**: the column stays JSON. Legacy values are normalized in a `beforeValidate` hook (`server/utils/dashboardSections.js`), so validation only ever sees the section shape and any save — even one that doesn't touch `boxes` — lazily migrates the row.
- **Lazy, lossless migration**: on read, a legacy value (array of arrays) is normalized to a single section `[{ columns: legacyValue }]`; on the first save, the new shape is written. `dashboard.getBySelector` returns the normalized shape so the frontend only ever sees sections.
- **Editor implementation note**: the editor keeps working on a *flat* list of columns plus a `sectionSizes` array (`front/src/utils/dashboardSections.js`), so drag & drop coordinates stay global and none of the box-level editing code changed; sections are reassembled on save.
- Column count per section: **1 to 6** (raised from 4 together with the per-dashboard width setting, section G — 6 columns only make sense on a wide dashboard). 5 columns don't divide the 12-column grid, so that case uses a dedicated 20% class (`BoxColumns.jsx`); beyond 6, dense rows of small items remain the job of the chips bar (section B), not of many narrow columns.
- A section carries no name or title in phase 1 (`{ columns }` only); an optional `name` field may be added later without migration.

### A.3 Editor UX

The edit mode keeps the current interaction model, per section: an "Add a section" button appends a one-column section, a per-section **+** button adds a column (up to 6) and a per-column trash removes an empty one (removing the last column removes the section); drag & drop moves boxes within and across sections/columns (the existing drag & drop and drop-zone components are reused per section). There is no separate column-count picker.

### A.4 Heights: selective stretch, not masonry

Sections of different heights create blank space below short columns. Resolution, decided over masonry (see Alternatives):

- Within a section, columns stretch to the height of the tallest one (flexbox `align-items: stretch`, already the container behavior in `BoxColumns.jsx`).
- Each box type declares a static stretchable flag **in the frontend code** (not user-facing, `front/src/utils/dashboardSections.js`): stretchable boxes get `flex-grow` and absorb the remaining height of their column; fixed-content boxes (clock, chips, scenes…) keep their natural height.
- This is a per-type constant, not a per-box user setting: zero configuration, and blank space disappears in the common layouts.
- **As implemented**: two stretch behaviors. *Media* boxes (`camera`, `photo`) stretch by letting their image absorb the extra height; *tile* boxes (`temperature-in-room`, `humidity-in-room`, `house-view`) stretch by vertically centering their content in the taller card, so a column of small tiles lines up with its neighbors instead of leaving a ragged bottom edge. `chart` is deliberately excluded for now — its height is fixed by the charting library options — and joins the list once chart heights are responsive.
- **Capped absorption**: stretch is a shock absorber, not an elastic. A media box absorbs the free height of its column only up to a cap (65vh, desktop only, `dashboard-stretched-media` in `routes/dashboard/style.css`) — beyond it the column simply ends earlier and the dashboard background shows, instead of a photo blown up to several times its natural size. The photo widget lifts its internal 400px image cap when stretched so the image actually fills the card (no dead zone under the image; `photo_fit` keeps deciding cover/contain).
- **Adaptive value tiles**: a small row of content centered in a big card looks empty, so the temperature/humidity tiles adapt to their real rendered height through a CSS container query (`components/boxs/roomTile.css`): compact icon+value row when short, centered "big tile" with the value scaled to the height (`cqh` units) when stretched past the threshold. The container is the padding-less stretch wrapper (container queries evaluate the content box), declared only on large screens — on mobile, stacked columns keep natural heights. The `house-view` is *not* size-contained: its natural height (the illustration) is what drives the section height. Browsers without container-query support keep the compact layout.

### A.5 Mobile

On small screens sections keep today's behavior: columns collapse to a single column, sections stack in order. Nothing to configure.

## B. New box type: `chips`

A **full-width bar of compact pills**, each pill summarizing one state with an automatic icon and color. One chips box replaces what would otherwise be a pathological "7-column section". Boxes have no span field: a chips bar takes the full dashboard width by living in its own **1-column section**, which is the intended composition.

- New `DASHBOARD_BOX_TYPE.CHIPS = 'chips'` in `server/utils/constants.js`, rendered as a `flex-wrap` row — responsive for free, on desktop and mobile alike.
- Box config: an ordered list of chips. Each chip is one of four kinds:

| Kind | Config | Renders |
|---|---|---|
| `device-feature` | `device_feature`, optional `label` | icon + label + last value, icon derived from the feature category (`DeviceFeatureCategoriesIcon`) |
| `openings` | `house` and/or `room` | aggregate over the opening sensors in scope: "All closed" (neutral) or "2 open" (warning color) |
| `alarm` | `house` | current alarm mode |
| `calendar-next-event` | optional `calendars`, optional name filter | next matching event: name + date (covers "next trash collection" from a synced calendar) |

- Joi schema: a `chips` array (max 20, each item `{ chip_type, ... }`) is added to the box schema in `server/models/dashboard.js`; an optional per-chip `icon` overrides the automatic one.
- **As implemented**: every chip resolves through existing endpoints — `GET /api/v1/device?device_feature_selectors=`, `GET /api/v1/room?expand=devices` (+ `GET /api/v1/house/:selector` for house scoping), `GET /api/v1/calendar/event` — no new server endpoint. The openings aggregate counts `opening-sensor` binary features (`OPENING_SENSOR_STATE.OPEN`). Device and openings chips update live over the device websocket; the alarm chip refreshes on alarm websocket events.
- Tapping a chip is **not** an action in phase 2 (display only); tap-to-detail may come later.

## B2. New box type: `actions` (quick actions)

The command-side sibling of the chips bar (community request, forum 10614): chips are compact *states* to read, quick actions are compact *commands* to tap. One card holds a wrapping row of touch-friendly buttons — "one tap = one action" — replacing what a wall-tablet user would otherwise build with several one-action widgets.

- New `DASHBOARD_BOX_TYPE.ACTIONS = 'actions'`; box config `{ type, name?, actions: [...] }` (Joi: max 20 items). Each action is one of:

| Kind | Config | Tap does | Active state |
|---|---|---|---|
| `scene` | `{ action_type: 'scene', scene, label? }` | `POST /api/v1/scene/:selector/start` (same call as the scene box) | none (momentary spinner) — icon is the scene's own icon |
| `device-feature` (binary) | `{ action_type: 'device-feature', device_feature, label? }` | toggles 0/1 via `POST /api/v1/device_feature/:selector/value` | tinted when `last_value = 1` |
| `device-feature` (command) | same + `value` | sends the configured value (shutter/curtain state: `COVER_STATE` open `1` / stop `0` / close `-1`) | tinted when `last_value` equals `value` |

- **Automatic state colors, zero styling config**: active positive commands and binary "on" tint green; an active *close* command (`value < 0`, e.g. shutters closed) tints red — which is exactly the red-closed/green-open code the forum asked for, derived from the semantics instead of configured. Inactive buttons stay neutral.
- Icons are automatic: the scene's configured icon for scenes, the device-feature category icon for toggles, up/stop/down arrows for cover commands. An optional per-action `icon` override is accepted by the schema (parity with chips) but not surfaced in the editor yet.
- Editor UX: per action — kind select (scene / device), then a single scene select or the existing `SelectDeviceFeature`; picking a shutter/curtain *state* feature reveals a command select (open/stop/close). Optional short label (defaults to the scene or device name). Unfinished rows (no target) are dropped on save like unfinished chips.
- Live updates over the device websocket like the chips bar; features are loaded in one `GET /api/v1/device?device_feature_selectors=` batch.
- Rendering: `flex-wrap` row of pill buttons inside a normal card (optional header), responsive for free; glass theme composes its own variant on `.glass-theme` like every widget.
- **Not** a generic container: HA-style nestable horizontal/vertical stacks were considered and rejected (see Alternatives) — dense command rows are a widget concern, like dense state rows.

## C. Scene box: live state subtitle

The scene box (`front/src/components/boxs/scene/`) gains an **optional state subtitle** per scene button:

- Config **as implemented**: `scene_status_features`, a map of scene selector → device feature selector on the scene box. The feature's compact value renders as a muted second line under the scene name and updates live over websocket.
- **Scene rows are pills** (since the Horizon work): each scene renders as its own rounded translucent row — tinted icon square, name + optional status subtitle, start button — instead of a table row. Start-button markup and i18n are unchanged.
- The compact value rendering is shared with the chips bar through `front/src/components/device/DeviceFeatureValueText.jsx` (open/closed for opening sensors, on/off for binaries, rounded value + short unit otherwise).
- An openings-style counter subtitle ("0/4 open") is **not** implemented yet; it can be added later as an alternative entry in the same map without breaking the shape.
- Joi: additive fields on the scene box schema; fully backward compatible.

## D. New box type: `energy-flow`

A real-time energy synthesis replacing hand-assembled gauge/chart combinations: a stats banner (production, grid import, grid export, self-consumption %) plus a live flow diagram (solar → home / battery / grid).

- New `DASHBOARD_BOX_TYPE.ENERGY_FLOW = 'energy-flow'`.
- Config: the user assigns existing device features to **roles mapped 1:1 on the energy taxonomy that already shipped**: production (`energy-sensor`/`home-output-sensor` power), home consumption, grid exchange (a **signed** `grid-sensor.power`, import > 0 / export < 0 — not separate import/export slots), and battery (`battery-storage` charge/discharge power, with the SoC shown from the battery feature itself). The widget computes self-consumption and draws the flow from whichever roles are present; it must not invent a solar-specific import/export/SoC model that fights those categories.
- Periods: instantaneous values from the latest states; daily totals reuse the aggregate mechanisms already backing the `chart` and `energy-consumption` boxes. No new storage.
- The diagram is a fixed, designed rendering (SVG), not user-customizable. Roles not configured simply do not appear.

## E. New box type: `house-view` (image + live data pins)

The signature widget: an illustration (typically the user's house) with live device values pinned on it.

- New `DASHBOARD_BOX_TYPE.HOUSE_VIEW = 'house-view'`, stretching as a *tile* (the illustration keeps its aspect ratio, the card centers it in the extra height — see A.4).
- Config **as implemented**:
  - `image`: illustration reference, validated as `gallery:<key>` (bundled) or `asset:<id>` (uploaded);
  - `pins`: array of `{ x_pct, y_pct, device_feature, label?, icon? }` (max 20) — coordinates in percent of the image so it scales freely. In the editor, clicking the image places a pin (moving one = remove + place again; drag may come later); values render as floating badges in the chips visual family, updated live over websocket, with the icon derived from the feature category.
- **Image sources**, in order of effort:
  1. **Bundled gallery** (implemented): 4 isometric house illustrations shipped with the frontend (`house-solar`, `house-family`, `house-modern`, `apartment`), generated from a small projection script so style, palette and lighting stay consistent. This is the no-Plus, zero-effort path and the showcase of the expected rendering.
  2. **Upload** (implemented): any user image (floor plan, garden photo, custom render). The frontend downscales it in a canvas (max 1600 px, JPEG/PNG) before upload, so the payload stays small whatever the source photo.
  3. **AI-generated via Gladys Plus** (section F, phase 5): the user's actual house, in the gallery's exact style.
- **Storage — decided and implemented**: uploaded images live in a dedicated `t_dashboard_asset` table (`id`, `dashboard_id` FK with `ON DELETE CASCADE`, `content_type`, `data` BLOB — migration `20260816000000`), referenced from the box config by id so the `boxes` JSON stays small.
  - `POST /api/v1/dashboard_asset/:dashboard_selector` uploads `{ content_type, data }` (base64). Server-side bounds in `dashboard.createAsset`: raster types only (`image/png`, `image/jpeg`, `image/webp`), valid base64, ≤ 4 MB of base64. The route carries a dedicated 6 MB JSON body bound mounted **behind authentication** (`largeJsonBody` route flag), following the host-API precedent — the global 100 kB bound is untouched.
  - `GET /api/v1/dashboard_asset/:id` returns `content-type;base64,data`, the exact shape of the photo proxy, consumed as a data URI — same access rules as the dashboard (owner or public).
  - Assets are deleted with their dashboard (FK cascade). An asset orphaned by replacing a box image lives until then; a cleanup pass can come later if it ever matters.
- Optional **night variant**: a second image auto-swapped by sun state — **deferred**, one additive field when it comes, no schema impact.

## F. AI illustration generation through Gladys Plus

Generating the `house-view` illustration is the one step that cannot be beautiful-by-default from a form alone. Gladys Plus already proxies AI calls; illustration generation follows the exact same pattern.

### F.1 Existing plumbing (verified)

- `server/lib/gateway/gateway.aiChat.js`: the local instance forwards an OpenAI-compatible body through `gladysGatewayClient`, maps gateway 403/429 into local HTTP errors. The provider account, prompt policy, and billing live server-side in Gladys Plus.
- `server/lib/gateway/gateway.getOpenAIQuota.js`: the Plus quota endpoint **already models text and image quotas** separately.

### F.2 New contract

- New gateway method `gateway.generateImage(body)`, same structure as `aiChat`: OpenAI-Images-compatible request, 403/429 mapping, exposed through one local API route called only by the `house-view` editor.
- **Two generation paths, both prompt-free for the user:**
  1. **Photo → illustration** (primary): the user uploads or takes a photo of their house; Plus runs image-to-image to produce the illustration. One click, and the result is *their* house.
  2. **Guided form** (fallback): 4–5 visual choices (house type, roof color, solar panels, pool, garage…) assembled into a template prompt **server-side**.
- **Style is locked server-side in Gladys Plus**: the style prompt (isometric, palette, transparent-background PNG, lighting) is injected by the Plus backend and never exposed to or editable by the client. This is the design guarantee — every generated house matches the bundled gallery and both themes — and it can be improved for everyone without a Gladys release.
- The editor generates 2–3 variants, the user picks one or regenerates.
- **Quota**: enforced by Plus on the existing image quota. Generation is a setup-time operation, so a small monthly allowance (order of 10/month) is sufficient and bounds cost.
- **Privacy**: the source photo is sent to the provider for the transformation only and is never stored by Gladys Plus; the UI states this explicitly before the first generation (same consent approach as camera AI analysis). The resulting illustration is stored **locally** as a dashboard asset (section E) — nothing persists in the cloud.
- **No Plus → no dead end**: without Plus the gallery and upload paths are fully functional; the generate button is a Plus upsell in place, not a gate on the widget.

## G. Per-dashboard appearance

Additive, optional (nullable) columns on `t_dashboard` (migration `20260815000000`; absent fields = exactly today's rendering):

- `background_image`: none (default) | an **http(s) URL, validated on save** (model-level check) and re-checked by the frontend before being interpolated into the CSS `url()` — this free URL is the lasting contract for backgrounds. Uploaded backgrounds through a dashboard-asset reference (the `t_dashboard_asset` plumbing from phase 4) are a planned **additive** follow-up (`background_asset` or an `asset:` form), not a replacement of the URL. When no background is set, the built-in CSS scene applies (see below);
- **The "Horizon" glass theme is the one and only dashboard style — imposed, not chosen.** Maintainer decision after seeing it live, in line with the Gladys philosophy: ship the best look for everyone instead of a style picker (a `card_style` column existed during the development of this PR and was removed before release; there is no per-dashboard or per-user style switch). It is a full wall-panel-grade restyle of the dashboard page, not just translucent cards:
  - a global `glass-theme` class, applied unconditionally on the dashboard page, gates the whole theme; tokens (`--gl-*`: ink/muted/accent, radii, glass surfaces, borders, shadows) live in `front/src/routes/dashboard/style.css`, and component variants (chips, quick actions, house-view pins, value tiles, clock, scenes, tab bar and its overflow menu) compose on the same class next to their component — the class stays as the single gate so the theme remains one coherent, testable layer;
  - deep glass cards (blur + saturate, 26px radius, layered shadows), uppercase micro-label card titles, two-level ink discipline, pastel tinted stamps, soft pill action buttons, frosted page controls and tablet dock (active tab inverted);
  - **default scene**: when no `background_image` is set, a pure-CSS scene (radial glows over a diagonal gradient) is applied — the wow with zero configuration; a configured image wins over it;
  - **dark mode by inversion**: the app darkens through the global inversion filter (`style/dark-mode.css`), so the theme deliberately authors NO dark colors — the light glass, scene, and pastels invert into coherent dark counterparts, and images (house illustration, backgrounds set inline) are double-inverted back by the existing rules;
  - **degradation**: browsers without `backdrop-filter` get more opaque surfaces via `@supports`, keeping text readable on old wall tablets;
- `icon`: feather icon shown in the tablet tab bar (section H), picked with the existing `IconSelector`;
- `width`: `standard` (default, the capped container — opinionated readable default) | `full` (the container spans the whole screen, side padding kept — for large wall panels and 27"+ screens, where up to 6 columns per section become useful; migration `20260816120000`, `DASHBOARD_WIDTH` in `server/utils/constants.js`). The resolution of the "capped width vs. big screens" dilemma is *opinionated defaults, never walls*: beautiful without configuration, one click to opt out.

A `theme` override (`auto`/`light`/`dark`) was considered and **deferred**: the app-level dark mode is a user preference and per-dashboard overrides need a clean way to scope it; revisit after phase 4. Appearance stays a dashboard-level decision so every widget remains consistent — no per-box styling.

## H. Dashboard navigation: one-tap pill tab bar

- Each dashboard gains an optional `icon` (picker from the existing icon set) next to its name; `GET /api/v1/dashboard` returns it in the list payload.
- The dashboard selector is an **always-visible pill tab bar in every mode** — switching between the first dashboards is one tap, never a menu to open first. The old two-click dropdown was removed as the primary entry; it survives only as the overflow. Users commonly have 15–20 dashboards, so the bar is a **"priority+" row** (`DashboardTabs.jsx`): a single line of pills in dashboard order — the order the user already controls in the edit view, i.e. a user-chosen priority — and every pill that doesn't fit collapses behind a trailing **"…" button** opening the full scrollable list (icons + names). Fit is measured on render and resize (wrap detection on the rendered pills), so it adapts to any width and any name length (per-pill ellipsis past 11rem):
  - **desktop**: icon + name pills;
  - **mobile** (< 768px): only the active pill keeps its name, the others shrink to icon dots so more fit before the overflow kicks in;
  - **tablet mode** (the `tabletMode` store flag, fed by `session.tablet_mode`): compact icon-only dock (current dashboard highlighted, `home` as the fallback icon);
  - when the **current dashboard is one of the collapsed ones**, the "…" button shows its icon + name (active styling, chevron), so the context never disappears.
- Touch swipe between dashboards is a possible later complement to the pills (invisible affordance, needs a strict directional threshold to never steal vertical scroll or widget gestures); it does not replace them.

## Phases

Ordering principle, decided with the maintainer: **plumbing first, showcase widgets last.** The layout engine, the density widgets, the asset storage, and the appearance layer are what unlock every future dashboard; the flashy visualizations come once that foundation is in place.

1. **Sections layout** (A) — **implemented**, including selective stretch (A.4). Also covers the community prototype work from forum 10553.
2. **Density widgets**: chips bar (B) + scene state subtitle (C) — **implemented**; quick actions (B2) — **implemented** (added on community feedback, forum 10614).
3. **Appearance (G) + tablet tab bar (H)** — **implemented** (background as a URL for now; `theme` override deferred, see G).
4. **House view** (E) — **implemented** with bundled gallery + upload + pins, including the dashboard-asset storage (plumbing reused later by G uploaded backgrounds and F).
5. **Plus AI generation** (F) — requires the Gladys Plus backend endpoint; front/server land behind the existing Plus feature detection.
6. **Energy flow** (D) — deliberately last: it is a self-contained visualization that depends on nothing above and unlocks nothing else, whereas everything before it is foundation.

Each phase is a separate PR (or PR series) that updates this spec in the same diff.

## Alternatives considered

- **Free grid / drag-anywhere layout** (Home Assistant style): rejected. It moves the design burden onto the user, breaks "beautiful by default", and is a disproportionate rewrite of storage and editor.
- **Per-row column counts stored as rows**: rejected in forum 10553 — the storage model is column-based; sections deliver the same expressiveness while reusing the existing model and editor code.
- **Masonry for blank space**: rejected. Native CSS masonry is not broadly supported yet, and JS masonry libraries reorder boxes — unacceptable when the user placed them deliberately. Selective stretch (A.4) solves the real-world cases with zero configuration.
- **Free-text prompt for AI generation**: rejected. A prompt field is configuration in disguise and produces inconsistent quality; the two prompt-free paths (photo, guided form) with a server-locked style are the Gladys way.
- **Client-side style prompt**: rejected — the style must be a server-side guarantee (consistency across users and improvable without a release).
- **Plus-only house-view widget**: rejected. The widget ships with a bundled gallery and upload; Plus personalizes it.
- **Many narrow columns for chip rows**: rejected (capped at 6 columns, and 5–6 are only comfortable on `width: full`) — compact rows are a widget concern (`chips`), not a layout concern.
- **A dashboard style picker** (`card_style: default | glass`): built during this PR, then **removed before release**. Two styles means designing, testing and dark-moding every widget twice forever, for a choice most users would never make; the Gladys way is to impose the best default. Horizon glass is the style.
- **Generic nestable stacks** (Home Assistant horizontal/vertical stacks, forum 10614): rejected. A layout language the user composes by hand is configuration without an end and every combination must look good in every theme; Gladys ships finished widgets instead — chips for dense states, quick actions (B2) for dense commands, whose combinations reproduce the real-world HA stacks that were shown.

## Out of scope

- Per-box user-facing sizing controls (S/M/L pickers): sections + `canStretch` + compact widgets cover the target layouts without adding a sizing concept for users to manage.
- Interactive chips (tap-to-act) and chip-level scene triggers: display-only in phase 2.
- AI-assisted pin placement (vision model guessing coordinates on the illustration): manual drag placement is reliable and takes seconds; may be revisited later.
- Floor-plan editors, 3D rendering, or camera-based live overlays.
