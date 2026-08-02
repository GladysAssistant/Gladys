# Device migration (deprecated integrations → replacement integrations)

> **Living specification — source of truth.** This document specifies the behavior of the device migration feature. **Rule: any PR that changes a migration behavior or contract modifies this file in the same diff** — spec first, code second.

## Context

Several native integrations are deprecated (Netatmo, MELCloud, Tuya — and, with this feature, Philips Hue and TP-Link) in favor of external integrations (see `external-integrations.md`) or other native paths (MQTT, Zigbee2MQTT…). Users who recreate their devices in the new integration lose three things tied to the old device: the state history (DuckDB), the scene references, and the dashboard references. This feature lets a user migrate a device to another device **in one click**: Gladys moves the DuckDB history, rewrites scenes and dashboards, then deletes the old device.

Scoping decisions validated with the maintainer:
- **The source device is deleted automatically** after a successful migration. That is the point of the migration: one device remains, no duplicate in rooms or in the UI. Since its history has just been moved, the deletion is cheap (no "too much states" refusal).
- **History overlap is cut at the destination's first state.** When both integrations ran in parallel, only source states **strictly older than the destination feature's oldest state** are moved; the source states of the overlap period are deleted with the device. No double counting in charts or energy computations. If the destination feature has no state at all, the whole source history is moved.
- **Philips Hue and TP-Link are flagged `deprecated`** in the front catalog (`front/src/config/integrations/devices.json`) and their pages mount the existing `DeprecationWarning` banner, like Netatmo/MELCloud/Tuya.
- **Any device of any other service can be a destination** — not only external-integration devices. Users may migrate to Zigbee2MQTT, MQTT, Matter… The only exclusions: the source device itself and devices of the **same service** as the source (migrating a deprecated device onto another device of the same deprecated integration makes no sense).
- **Feature mapping is explicit.** The frontend proposes an automatic matching (below) that the user can adjust feature by feature; the API receives the final explicit mapping and applies it. A source feature can be left unmapped: its history is not moved and disappears with the device (references to it in scenes/dashboards are left dangling, exactly like today's device deletion — the UI warns before confirming).

## A. What migrates, what does not

| Data | Behavior |
|---|---|
| DuckDB state history (`t_device_feature_state`, keyed by feature UUID) | **Moved** per mapped feature pair, re-keyed with `UPDATE … SET device_feature_id`, cut at the destination's oldest state. Remaining source rows deleted. |
| SQLite leftover states + aggregates (pre-DuckDB-migration installs) | **Deleted** (not moved): they are legacy leftovers pending purge; the DuckDB migration at boot has already imported them. Deleting them inline also guarantees the final `destroy` never hits the 5000-states refusal. |
| Scenes (`t_scene.actions` / `t_scene.triggers`, selector strings) | **Rewritten**: every mapped source feature selector and the source device selector are replaced by their destination counterparts (exhaustive field list in B.3). RAM scene cache resynchronized via `addScene`. |
| Dashboards (`t_dashboard.boxes`, selector strings) | **Rewritten** with the same replacement maps (field list in B.3). Selector replacement never changes array positions, so the positional companions (`device_feature_names`, `units`, `colors`) stay aligned by construction. |
| Room | **Inherited only if the destination has none**: if `destination.room_id` is null and the source has a room, the destination moves into the source's room (keeps `devices-in-room` boxes and room-scoped features working). If the destination already has a room, it keeps it. |
| `energy_parent_id` links (other features pointing at a source feature) | **Re-pointed** to the mapped destination feature. Links to unmapped source features are nulled by the existing FK `ON DELETE SET NULL`. |
| Energy price contracts (`t_energy_price.electric_meter_device_id`, device FK, `ON DELETE SET NULL`) | **Re-pointed** to the destination device, unconditionally: without it, deleting the source meter would silently detach the contracts and cost charts would lose their meter. |
| `last_value` / `last_value_string` / `last_value_changed` | **Copied only if fresher**: for each mapped pair, if the destination's `last_value_changed` is null or older than the source's, the source's three fields are copied so dashboards show a current value until the new integration publishes one. Otherwise untouched. |
| Device params, `external_id`, selectors, names | **Never touched.** The destination device keeps its identity entirely; the migration moves data *about* the device, not the device definition. |
| Source device | **Deleted** at the end via the standard `device.destroy` path (service `postDelete` hooks, cache eviction, poll deregistration, `EVENTS.DEVICE.DELETE` all fire normally). |

## B. Detailed design

### B.1 Automatic feature matching (frontend)

Matching is computed client-side in the migration modal (both devices' features are already loaded; no dedicated endpoint):
- A source feature is **auto-matched** to a destination feature when exactly **one unused** destination feature has the same `(category, type, unit)` triple (null units compare equal). Unit equality is required for the *automatic* match only — values are moved without conversion, so a sole °F candidate must never be silently pre-selected for a °C source; the user can still map it manually and gets the unit warning. Matching is re-evaluated as the user edits: a destination feature already picked (manually or automatically) for another source feature is not proposed twice.
- When zero or several candidates exist, the source feature starts **unmapped** and the user picks manually.
- The manual dropdown lists **all** destination features (minus already-used ones), same-`type` candidates first; picking a feature with a different `type` shows a non-blocking warning (the history values may not be meaningful in the destination's unit).
- The server does **not** re-derive the matching; it validates and applies the explicit mapping it receives (B.2).

### B.2 API contract

`post /api/v1/device/:device_selector/migrate` (authenticated **and admin-only**: a migration deletes a device with its history and rewrites the dashboards of every user, which makes it an instance-wide operation like the other `admin: true` routes; the integration pages carrying the Migrate button are admin-only in the frontend anyway. Declared **before** `get /api/v1/device/:device_selector` following the existing literal-before-`:selector` precedent).

**Concurrency**: two migrations touching the same device must never run at the same time — same source (a client-timeout retry could otherwise start a second run while the first is still deleting history) or same destination (each run works from a snapshot of the destination features; a concurrent run would make it stale). The device manager keeps an in-memory set of in-flight selectors covering **both endpoints** of every running migration; a call touching a locked selector is rejected with a `409 Conflict` and no job side effects beyond the failed job row. In-memory is sufficient: Gladys is single-process.

Request body:

```json
{
  "destination_device_selector": "my-new-device",
  "features_mapping": {
    "<source_feature_selector>": "<destination_feature_selector>"
  }
}
```

Validation (all violations → `BadParameters` 400; unknown selectors → `NotFoundError` 404):
- source and destination devices exist and are **different**;
- destination belongs to a **different service** than the source;
- every mapping key is a feature of the source device, every value a feature of the destination device;
- no destination feature is used twice;
- `features_mapping` may be empty (`{}`): the migration then only rewrites device-level references (scene `devices` arrays, `camera`/`device`/`music` boxes…), inherits the room, and deletes the source device.

Response 200 (the request is awaited end-to-end; the run is also wrapped as a job — B.4):

```json
{
  "success": true,
  "duck_db_states_migrated": 12345,
  "scenes_updated": ["scene-selector-1"],
  "dashboards_updated": ["dashboard-selector-1"]
}
```

### B.3 Selector rewriting (scenes and dashboards)

Two replacement maps are built once: `featureReplacements` (mapped source feature selector → destination feature selector) and `deviceReplacements` (source device selector → destination device selector).

Fields rewritten — this list is **exhaustive and must stay in sync with the Joi schemas** of `server/models/scene.js` and `server/models/dashboard.js` (both reject unknown keys, so any new device-referencing field lands here in the same diff):
- **Scene actions** (`t_scene.actions`, array of arrays, recursing into `condition.if-then-else`'s `if` / `then` / `else`): `device_feature` (feature), `device_features[]` (features), `device` (device), `devices[]` (devices), `camera` (device).
- **Scene triggers** (`t_scene.triggers`, flat array): `device_feature` (feature), `device` (device — schema-declared legacy field, rewritten for safety).
- **Dashboard boxes** (`t_dashboard.boxes`, array of arrays): `device_feature` (feature), `device_features[]` (features), `device` (device), `camera` (device). Values are replaced **in place**; array length and order never change, keeping `device_feature_names` / `units` / `colors` index-aligned.

Only scenes/dashboards that actually changed are saved. Rewritten scenes go through `SceneManager.addScene` so the RAM copy (`this.scenes`, the one `checkTrigger` iterates) and its scheduled triggers are replaced atomically with the DB copy — the same path as `scene.update`. Dashboards have no RAM cache. References to **unmapped** source features are intentionally left dangling (existing deletion semantics; the UI warned).

### B.4 Orchestration (`server/lib/device/device.migrate.js`)

`DeviceManager.migrate(sourceSelector, { destination_device_selector, features_mapping })`, wrapped as a job (`JOB_TYPES.DEVICE_MIGRATE = 'device-migrate'`) for progress/visibility in the jobs page, **and** awaited by the controller (the HTTP response carries the final report). The device manager gets `sceneManager` by post-construction assignment in `server/lib/index.js` (existing precedent: `gateway.scene = scene`); dashboards have no RAM cache and are rewritten straight through `db.Dashboard` (deliberately bypassing the per-user scoping of `dashboard.update`: a migration is a whole-instance operation).

The job's structured progress (`device_name`, `destination_device_name`, `step`) is **rendered by the jobs page**: `JobData.jsx` registers a `DEVICE_MIGRATE` renderer (same pattern as the purge jobs) and every step key has a `jobsSettings.jobData.steps.*` translation — the error/timeout copy sends users there, so the page must show more than a bare percentage.

Known trade-off: each per-feature DuckDB `UPDATE` runs as a single statement on the serial write queue, so a feature with years of history briefly stalls live state inserts (same behavior as the other one-shot data moves). Acceptable for a one-off admin gesture; slicing by `created_at` ranges (purge-style) is the hardening lever if field feedback asks for it.

Ordered steps (order is a contract — history first, then references, deletion last, so a failure leaves a re-runnable state):
1. Load + validate (B.2).
2. **Per mapped pair — history move**: read `MIN(created_at)` of the destination feature in DuckDB; `UPDATE t_device_feature_state SET device_feature_id = CAST(? AS UUID) WHERE device_feature_id = CAST(? AS UUID)` with `AND created_at < CAST(? AS TIMESTAMPTZ)` when a cutoff exists; count moved rows for the report. Then `DELETE` the remaining source rows of that feature (overlap period).
3. **Per unmapped source feature**: `DELETE` its DuckDB rows.
4. One `CHECKPOINT` after all DuckDB writes (flushes the WAL, releases delete-tracking memory — same rationale as the purge).
5. **SQLite leftovers**: single `DELETE` per source feature on `t_device_feature_state` and `t_device_feature_state_aggregate` (no batching: one-off migration gesture, indexed column; this also guarantees step 9 passes the destroy count check).
6. **`last_value` copy** (freshness rule of section A) + **`energy_parent_id` re-point** for mapped pairs; refresh the affected feature rows in the state manager caches.
7. **`t_energy_price.electric_meter_device_id` re-point** (section A) then **room inheritance** (rule of section A); on room change, refresh the destination device in caches and `notify(EVENTS.DEVICE.UPDATE)`.
8. **Rewrite scenes then dashboards** (B.3).
9. **Destroy the source device** via `this.destroy(source.selector)` — standard semantics (hooks, caches, poll, notify).

Failure modes: any throw before step 9 leaves both devices in place; the migration is re-runnable (already-moved rows simply stay on the destination; the cutoff rule makes re-running convergent). The job records the failure (`JOB_STATUS.FAILED` + error string) like every wrapped job. If the HTTP client times out mid-run, the server-side run continues; the result is visible in the jobs page and the device list reflects the outcome (the in-flight guard of B.2 rejects a retry started while the first run is still going).

**Atomicity — a deliberate non-goal.** DuckDB cannot join a SQLite transaction, so a migration can never be fully atomic; wrapping only the SQLite writes in a transaction would buy little (the irreversible part is the DuckDB history move) while forcing the scene rewrites out of the scene manager path that keeps the RAM cache in sync — a rollback would desynchronize RAM from DB. Instead the design leans on ordering and convergence: the only data irreversibly gone before the final destroy is history the user explicitly chose to drop (unmapped features) or overlap duplicates; every SQLite rewrite (scenes, dashboards, FKs, room) is idempotent; re-running after a mid-run failure converges to the same final state. The failure copy in the frontend reflects this honestly (some history may already have been moved; re-running only moves what remains).

### B.5 Frontend

- **Shared components** in `front/src/components/device/migrate/`: `MigrateDeviceButton.jsx` (small button, `connect('httpClient')`-self-contained so it drops into both integration architectures) opening `MigrateDeviceModal.jsx`.
- **Mounted on the device boxes** of the five deprecated integrations: `netatmo/NetatmoDeviceBox.jsx`, `melcloud/MELCloudDeviceBox.jsx`, `tuya` device box, `philips-hue/device-page/Device.jsx`, `tp-link/device-page/Device.jsx` — **only** on already-created devices (not on discovery items).
- **Modal flow**: (1) pick the destination device — the modal loads `get /api/v1/device` and filters out the source device and its whole service, with a text filter; (2) feature mapping table pre-filled by the auto-matching (B.1), one row per source feature, each row a dropdown of remaining destination features plus "do not migrate"; unmapped rows, `type` mismatches and `unit` mismatches (values are moved without conversion) show a warning; the confirm button is disabled while a migration is in flight (no double-submit); (3) recap ("history, scenes and dashboards will be migrated; the old device will be deleted") → confirm → spinner → success screen with the report counts, then the integration's device list refreshes. Network failure shows a "migration may still be running, check the jobs page" message (B.4).
- **Catalog**: `deprecated: true` added to `philipsHue` and `tpLink` in `front/src/config/integrations/devices.json`; `DeprecationWarning` mounted in `PhilipsHuePage.jsx` and `TpLinkPage.jsx` (first child of the `col-lg-9` column, existing pattern).
- **i18n**: new keys under `device.migrate.*` in `en.json`, `fr.json`, `de.json` (the three files stay line-parallel; `compare-translations` enforces key parity).

## Verification

- Server unit tests (`server/test/lib/device/device.migrate.test.js` + controller test): cutoff semantics (destination with/without existing states), unmapped features, empty mapping, validation errors, scene rewriting incl. nested `if/then/else` and RAM resync, dashboard rewriting incl. positional-array preservation, room inheritance both ways, `energy_parent_id` re-point, `last_value` freshness rule, source deletion, report counts. 100% patch coverage (CI contract).
- Front: `npm run prettier` + `npm run prettier-check` + eslint + `compare-translations` + build; Cypress specs on integration pages must stay green.
