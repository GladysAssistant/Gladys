# Camera PTZ control (pan / tilt / zoom / presets)

> **Living specification — source of truth.** This document specifies how motorized cameras (pan/tilt/zoom, "PTZ") are modeled and controlled in Gladys Assistant. It covers the data model, the server contracts (including MQTT and external integrations), and the frontend. **Rule: any PR that changes a PTZ behavior or contract modifies this file in the same diff** — spec first, code second.
>
> Status: **designed, not yet implemented**.

## Context

Community request ([forum topic 8739](https://community.gladysassistant.com/t/camera-pouvoir-piloter-les-cameras-compatible-onvif/8739)): the `camera` device category is read-only today (a single `image` feature type). Motorized cameras — TP-Link Tapo, Reolink, Foscam, most ONVIF-compliant cameras — expose movement commands (pan/tilt/zoom, stop, position presets) that Gladys cannot represent. A community developer building an external "Tapo ONVIF" integration is blocked on this.

**Design goals, validated with the maintainer:**

1. **Generic, not ONVIF-specific.** ONVIF is the motivating protocol, but the model must be usable by any integration: MQTT bridges, external integrations (store), and future internal services. Nothing in the data model references ONVIF concepts directly — integrations map their protocol (ONVIF `ContinuousMove`/`RelativeMove`/`GotoPreset`, proprietary HTTP APIs…) onto Gladys feature types.
2. **No new control plumbing.** Commands flow through the existing scalar `setValue(device, deviceFeature, value)` path. The original forum proposal suggested extending `setValue` with an `options` object (direction, speed, duration, preset token); this is **rejected** — see "Alternatives considered".
3. **Everything that exists keeps working**: scenes, the MQTT generic device builder, the external-integration WS protocol, and the HTTP API all speak "one feature, one scalar value" and therefore support PTZ with no transport change.

**Precedents followed** (verified in the code):

- Stateless directional commands modeled as one feature type per action: `DEVICE_FEATURE_TYPES.TELEVISION` (`left`, `right`, `up`, `down`, `volume-up`…) and `BUTTON.PUSH` (value `1` = pressed, rendered by `PushDeviceFeature`).
- Enumerated options with human labels: `t_device_feature_supported_option` (integer `value`, string `label`, `sort_order`), synced by `device.syncFeatureSupportedOptions` on device create/update, loaded with every device via `getStandardDeviceIncludes()` (`server/utils/deviceQueryIncludes.js`), and rendered by `AdaptiveOptionControl` (used by AC modes, fan modes). Presets reuse this mechanism as-is.

## A. Data model

### A.1 New feature types

The `camera` category (`DEVICE_FEATURE_CATEGORIES.CAMERA`) gains new types in `DEVICE_FEATURE_TYPES.CAMERA` (`server/utils/constants.js`):

| Type | Constant | Direction | `read_only` | `min`/`max` | `keep_history` | `has_feedback` |
|---|---|---|---|---|---|---|
| `pan-left` | `PAN_LEFT` | command | `false` | 0 / 1 | `false` | `false` |
| `pan-right` | `PAN_RIGHT` | command | `false` | 0 / 1 | `false` | `false` |
| `tilt-up` | `TILT_UP` | command | `false` | 0 / 1 | `false` | `false` |
| `tilt-down` | `TILT_DOWN` | command | `false` | 0 / 1 | `false` | `false` |
| `zoom-in` | `ZOOM_IN` | command | `false` | 0 / 1 | `false` | `false` |
| `zoom-out` | `ZOOM_OUT` | command | `false` | 0 / 1 | `false` | `false` |
| `ptz-stop` | `PTZ_STOP` | command | `false` | 0 / 1 | `false` | `false` |
| `preset` | `PRESET` | command | `false` | 0 / N | `false` | `false` |
| `pan-position` | `PAN_POSITION` | state + command *(optional)* | `false` | integration-defined | integration choice | integration choice |
| `tilt-position` | `TILT_POSITION` | state + command *(optional)* | `false` | integration-defined | integration choice | integration choice |
| `zoom-position` | `ZOOM_POSITION` | state + command *(optional)* | `false` | integration-defined | integration choice | integration choice |

A camera device declares **only the types it supports**. A pan/tilt-only camera has no `zoom-*` features; a fixed camera keeps only `image`. The frontend derives all its UI from the presence of these features — there is no separate "PTZ capability" flag.

**No schema migration.** `category` and `type` are Sequelize ENUMs generated from the constants lists (stored as TEXT in SQLite); adding constants is enough. The `t_device_feature` and `t_device_feature_supported_option` tables are unchanged.

### A.2 Movement command semantics

Movement features (`pan-left`, `pan-right`, `tilt-up`, `tilt-down`, `zoom-in`, `zoom-out`) are **momentary commands** with two values:

- **`1` — start moving** in that direction. The integration either:
  - performs a **bounded continuous move**: start the movement (e.g. ONVIF `ContinuousMove`) and **auto-stop after a watchdog duration** (default **5 seconds**, integration-configurable per device) if no stop arrives first; or
  - performs a **single relative step** (e.g. ONVIF `RelativeMove`) if the camera does not support continuous movement, then ignores the subsequent `0`.
- **`0` — stop moving.** Equivalent to `ptz-stop = 1` for that axis. Integrations doing single steps ignore it.

`ptz-stop = 1` stops **all** ongoing movement (pan, tilt and zoom). `ptz-stop = 0` is a no-op.

**Safety rule (MUST):** an integration implementing continuous movement MUST bound every move with the watchdog. A lost `0` (network drop, browser tab killed mid-press) must never leave a camera rotating against its mechanical stop — this was an explicit pain point in the community request. Because `1` alone is always safe, a plain "push" (send `1`, never `0`) is a valid client behavior everywhere (scenes, device list rows, voice…), producing a bounded move or one step.

Movement speed is **not** part of the v1 contract. Integrations pick a sensible default and MAY expose speed as a device param (`t_device_param`) configurable from their own settings screen. See "Alternatives considered".

### A.3 Presets

The `preset` feature models the camera's saved positions ("Entrance", "Garden"…):

- `setValue(feature, n)` = **recall** preset `n`. Nothing else — creating/renaming/deleting presets on the camera stays in the camera's own app or the integration's settings screen (v1 non-goal, see Phases).
- The preset list lives in the feature's **`supported_options`** (`t_device_feature_supported_option`): `value` = integer slot sent as the command value, `label` = human name, `sort_order` = display order. Integration side, `value` maps to the protocol token (ONVIF preset token, Tapo preset id…). Values MUST be unique per feature; contiguity is not required.
- `min` = 0, `max` = highest option value (kept consistent by the integration when it syncs options).
- The list is synced through the existing device payload path: `POST /api/v1/device` with `features[].supported_options` → `device.syncFeatureSupportedOptions` (already implemented, transaction-safe, preserves ids). An integration that can read presets from the camera (ONVIF `GetPresets`) republishes the device with the fresh list; the UI updates via the existing device WebSocket events.
- A `preset` feature with zero options is valid but renders nothing in dashboards.

### A.4 Absolute position (optional tier)

`pan-position`, `tilt-position`, `zoom-position` are ordinary numeric read/write features for cameras that report their position. The integration declares real units and bounds via `min`/`max` (ONVIF normalized space is −1…1; degrees are fine too — the value is opaque to the core). Writing the value performs an absolute move (`AbsoluteMove`); state updates flow through the normal state path, making positions usable in scene conditions and history. Most consumer cameras don't report position — these features are expected to be rare, and **no dashboard UI is built for them in v1** (they render with the generic numeric row/sensor components).

## B. Server

### B.1 Core — what changes

- `server/utils/constants.js`: the new `DEVICE_FEATURE_TYPES.CAMERA` entries. **That is the only core data-model change.**
- `device.setValue(device, deviceFeature, value, options)` is **unchanged** (signature, behavior, and the "save state when `!has_feedback` and value is numeric" rule — command features get `last_value` 1/0 written, which is harmless and consistent with `BUTTON.PUSH` today; `keep_history: false` keeps them out of history and aggregates).
- No new API route: commands use the existing `POST /api/v1/device_feature/:device_feature_selector/value` (which emits the standard `ACTION.TRIGGERED` → `device.setValue` flow), and the camera dashboard box reads features from the existing `GET /api/v1/device/:device_selector` (stateManager copy, includes `features[].supported_options`).

### B.2 Scenes

Nothing to build: the `device.set-value` scene action works on the new types as soon as they exist. Recalling a preset from a scene ("when I leave, point the camera at the door") is expected to be the most-used automation; the scene editor's feature picker gets correct labels via the same i18n keys as the rest of the UI (D.5). Movement commands from scenes send `1` (bounded by A.2). Position features (A.4) are usable in triggers/conditions like any numeric feature when `has_feedback` is set.

### B.3 Chat / intents

Out of scope for v1 (no "turn the camera left" intent). The existing `camera.get-image` intent is untouched.

## C. Integration contracts

### C.1 MQTT (generic device builder)

The existing generic topics carry PTZ with **no broker/handler change**:

- **Gladys → device** (command; published by `mqtt/lib/setValue.js` today):
  `gladys/device/{device_external_id}/feature/{device_feature_external_id}/state` — payload is the value as a string.

  | User action | Topic (example `external_id`s) | Payload |
  |---|---|---|
  | Hold "left" | `gladys/device/mqtt:cam-salon/feature/mqtt:cam-salon:pan-left/state` | `1` |
  | Release "left" | same topic | `0` |
  | Stop everything | `gladys/device/mqtt:cam-salon/feature/mqtt:cam-salon:ptz-stop/state` | `1` |
  | Recall preset "Jardin" (value 2) | `gladys/device/mqtt:cam-salon/feature/mqtt:cam-salon:preset/state` | `2` |

- **Device → Gladys** (state feedback, optional — position features only):
  `gladys/master/device/{device_external_id}/feature/{device_feature_external_id}/state` (existing inbound handler).

The user's "Tapo ONVIF" bridge therefore subscribes to the command topics and translates to ONVIF calls; the watchdog of A.2 is implemented **in the bridge**.

**MQTT setup UI** (`front/src/routes/integration/all/mqtt/device-page/setup/`):

- The feature catalog is built from the `deviceFeatureCategory.camera.*` i18n keys, so the new types appear once translated (D.5). None of them goes in `MQTT_CATALOG_EXCLUDED_FEATURES`; they all belong to `CATEGORIES_WITHOUT_UNIT`-like handling (no unit field — movement/preset features are unit-less; add the camera command types to the no-unit set).
- Movement command features: `min`/`max` prefilled 0/1, `keep_history` off by default; the catalog preview reuses `PushButtonFeaturePreview`-style rendering plus a notice (like the existing `cameraPreviewNotice`) explaining that PTZ controls appear on the dashboard **Camera widget**, next to the image.
- `preset` feature: the feature edition form gains a small **options editor** (rows of `label` + integer `value`, add/remove/reorder), submitted as `supported_options` in the device payload — the server sync already exists (A.3). Validation: at least one option to be useful (empty allowed), unique values, integer values ≥ 0.
- Position features: standard numeric feature form (min/max editable, optional unit).

### C.2 External integrations (store / WS protocol)

The scalar command already flows: `external-integration.device.set-value` carries `{ device, device_feature: { external_id, category, type }, value }` — a PTZ command is just `category: "camera", type: "pan-left", value: 1`. Camera image and states are untouched.

**One contract addition is required:** the *discovered device* payload (`POST /discovered_device`, C.2 of `external-integrations.md`) and the device payload accepted at creation must carry `features[].supported_options` so an ONVIF integration can publish the preset list it read from the camera (and republish it when presets change on the camera). The core side (`device.create` → `syncFeatureSupportedOptions`) already supports it; the external-integrations spec, SDK typings (`publishDiscoveredDevice`), and store validator must document/accept the field. **Per the living-spec rule, `docs/specs/external-integrations.md` is updated in the same diff as that implementation.**

### C.3 Internal services

- `rtsp-camera` is untouched (RTSP has no control channel). PTZ features on an RTSP camera can still exist if another service/integration owns a sibling device — but a single device's features all belong to one service, so in practice a Tapo camera is either fully handled by an ONVIF-capable integration (image + PTZ) or split into two devices (RTSP image device + MQTT PTZ device). Both work; the camera widget overlay binds to features of **the widget's camera device** (D.1), so the one-device setup gives the best UX. This is a documentation point for integration authors, not a code constraint.
- A future internal ONVIF service (discovery, image, PTZ, preset sync) builds on these types with nothing else needed in the core — explicitly out of scope here.

## D. Frontend

### D.1 Camera dashboard widget — the main PTZ surface

`front/src/components/boxs/camera/Camera.jsx` (still image + HLS live view) gains a PTZ overlay:

- **Data**: on mount (and when `box.camera` changes), fetch `GET /api/v1/device/:selector` and index the camera's PTZ features by type. No feature → no overlay, widget unchanged.
- **Controls**, overlaid on the image/video, bottom-right, Tabler-style semi-transparent buttons:
  - a **D-pad** (◀ ▶ ▲ ▼ around a central ■ stop) — each arrow shown only if the matching feature exists; the stop center shown if `ptz-stop` exists (else it just releases);
  - **zoom** `+` / `−` buttons if zoom features exist;
  - a **preset select** (options from `supported_options`, ordered by `sort_order`) if a `preset` feature with options exists.
- **Interaction** (press-and-hold): `pointerdown` → send `1` on the direction feature; `pointerup` / `pointerleave` / `pointercancel` → send `0`. A quick tap therefore produces `1` then `0` (short bounded move or one step — A.2 makes both correct). While a press is active, other directional presses are ignored. Failsafe: on component unmount, tab `visibilitychange`, or a failed release request, send `ptz-stop = 1` (one retry); the integration watchdog remains the last line of defense.
- Commands go through `POST /api/v1/device_feature/:selector/value` (fire-and-forget; a failed command shows the widget's standard transient error style). No optimistic state to manage — movement features have no meaningful state.
- **Visibility**: overlay appears on hover/focus on pointer devices, always visible on touch devices (same pattern as the video controls). `EditCamera.jsx` gains one checkbox — "Show camera controls (PTZ)" (`box.camera_ptz_controls`, default `true`) — for users who want a clean image even on a motorized camera.
- Overlay is available in both modes (still image and live streaming); in still mode movements won't be visible until the next image refresh, which is acceptable (a hint in the docs recommends live view for aiming).

### D.2 Devices-in-room widget

`front/src/components/boxs/device-in-room/DeviceRow.jsx` mappings (via `ROW_TYPE_BY_CATEGORY_AND_TYPE`, since these type strings are new but category-scoping keeps it collision-proof):

- `camera.preset` → new `CameraPresetDeviceFeature`: labeled select fed by `supported_options` (the `AdaptiveOptionControl` pattern — same as AC/fan modes), sending the option value on change. Stateless: no selected value is highlighted (recalling a preset is an action, not a state); the select resets to a placeholder after sending.
- `camera.pan-left|pan-right|tilt-up|tilt-down|zoom-in|zoom-out|ptz-stop` → `PushDeviceFeature` (sends `1`; bounded by A.2). Functional, but the camera widget is the recommended surface; without this mapping these write-only features would fall back to `SensorDeviceFeature` and render as a bogus sensor.
- Position features → existing numeric components (no dedicated UI in v1).

### D.3 MQTT setup screens

Covered in C.1 (catalog entries, previews, preset options editor).

### D.4 Device settings pages

Generic device/feature views (`front/src/components/device/…`) work as-is; `front/src/utils/consts.js` gets icons for the new types (`DeviceFeatureCategoriesIcon`): arrows (`fe-arrow-*` / `fe-chevrons-*`), `fe-zoom-in`/`fe-zoom-out`, `fe-square` (stop), `fe-map-pin` (preset), `fe-crosshair` (positions).

### D.5 Translations

`front/src/config/i18n/{fr,en}.json` (kept in sync — CI `compare-translations`):

- `deviceFeatureCategory.camera.{pan-left,pan-right,tilt-up,tilt-down,zoom-in,zoom-out,ptz-stop,preset,pan-position,tilt-position,zoom-position}` — these labels drive the MQTT catalog, device views, and the scene feature picker;
- camera widget overlay strings (aria-labels for the D-pad/zoom/stop buttons, preset placeholder, PTZ checkbox label in `EditCamera`);
- MQTT catalog notice for camera command features (points to the Camera widget).

## E. Testing expectations

Per repo policy (100% patch coverage server-side):

- Server: constants list growth is covered by existing model validation tests; add tests for any touched helper (e.g. the no-unit set) and — in the same diff as C.2 — external-integration tests for `supported_options` passing through discovery/creation.
- Front: component tests for the overlay (feature-detection → which controls render; pointer sequence → `1`/`0` calls; failsafe stop) and the preset select; MQTT setup tests for the options editor payload.
- Cypress: extend the MQTT device E2E to create a camera with PTZ features and assert the dashboard widget shows the overlay.

## F. Phases

| Phase | Content | Deliverable |
|---|---|---|
| **1** | Constants + i18n + camera widget overlay (D-pad, zoom, stop, presets) + devices-in-room mappings + MQTT catalog & preset options editor + `external-integrations.md` contract addition (C.2) | A Tapo ONVIF bridge (MQTT or store integration) gives full pan/tilt/zoom/preset control from the dashboard; presets callable from scenes |
| **2** *(not committed)* | Saving/renaming presets from the Gladys UI (needs a new command semantic — likely a `save-preset` type), position sliders UI, speed control, internal ONVIF service (discovery + preset auto-sync), voice intents | — |

## Alternatives considered (rejected)

- **Extending `setValue` with a structured `options` payload** (forum proposal: direction, speed 0–1, distance 0–1, move mode, duration, preset token in one call). Rejected: every consumer of the device-control path — scene actions, the HTTP API, the MQTT publisher, the external-integration WS message, future voice — speaks scalar values keyed by feature; a structured payload would need to be threaded, validated, persisted and rendered through all of them, for a gain (per-command speed) that no other Gladys category needed. The per-type model gives the same UX with zero transport changes, and speed fits later as a device param or a dedicated numeric feature without breaking this contract.
- **A single `ptz-move` enum feature** (one feature, values LEFT/RIGHT/UP/DOWN/STOP…). Rejected: loses per-direction granularity for capability declaration (a pan-only camera can't hide "up/down"), makes scene UX worse (pick a magic number instead of a named feature), and still can't express press-and-hold cleanly.
- **String command feature** (free-text commands). Rejected: strings bypass state validation, history, and every existing UI control; nothing else in Gladys works this way.
- **Modeling presets as one `button.push` feature per preset.** Rejected: N features per camera pollute the device, ordering/labels live in feature names instead of data, and integrations can't atomically sync the list; `supported_options` exists precisely for labeled enumerations.
