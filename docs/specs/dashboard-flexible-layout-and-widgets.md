# Dashboard: flexible layout & wall-panel widgets

> **Living specification — source of truth.** This document specifies the evolution of the Gladys dashboard towards wall-panel-grade layouts: section-based flexible layout, compact "chip" widgets, scene buttons with live state, an energy-flow widget, a "house view" widget (image with live data pins, optionally AI-generated through Gladys Plus), per-dashboard appearance, and icon-based tablet navigation. **Rule: any PR that changes one of these behaviors or contracts modifies this file in the same diff** — spec first, code second.
>
> Status: **phases 1–4 implemented** (sections layout, chips bar + scene status subtitles, appearance + tablet tab bar, house-view widget with asset storage — see Phases). Phases 5–6 are design only.

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
- Column count per section: **1 to 4**. More than 4 columns is intentionally not supported — dense rows of small items are the job of the chips bar (section B), not of many narrow columns.
- A section carries no name or title in phase 1 (`{ columns }` only); an optional `name` field may be added later without migration.

### A.3 Editor UX

The edit mode keeps the current interaction model, per section: add/remove section, choose its column count (visual picker, like the existing new-dashboard flow), drag & drop boxes within and across sections/columns (the existing drag & drop and drop-zone components are reused per section).

### A.4 Heights: selective stretch, not masonry

Sections of different heights create blank space below short columns. Resolution, decided over masonry (see Alternatives):

- Within a section, columns stretch to the height of the tallest one (flexbox `align-items: stretch`, already the container behavior in `BoxColumns.jsx`).
- Each box type declares a static stretchable flag **in the frontend code** (not user-facing, `front/src/utils/dashboardSections.js`): stretchable boxes get `flex-grow` and absorb the remaining height of their column; fixed-content boxes (clock, chips, scenes…) keep their natural height.
- This is a per-type constant, not a per-box user setting: zero configuration, and blank space disappears in the common layouts.
- **As implemented**: two stretch behaviors. *Media* boxes (`camera`, `photo`) stretch by letting their image absorb the extra height; *tile* boxes (`temperature-in-room`, `humidity-in-room`, `house-view`) stretch by vertically centering their content in the taller card, so a column of small tiles lines up with its neighbors instead of leaving a ragged bottom edge. `chart` is deliberately excluded for now — its height is fixed by the charting library options — and joins the list once chart heights are responsive.
- **Adaptive value tiles**: a small row of content centered in a big card looks empty, so the temperature/humidity tiles adapt to their real rendered height through a CSS container query (`components/boxs/roomTile.css`): compact icon+value row when short, centered "big tile" with the value scaled to the height (`cqh` units) when stretched past the threshold. The container is the padding-less stretch wrapper (container queries evaluate the content box), declared only on large screens — on mobile, stacked columns keep natural heights. The `house-view` is *not* size-contained: its natural height (the illustration) is what drives the section height. Browsers without container-query support keep the compact layout.

### A.5 Mobile

On small screens sections keep today's behavior: columns collapse to a single column, sections stack in order. Nothing to configure.

## B. New box type: `chips`

A **full-width bar of compact pills**, each pill summarizing one state with an automatic icon and color. One chips box replaces what would otherwise be a pathological "7-column section".

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

## C. Scene box: live state subtitle

The scene box (`front/src/components/boxs/scene/`) gains an **optional state subtitle** per scene button:

- Config **as implemented**: `scene_status_features`, a map of scene selector → device feature selector on the scene box. The feature's compact value renders as a muted second line under the scene name and updates live over websocket.
- **Scene rows are pills** (all card styles, since the Horizon work): each scene renders as its own rounded row — tinted icon square, name + optional status subtitle, start button — instead of a table row. The default style keeps a quiet gray pill; the glass theme makes it translucent. Start-button markup and i18n are unchanged.
- The compact value rendering is shared with the chips bar through `front/src/components/device/DeviceFeatureValueText.jsx` (open/closed for opening sensors, on/off for binaries, rounded value + short unit otherwise).
- An openings-style counter subtitle ("0/4 open") is **not** implemented yet; it can be added later as an alternative entry in the same map without breaking the shape.
- Joi: additive fields on the scene box schema; fully backward compatible.

