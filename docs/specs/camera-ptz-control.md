# Camera PTZ control (pan / tilt / zoom / presets)

> **Living specification — source of truth.** This document specifies how motorized cameras (pan/tilt/zoom, "PTZ") are modeled and controlled in Gladys Assistant. It covers the data model, the server contracts (including MQTT and external integrations), and the frontend. **Rule: any PR that changes a PTZ behavior or contract modifies this file in the same diff** — spec first, code second.
>
> Status: **phase 1 implemented** (see Phases).

## Context

Community request ([forum topic 8739](https://community.gladysassistant.com/t/camera-pouvoir-piloter-les-cameras-compatible-onvif/8739)): the `camera` device category is read-only today (a single `image` feature type). Motorized cameras — TP-Link Tapo, Reolink, Foscam, most ONVIF-compliant cameras — expose movement commands (pan/tilt/zoom, stop, position presets) that Gladys cannot represent. A community developer building an external "Tapo ONVIF" integration is blocked on this.

**Design goals, validated with the maintainer:**

1. **Generic, not ONVIF-specific.** ONVIF is the motivating protocol, but the model must be usable by any integration: MQTT bridges, external integrations (store), and future internal services. Nothing in the data model references ONVIF concepts directly — integrations map their protocol (ONVIF `ContinuousMove`/`RelativeMove`/`GotoPreset`, proprietary HTTP APIs…) onto Gladys feature types.
2. **No new control plumbing.** Commands flow through the existing scalar `setValue(device, deviceFeature, value)` path. The original forum proposal suggested extending `setValue` with an `options` object (direction, speed, duration, preset token); this is **rejected** — see "Alternatives considered".
3. **Capabilities are data, not feature proliferation.** Movement is **one feature** (`camera.move`) whose canonical values are defined in the core, with the camera's actual capabilities declared through the existing `supported_options` mechanism — decided with the maintainer over the one-feature-type-per-direction model (the `TELEVISION` pattern, which predates `supported_options`; see "Alternatives considered").
4. **Everything that exists keeps working**: scenes, the MQTT generic device builder, the external-integration WS protocol, and the HTTP API all speak "one feature, one scalar value" and therefore support PTZ with no transport change.

**Precedents followed** (verified in the code):

- One feature whose integer values name distinct actions/capabilities, constrained per device by options: `air-conditioning.mode` — canonical values in `AC_MODE` (`server/utils/constants.js`), per-device subset in `t_device_feature_supported_option` (integer `value`, string `label`, `sort_order`), synced by `device.syncFeatureSupportedOptions` on device create/update, loaded with every device via `getStandardDeviceIncludes()` (`server/utils/deviceQueryIncludes.js`), rendered by `AdaptiveOptionControl`. Also `button.click`, where the value encodes which kind of click happened.
- Presets reuse the same `supported_options` mechanism with free (per-device) labels.

## A. Data model

### A.1 New feature types

The `camera` category (`DEVICE_FEATURE_CATEGORIES.CAMERA`) gains new types in `DEVICE_FEATURE_TYPES.CAMERA` (`server/utils/constants.js`):

| Type | Constant | Role | `read_only` | `min`/`max` | `keep_history` | `has_feedback` |
|---|---|---|---|---|---|---|
| `move` | `MOVE` | movement command (pan/tilt/zoom/stop) | `false` | 0 / 6 | `false` | `false` |
| `preset` | `PRESET` | recall a saved position | `false` | 0 / N | `false` | `false` |
| `pan-position` | `PAN_POSITION` | absolute position *(optional)* | `false` | integration-defined | integration choice | integration choice |
| `tilt-position` | `TILT_POSITION` | absolute position *(optional)* | `false` | integration-defined | integration choice | integration choice |
| `zoom-position` | `ZOOM_POSITION` | absolute position *(optional)* | `false` | integration-defined | integration choice | integration choice |

A camera device declares **only the features it supports**, and within `move`, only the movements it supports (A.2). A fixed camera keeps only `image`. The frontend derives all its UI from the features and their `supported_options` — there is no separate "PTZ capability" flag.

**No schema migration.** `category` and `type` are Sequelize ENUMs generated from the constants lists (stored as TEXT in SQLite); adding constants is enough. The `t_device_feature` and `t_device_feature_supported_option` tables are unchanged.

### A.2 The `move` feature

A single feature carries all movement commands. The **canonical values** are defined in the core (same pattern as `AC_MODE`):

```js
const CAMERA_MOVE = {
  STOP: 0,
  PAN_LEFT: 1,
  PAN_RIGHT: 2,
  TILT_UP: 3,
  TILT_DOWN: 4,
  ZOOM_IN: 5,
  ZOOM_OUT: 6,
};
```

**Command semantics:**

- **`setValue(feature, V)` with `V` in 1–6 — start moving** in direction `V`. The integration either:
  - performs a **bounded continuous move**: start the movement (e.g. ONVIF `ContinuousMove`) and **auto-stop after a watchdog duration** (default **5 seconds**, integration-configurable per device) if no stop arrives first; or
  - performs a **single relative step** (e.g. ONVIF `RelativeMove`) if the camera does not support continuous movement, then ignores the subsequent stop.
- **`setValue(feature, 0)` — stop all ongoing movement** (pan, tilt and zoom). Sending a new direction while moving switches direction (integration stops the previous move first).

**Safety rule (MUST):** an integration implementing continuous movement MUST bound every move with the watchdog. A lost stop (network drop, browser tab killed mid-press) must never leave a camera rotating against its mechanical stop — this was an explicit pain point in the community request. Because a direction value alone is always safe, a plain "send `V` once" is a valid client behavior everywhere (scenes, voice, device list rows…), producing a bounded move or one step.

**Lone-value callers beware:** with continuous movement and the default watchdog, a lone `V` without a `0` (a scene action, a quick push row tap whose release is lost) means up to **the full watchdog duration of motion** (~5 s by default) — not a small nudge. Integrations SHOULD therefore prefer a relative step (e.g. ONVIF `RelativeMove`) when the camera supports it, or expose a shorter watchdog / step size as a device param, so that lone values behave as the "one step" callers intuitively expect.

**Capability declaration:** the feature's `supported_options` list the movement values (1–6) the camera actually supports — e.g. a pan/tilt camera without motorized zoom declares options 1–4. `STOP` (0) is always supported and is **not** listed as an option. Labels in `supported_options` default to the canonical i18n labels (D.5); the UI renders from the canonical values (arrow icons, not labels), so labels only matter in label-based surfaces (scene editor, MQTT setup recap). A `move` feature without any `supported_options` row is treated as supporting all six movements (fallback, mirroring the AC-mode legacy behavior).

Movement speed is **not** part of the v1 contract. Integrations pick a sensible default and MAY expose speed as a device param (`t_device_param`) configurable from their own settings screen. Diagonal/simultaneous movement is likewise out of v1: one movement at a time; if a real need emerges, new canonical values (e.g. `UP_LEFT: 7`…) extend the enum without breaking the contract. See "Alternatives considered".

### A.3 Presets

The `preset` feature models the camera's saved positions ("Entrance", "Garden"…):

- `setValue(feature, n)` = **recall** preset `n`. Nothing else — creating/renaming/deleting presets on the camera stays in the camera's own app or the integration's settings screen (v1 non-goal, see Phases).
- The preset list lives in the feature's **`supported_options`**: `value` = integer slot sent as the command value, `label` = human name (free text, per device — unlike `move`, there are no canonical values), `sort_order` = display order. Integration side, `value` maps to the protocol token (ONVIF preset token, Tapo preset id…). Values MUST be unique per feature; contiguity is not required.
- `min` = 0, `max` = highest option value (kept consistent by the integration when it syncs options).
- The list is synced through the existing device payload path: `POST /api/v1/device` with `features[].supported_options` → `device.syncFeatureSupportedOptions` (already implemented, transaction-safe, preserves ids). An integration that can read presets from the camera (ONVIF `GetPresets`) republishes the device with the fresh list; for external integrations the supervisor silently upserts the options of already-created devices on re-publish, like the `params` (`upsertFeatureSupportedOptions`, see `external-integrations.md` C.3).
- A `preset` feature with zero options is valid but renders nothing in dashboards.

### A.4 Absolute position (optional tier)

`pan-position`, `tilt-position`, `zoom-position` are ordinary numeric read/write features for cameras that report their position. The integration declares real units and bounds via `min`/`max` (ONVIF normalized space is −1…1; degrees are fine too — the value is opaque to the core). Writing the value performs an absolute move (`AbsoluteMove`); state updates flow through the normal state path, making positions usable in scene conditions and history. Most consumer cameras don't report position — these features are expected to be rare, and **no dashboard UI is built for them in v1** (they render with the generic numeric row/sensor components).

## B. Server

### B.1 Core — what changes

- `server/utils/constants.js`: the new `DEVICE_FEATURE_TYPES.CAMERA` entries and the `CAMERA_MOVE` value enum. **That is the only core data-model change.**
- `device.setValue(device, deviceFeature, value, options)` is **unchanged** (signature, behavior, and the "save state when `!has_feedback` and value is numeric" rule — the `move` feature gets `last_value` = last command written, which is harmless and consistent with `BUTTON.PUSH` today; `keep_history: false` keeps commands out of history and aggregates).
- No new API route: commands use the existing `POST /api/v1/device_feature/:device_feature_selector/value` (which emits the standard `ACTION.TRIGGERED` → `device.setValue` flow), and the camera dashboard box reads features from the existing `GET /api/v1/device/:device_selector` (stateManager copy, includes `features[].supported_options`).

### B.2 Scenes

Nothing to build: the `device.set-value` scene action works on the new types as soon as they exist. Recalling a preset from a scene ("when I leave, point the camera at the door") is expected to be the most-used automation. Movement commands from scenes send a `CAMERA_MOVE` value (bounded by A.2). The scene editor's value input is a raw number today; a worthwhile follow-up (benefits AC modes and fan modes too, not just cameras) is to make the scene `device.set-value` action render a labeled select when the target feature has `supported_options` — tracked as a phase-2 item, not a blocker. Position features (A.4) are usable in triggers/conditions like any numeric feature when `has_feedback` is set.

### B.3 Chat / intents

Out of scope for v1 (no "turn the camera left" intent). The existing `camera.get-image` intent is untouched.

## C. Integration contracts

### C.1 MQTT (generic device builder)

The existing generic topics carry PTZ with **no broker/handler change**:

- **Gladys → device** (command; published by `mqtt/lib/setValue.js` today):
  `gladys/device/{device_external_id}/feature/{device_feature_external_id}/state` — payload is the value as a string.

  | User action | Topic (example `external_id`s) | Payload |
  |---|---|---|
  | Hold "left" | `gladys/device/mqtt:cam-salon/feature/mqtt:cam-salon:move/state` | `1` |
  | Release (stop) | same topic | `0` |
  | Hold "zoom in" | same topic | `5` |
  | Recall preset "Jardin" (value 2) | `gladys/device/mqtt:cam-salon/feature/mqtt:cam-salon:preset/state` | `2` |

- **Device → Gladys** (state feedback, optional — position features only):
  `gladys/master/device/{device_external_id}/feature/{device_feature_external_id}/state` (existing inbound handler).

The user's "Tapo ONVIF" bridge therefore subscribes to the command topics and translates `CAMERA_MOVE` values to ONVIF calls; the watchdog of A.2 is implemented **in the bridge**.

**MQTT setup UI** (`front/src/routes/integration/all/mqtt/device-page/setup/`):

- The feature catalog is built from the `deviceFeatureCategory.camera.*` i18n keys, so the new types appear once translated (D.5). None of them goes in `MQTT_CATALOG_EXCLUDED_FEATURES`; all camera command types are added to the no-unit set (movement/preset features are unit-less).
- `move` feature: `min`/`max` prefilled 0/6, `keep_history` off by default. Instead of a generic label/value editor, the form shows **one checkbox per canonical movement** (pan left/right, tilt up/down, zoom in/out — all checked by default); checked movements become the `supported_options` rows with their canonical labels. The catalog preview shows a small D-pad mock plus a notice (like the existing `cameraPreviewNotice`) explaining that PTZ controls appear on the dashboard **Camera widget**, next to the image.
- `preset` feature: the feature edition form gains a small **options editor** (rows of `label` + integer `value`, add/remove/reorder), submitted as `supported_options` in the device payload — the server sync already exists (A.3). Validation: at least one option to be useful (empty allowed), unique values, integer values ≥ 0.
- Position features: standard numeric feature form (min/max editable, optional unit).

### C.2 External integrations (store / WS protocol)

The scalar command already flows: `external-integration.device.set-value` carries `{ device, device_feature: { external_id, category, type }, value }` — a PTZ command is just `category: "camera", type: "move", value: 1`. Camera image and states are untouched.

**One contract addition is required:** the *discovered device* payload (`POST /discovered_device`, C.2 of `external-integrations.md`) and the device payload accepted at creation must carry `features[].supported_options` so an ONVIF integration can publish both its supported movements and the preset list it read from the camera (and republish when presets change). The core side (`device.create` → `syncFeatureSupportedOptions`) already supports it; the external-integrations spec, SDK typings (`publishDiscoveredDevices`), and store validator must document/accept the field. **Per the living-spec rule, `docs/specs/external-integrations.md` is updated in the same diff as that implementation.**

### C.3 Internal services

- `rtsp-camera` is untouched (RTSP has no control channel). PTZ features on an RTSP camera can still exist if another service/integration owns a sibling device — but a single device's features all belong to one service, so in practice a Tapo camera is either fully handled by an ONVIF-capable integration (image + PTZ) or split into two devices (RTSP image device + MQTT PTZ device). Both work; the camera widget overlay binds to features of **the widget's camera device** (D.1), so the one-device setup gives the best UX. This is a documentation point for integration authors, not a code constraint.
- A future internal ONVIF service (discovery, image, PTZ, preset sync) builds on these types with nothing else needed in the core — explicitly out of scope here.

## D. Frontend

### D.1 Camera dashboard widget — the main PTZ surface

`front/src/components/boxs/camera/Camera.jsx` (still image + HLS live view) gains a PTZ overlay:

- **Data**: on mount (and when `box.camera` changes), fetch `GET /api/v1/device/:selector`, find the `move`/`preset` features and read the `move` feature's `supported_options`. No PTZ feature → no overlay, widget unchanged.
- **Controls**, overlaid on the live video, top-right, Tabler-style semi-transparent buttons (the bottom band of the player belongs to the native `<video>` controls — seek bar, volume — which a bottom-anchored pad covered, per field feedback):
  - a **D-pad** (◀ ▶ ▲ ▼ around a central ■ stop) — each arrow shown only if the matching `CAMERA_MOVE` value is in the supported options (fallback: all, per A.2); the stop center is always shown when the `move` feature exists;
  - **zoom** `+` / `−` buttons if `ZOOM_IN`/`ZOOM_OUT` are supported;
  - a **preset select** (options from the `preset` feature's `supported_options`, ordered by `sort_order`) if present and non-empty.
- **Interaction** (press-and-hold): `pointerdown` on a control → send its `CAMERA_MOVE` value; `pointerup` / `pointerleave` / `pointercancel` → send `0`. Keyboard is a first-class path: `Space`/`Enter` `keydown` (non-repeated) = press, `keyup` or focus loss (`blur`) = release — same duplicate-press guard as pointers. A quick tap therefore produces `V` then `0` (short bounded move or one step — A.2 makes both correct). While a press is active, other directional presses are ignored. Each press opens a **movement session** bound to the feature it was sent to: the release `0` is queued **after** the move request settles (a fast release can never reach the server before its move, and a move whose response is lost still gets its stop), and is sent on the session's feature (a camera change mid-press never stops another camera). Failsafe: on component unmount, tab `visibilitychange`, or a failed release request, the session is released the same way (stop retried once); the integration watchdog remains the last line of defense. The stop button renders whenever any movement is supported — including zoom-only cameras. A **standalone stop** (stop button with no movement in flight) is tracked too: consecutive stops chain behind each other, and the next press queues its move after the whole chain settles, so a stale stop can never terminate a movement started after it.
- **Staleness guards**: a camera change clears the overlay immediately and responses from superseded requests are dropped (request generation), so the controls can never target the previously selected camera. The feature list (and thus the preset list) is loaded on widget mount and camera change; there is **no live push of device-structure changes today** (the device WebSocket events cover states only), so a preset list resynced by an integration appears on the next dashboard load — a device-structure WS event is a phase-2 candidate.
- Commands go through `POST /api/v1/device_feature/:selector/value` (fire-and-forget; a failed command shows the widget's standard transient error style). No optimistic state to manage — the `move` feature has no meaningful state.
- **Visibility**: overlay appears on hover/focus on pointer devices, always visible on touch devices (same pattern as the video controls). `EditCamera.jsx` gains one checkbox — "Show camera controls (PTZ)" (`box.camera_ptz_controls`, default `true`) — for users who want a clean image even on a motorized camera.
- Overlay is rendered on the **live view only**: in snapshot mode movements are not visible until the next image refresh, so the pad is pointless there and only got in the way of the widget's other actions (field feedback from the first ONVIF integration test). Cameras without live streaming keep PTZ control through the devices-in-room rows (D.2) and scenes.

### D.2 Devices-in-room widget

`front/src/components/boxs/device-in-room/DeviceRow.jsx` mappings (via `ROW_TYPE_BY_CATEGORY_AND_TYPE`, category-scoped so the new type strings stay collision-proof):

- `camera.move` → new `CameraMoveDeviceFeature`: one compact row of icon buttons (◀ ▶ ▲ ▼ − + and stop) derived from `supported_options`, each press (pointer or keyboard, same semantics as D.1, including the movement session — STOP is only sent once the move request settled) sending its `CAMERA_MOVE` value then `0` on release. One row per camera instead of up to seven. Both `move` and `preset` join the devices-in-room allowlist (`SUPPORTED_FEATURE_TYPES_BY_CATEGORY` in `SupportedFeatureTypes.jsx`) — a control type absent from it never renders (see `docs/specs/device-feature-categories.md`, rule 8).
- `camera.preset` → new `CameraPresetDeviceFeature`: labeled select fed by `supported_options` (the `AdaptiveOptionControl` pattern — same as AC/fan modes), sending the option value on change. Stateless: no selected value is highlighted (recalling a preset is an action, not a state); the select resets to a placeholder after sending.
- Position features → existing numeric components (no dedicated UI in v1).

### D.3 MQTT setup screens

Covered in C.1 (catalog entries, previews, movement checkboxes, preset options editor).

### D.4 Device settings pages

Generic device/feature views (`front/src/components/device/…`) work as-is; `front/src/utils/consts.js` gets icons for the new types (`DeviceFeatureCategoriesIcon`): `fe-move` (move), `fe-map-pin` (preset), `fe-crosshair` (positions).

### D.5 Translations

All locale files under `front/src/config/i18n/` (`en.json`, `fr.json`, `de.json` today) — the repository rule is full key parity across every language file, enforced by CI `compare-translations`:

- `deviceFeatureCategory.camera.{move,preset,pan-position,tilt-position,zoom-position}` — these labels drive the MQTT catalog, device views, and the scene feature picker;
- canonical `CAMERA_MOVE` value labels (`deviceFeatureAction.category.camera.move.{stop,pan-left,pan-right,tilt-up,tilt-down,zoom-in,zoom-out}`) — used for default `supported_options` labels, MQTT checkboxes, and button aria-labels;
- camera widget overlay strings (preset placeholder, PTZ checkbox label in `EditCamera`);
- MQTT catalog notice for camera command features (points to the Camera widget).

## E. Testing expectations

Per repo policy (100% patch coverage server-side):

- Server: constants list growth is covered by existing model validation tests; add tests for any touched helper (e.g. the no-unit set) and — in the same diff as C.2 — external-integration tests for `supported_options` passing through discovery/creation and the re-publish upsert.
- Front: the repo has no unit-test script — front behavior is validated by eslint, `compare-translations`, the production build, and Cypress.
- Cypress: no MQTT device-setup E2E exists today; when one is added, cover creating a camera with a `move` feature and assert the dashboard widget shows the overlay.

## F. Phases

| Phase | Content | Deliverable |
|---|---|---|
| **1** | Constants (`CAMERA_MOVE` + types) + i18n + camera widget overlay (D-pad, zoom, stop, presets) + devices-in-room rows + MQTT catalog, movement checkboxes & preset options editor + `external-integrations.md` contract addition (C.2) | A Tapo ONVIF bridge (MQTT or store integration) gives full pan/tilt/zoom/preset control from the dashboard; presets callable from scenes |
| **2** *(not committed)* | Labeled select for `supported_options` features in the scene editor (B.2), saving/renaming presets from the Gladys UI, position sliders UI, speed control, diagonal moves (new `CAMERA_MOVE` values), a device-structure WebSocket event so open widgets pick up resynced preset lists live (D.1), internal ONVIF service (discovery + preset auto-sync), voice intents | — |

## Alternatives considered (rejected)

- **One feature type per direction** (`pan-left`, `pan-right`, `tilt-up`, `tilt-down`, `zoom-in`, `zoom-out`, `ptz-stop` — the `TELEVISION` pattern, and this spec's first draft). Rejected after maintainer review: `TELEVISION` predates `supported_options` and per-direction types re-encode capabilities as feature existence, which multiplies setup friction (up to seven features to create per camera in the MQTT UI, seven external_ids/topics per bridge) and adds a dedicated `ptz-stop` feature that the single-feature model gets for free (`STOP = 0`). With canonical `CAMERA_MOVE` values plus `supported_options` (the `AC_MODE` precedent), one feature expresses the same capabilities as data. Trade-offs accepted: movement values in scenes are numbers until the scene editor learns `supported_options` (phase 2), and simultaneous pan+zoom cannot be expressed (irrelevant to the v1 UI, extensible later via new canonical values).
- **Extending `setValue` with a structured `options` payload** (forum proposal: direction, speed 0–1, distance 0–1, move mode, duration, preset token in one call). Rejected: every consumer of the device-control path — scene actions, the HTTP API, the MQTT publisher, the external-integration WS message, future voice — speaks scalar values keyed by feature; a structured payload would need to be threaded, validated, persisted and rendered through all of them, for a gain (per-command speed) that no other Gladys category needed. The scalar model gives the same UX with zero transport changes, and speed fits later as a device param without breaking this contract.
- **String command feature** (free-text commands). Rejected: strings bypass state validation, history, and every existing UI control; nothing else in Gladys works this way.
- **Modeling presets as one `button.push` feature per preset.** Rejected: N features per camera pollute the device, ordering/labels live in feature names instead of data, and integrations can't atomically sync the list; `supported_options` exists precisely for labeled enumerations.
