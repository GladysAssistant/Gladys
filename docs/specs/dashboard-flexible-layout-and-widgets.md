# Dashboard: flexible layout & wall-panel widgets

> **Living specification — source of truth.** This document specifies the evolution of the Gladys dashboard towards wall-panel-grade layouts: section-based flexible layout, compact "chip" widgets, scene buttons with live state, an energy-flow widget, a "house view" widget (image with live data pins, optionally AI-generated through Gladys Plus), per-dashboard appearance, and icon-based tablet navigation. **Rule: any PR that changes one of these behaviors or contracts modifies this file in the same diff** — spec first, code second.
>
> Status: **design — nothing implemented yet.** Section A (flexible layout) is being prototyped by a community contributor; everything else is unscheduled.

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

- **No SQL migration**: the column stays JSON. The Joi schema accepts both shapes.
- **Lazy, lossless migration**: on read, a legacy value (array of arrays) is normalized to a single section `[{ columns: legacyValue }]`; on the first save, the new shape is written. `dashboard.get` / `dashboard.getBySelector` return the normalized shape so the frontend only ever sees sections.
- Column count per section: **1 to 4**. More than 4 columns is intentionally not supported — dense rows of small items are the job of the chips bar (section B), not of many narrow columns.
- A section carries no name or title in phase 1 (`{ columns }` only); an optional `name` field may be added later without migration.

### A.3 Editor UX

The edit mode keeps the current interaction model, per section: add/remove section, choose its column count (visual picker, like the existing new-dashboard flow), drag & drop boxes within and across sections/columns (the existing drag & drop and drop-zone components are reused per section).

### A.4 Heights: selective stretch, not masonry

Sections of different heights create blank space below short columns. Resolution, decided over masonry (see Alternatives):

- Within a section, columns stretch to the height of the tallest one (flexbox `align-items: stretch`, already the container behavior in `BoxColumns.jsx`).
- Each box type declares a static `canStretch` flag **in the frontend code** (not user-facing): stretchable boxes (`chart`, `camera`, `photo`, and the new `house-view`) get `flex-grow` and absorb the remaining height of their column; fixed-content boxes (clock, chips, scenes…) keep their natural height.
- This is a per-type constant, not a per-box user setting: zero configuration, and blank space disappears in the common layouts.

### A.5 Mobile

On small screens sections keep today's behavior: columns collapse to a single column, sections stack in order. Nothing to configure.

## B. New box type: `chips`

A **full-width bar of compact pills**, each pill summarizing one state with an automatic icon and color. One chips box replaces what would otherwise be a pathological "7-column section".

- New `DASHBOARD_BOX_TYPE.CHIPS = 'chips'` in `server/utils/constants.js`, rendered as a `flex-wrap` row — responsive for free, on desktop and mobile alike.
- Box config: an ordered list of chips. Each chip is one of four kinds:

| Kind | Config | Renders |
|---|---|---|
| `device-feature` | `device_feature`, optional `label` | icon + label + last value, icon and color derived from the feature category (same derivation as existing device boxes) |
| `openings` | `house` or `room` | aggregate over all opening/lock sensors in scope: "All closed" (neutral) or "2 open" (warning color) |
| `alarm` | `house` | current alarm mode, reusing the alarm box's state mapping |
| `calendar-next-event` | `calendar`, optional name filter | next matching event: name + date (covers "next trash collection" from a synced calendar) |

- Joi schema: a `chips` array is added to the box schema in `server/models/dashboard.js`, each item validated per kind.
- The `openings` aggregate is computed frontend-side from the already-loaded device features in scope (no new server endpoint); `calendar-next-event` reuses the existing calendar API.
- Tapping a chip is **not** an action in phase 1 (display only); tap-to-detail may come later.

## C. Scene box: live state subtitle

The scene box (`front/src/components/boxs/scene/`) gains an **optional state subtitle** per scene button:

- Config: for each selected scene, an optional `status_device_feature` (single feature — "Michel: ready") **or** an openings-style counter scope (`house`/`room` + category — "0/4 open").
- Rendered as a muted second line under the scene name. No subtitle configured → the box renders exactly as today.
- Joi: additive fields on the scene box schema; fully backward compatible.

## D. New box type: `energy-flow`

A real-time energy synthesis replacing hand-assembled gauge/chart combinations: a stats banner (production, grid import, grid export, self-consumption %) plus a live flow diagram (solar → home / battery / grid).

- New `DASHBOARD_BOX_TYPE.ENERGY_FLOW = 'energy-flow'`.
- Config: the user assigns existing device features to **roles**: `production`, `consumption`, `grid_import`, `grid_export`, `battery_level` (all optional except `consumption` or `production`). That is the entire configuration — the widget computes self-consumption and draws the flow from whichever roles are present.
- Periods: instantaneous values from the latest states; daily totals reuse the aggregate mechanisms already backing the `chart` and `energy-consumption` boxes. No new storage.
- The diagram is a fixed, designed rendering (SVG), not user-customizable. Roles not configured simply do not appear.

## E. New box type: `house-view` (image + live data pins)

The signature widget: an illustration (typically the user's house) with live device values pinned on it.

- New `DASHBOARD_BOX_TYPE.HOUSE_VIEW = 'house-view'`, `canStretch: true`.
- Config:
  - `image`: reference to the illustration (see storage below);
  - `pins`: array of `{ x_pct, y_pct, device_feature, label?, icon? }` — coordinates in percent so the image scales freely. Pins are placed by tapping/dragging on the image in the editor; values render as small floating badges (same visual family as chips).
- **Image sources**, in order of effort:
  1. **Bundled gallery**: 4–5 house illustrations shipped with Gladys, all in the same fixed visual style (isometric, soft palette, transparent background — works on light and dark themes). This is the no-Plus, zero-effort path and the showcase of the expected rendering.
  2. **Upload**: any user image (floor plan, garden photo, custom render).
  3. **AI-generated via Gladys Plus** (section F): the user's actual house, in the gallery's exact style.
- **Storage**: uploaded/generated images must not inflate the `boxes` JSON (dashboards are fetched on every load) and must not depend on an external URL. They are stored server-side as a dashboard asset (small dedicated table holding the binary + content type, referenced by id from the box config, served with long cache headers). *Open question: exact table/endpoint shape — to be settled in the implementing PR and folded back into this spec.*
- Optional **night variant**: a second image auto-swapped by sun state (the `sun` box logic already computes it). One extra field, no extra concept.

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

Additive, optional fields on `t_dashboard` (JSON-level, Joi-validated; absent fields = exactly today's rendering):

- `background`: none (default) | a bundled wallpaper | an uploaded image (dashboard asset);
- `card_style`: `default` | `glass` (translucent cards with backdrop blur — only meaningful over a background);
- `theme`: `auto` (default, follows the app) | `light` | `dark`.

Three visual pickers in the dashboard settings, no per-box styling — appearance stays a dashboard-level decision so every widget remains consistent.

## H. Tablet navigation: icon tab bar

- Each dashboard gains an optional `icon` (picker from the existing icon set) next to its name.
- In tablet mode (`session.tablet_mode`, `front/src/routes/dashboard/SetTabletMode.jsx`), the dashboard selector renders as a **horizontal icon tab bar** (current dashboard highlighted) instead of the dropdown — matching touch usage on a wall panel. Outside tablet mode, the dropdown remains.

## Phases

1. **Sections layout** (A) — in progress with a community contributor (forum 10553), including selective stretch (A.4). Ships alone; pure layout, no new widget.
2. **Density widgets**: chips bar (B) + scene state subtitle (C). Small, independent, high visual impact.
3. **Energy flow** (D).
4. **House view** (E) with bundled gallery + upload + pins. Includes the dashboard-asset storage decision.
5. **Plus AI generation** (F) — requires the Gladys Plus backend endpoint; front/server land behind the existing Plus feature detection.
6. **Appearance (G) + tablet tab bar (H)** — independent of 2–5, can ship anytime after 1.

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