## D. New box type: `energy-flow`

A real-time energy synthesis replacing hand-assembled gauge/chart combinations: a stats banner (production, grid import, grid export, self-consumption %) plus a live flow diagram (solar → home / battery / grid).

- New `DASHBOARD_BOX_TYPE.ENERGY_FLOW = 'energy-flow'`.
- Config: the user assigns existing device features to **roles**: `production`, `consumption`, `grid_import`, `grid_export`, `battery_level` (all optional except `consumption` or `production`). That is the entire configuration — the widget computes self-consumption and draws the flow from whichever roles are present.
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

- `background_image`: none (default) | an image URL for now — switches to a dashboard asset reference (bundled wallpapers, uploads) when the asset storage lands in phase 4;
- `card_style`: `default` | `glass` (`DASHBOARD_CARD_STYLE` in `server/utils/constants.js`). **`glass` is the "Horizon" theme**, a full wall-panel-grade restyle of the dashboard page, not just translucent cards:
  - a global `glass-theme` class on the dashboard page gates the whole theme; tokens (`--gl-*`: ink/muted/accent, radii, glass surfaces, borders, shadows) live in `front/src/routes/dashboard/style.css`, and component variants (chips, house-view pins, value tiles, clock, scenes, tablet dock) compose on the same class next to their component;
  - deep glass cards (blur + saturate, 26px radius, layered shadows), uppercase micro-label card titles, two-level ink discipline, pastel tinted stamps, soft pill action buttons, frosted page controls and tablet dock (active tab inverted);
  - **default scene**: when `glass` is selected and no `background_image` is set, a pure-CSS scene (radial glows over a diagonal gradient) is applied — the wow in one click, no wallpaper hunt; a configured image wins over it;
  - **dark mode by inversion**: the app darkens through the global inversion filter (`style/dark-mode.css`), so the theme deliberately authors NO dark colors — the light glass, scene, and pastels invert into coherent dark counterparts, and images (house illustration, backgrounds set inline) are double-inverted back by the existing rules;
  - **degradation**: browsers without `backdrop-filter` get more opaque surfaces via `@supports`, keeping text readable on old wall tablets;
- `icon`: feather icon shown in the tablet tab bar (section H), picked with the existing `IconSelector`.

A `theme` override (`auto`/`light`/`dark`) was considered and **deferred**: the app-level dark mode is a user preference and per-dashboard overrides need a clean way to scope it; revisit after phase 4. Appearance stays a dashboard-level decision so every widget remains consistent — no per-box styling.

## H. Tablet navigation: icon tab bar

- Each dashboard gains an optional `icon` (picker from the existing icon set) next to its name; `GET /api/v1/dashboard` returns it in the list payload.
- In tablet mode (the `tabletMode` store flag, fed by `session.tablet_mode`), the dashboard selector renders as a **horizontal icon tab bar** (current dashboard highlighted, `home` as the fallback icon) instead of the dropdown — matching touch usage on a wall panel. Outside tablet mode, the dropdown remains.

## Phases

Ordering principle, decided with the maintainer: **plumbing first, showcase widgets last.** The layout engine, the density widgets, the asset storage, and the appearance layer are what unlock every future dashboard; the flashy visualizations come once that foundation is in place.

1. **Sections layout** (A) — **implemented**, including selective stretch (A.4). Also covers the community prototype work from forum 10553.
2. **Density widgets**: chips bar (B) + scene state subtitle (C) — **implemented**.
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
- **Many narrow columns for chip rows**: rejected (capped at 4 columns) — compact rows are a widget concern (`chips`), not a layout concern.

## Out of scope

- Per-box user-facing sizing controls (S/M/L pickers): sections + `canStretch` + compact widgets cover the target layouts without adding a sizing concept for users to manage.
- Interactive chips (tap-to-act) and chip-level scene triggers: display-only in phase 2.
- AI-assisted pin placement (vision model guessing coordinates on the illustration): manual drag placement is reliable and takes seconds; may be revisited later.
- Floor-plan editors, 3D rendering, or camera-based live overlays.
