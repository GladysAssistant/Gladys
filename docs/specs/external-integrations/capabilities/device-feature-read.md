> Part of the [external integrations living spec](../README.md) — the layout, the editing rules and the cross-repo map are there.

# `device_features_read` capability: reading the device features the user designates (design)

Goal: let an external integration use device features **of other integrations** that the **user explicitly designates** for it — and nothing else. First consumer: a home battery integration (Zendure) that must know the main grid meter (import and export power, import and export indexes, possibly per phase — a Linky teleinformation, a Shelly EM, an MQTT meter) and possibly a PV production meter; the same contract later enables zero feed-in power matching, which needs the meter's new values within seconds.

Until this capability, an integration only saw its own perimeter: `GET /device` returns the devices of its own `t_service` (C.3), and the `source` of a config field could only offer its own devices or the houses (C.1). The meter of another integration was out of reach, and asking the user to copy a feature selector into a text field would neither be usable nor grant anything verifiable.

It is a **capability**, not a type (doctrine of `provider-type.md`): any integration type may declare it.

## 1. Manifest (C.1)

Top-level boolean **`device_features_read`**, named like the other declarative authorization contracts (`location`, `network_wake`):

```json
{
  "device_features_read": true,
  "config_schema": [
    {
      "key": "grid_power",
      "type": "select",
      "source": "device_features",
      "label": { "en": "Grid meter: power", "fr": "Compteur : puissance" },
      "feature_filters": [
        { "category": "energy-sensor", "type": "power" },
        { "category": "teleinformation" },
        { "category": "grid-sensor" }
      ],
      "required": true
    },
    {
      "key": "pv_meters",
      "type": "multi_select",
      "source": "device_features",
      "label": { "en": "PV production meters", "fr": "Compteurs de production PV" },
      "feature_filters": [{ "category": "energy-production-sensor" }]
    }
  ]
}
```

Rules (`validateManifest`, mirrored by the vendored `manifest.schema.json` — the canonical copy in `GladysAssistant/integration-store` must carry the same rules before such a manifest can be published through the store):

- `device_features_read`: boolean, optional. **Declaring a `source: "device_features"` field requires `device_features_read: true`** — otherwise the manifest is rejected (`config_schema[i].source: device_features requires device_features_read: true`). The gate alone (no such field yet) is valid.
- `source: "device_features"` is a third value of the `source` enum, on `select` (one feature) and `multi_select` (several) fields only, with the existing source rules (no static `options`, no `default`).
- It is **only allowed in the `config_schema`**: an action `fields`, a `contact_schema`, an `account_schema`, a widget's `settings` or a scene declaration's `fields` declaring it is rejected. The read scope is what the user saved in the integration's configuration (section 3): a designation made in a one-shot action form, a widget box or a scene would reach the integration without ever granting anything — accepting it there would offer a picker that silently does not work.
- **`feature_filters`** (**required** with `source: "device_features"`, refused on any other field — manifest rejection either way): 1–20 entries `{ "category": "<category>", "type": "<type>" }`, `category` required, `type` optional, both `[a-z0-9-]+`, no other key. A feature matching **one** entry (its category, and its type when the entry has one) can be designated, no other. There is no "every feature" picker: the shared picker otherwise lists cameras, locks, presence, text…, the container of an unaudited store integration has open egress, and an integration needing "everything" is precisely what this contract refuses. The matching fails closed (a field without filters — a record the validator never accepted — matches nothing). An entry naming the `camera` category or the `image` type is rejected (`… features can never be designated`, see the exclusion below). The shape rejects, the **vocabulary only warns**: a category or type this core does not know (a taxonomy added in a later Gladys) is logged and simply matches no feature here — the same two-stage philosophy as the catalog `categories` (`integration-catalog-categories.md` §6.2), so a manifest written against a newer taxonomy still installs.
- **Camera images are out of scope**, whatever the filters: a `camera` feature (or any `image`-type feature) is never offered by the picker, refused by the config validation, dropped from the grant, never served by the read endpoints nor pushed. A camera image is a JPEG frame of up to ~150 kB that every other serving path withholds in private mode and expires after one hour (`docs/specs/camera-enable-disable.md`); a designation must not become a snapshot pipe into a container, and a later write/control capability must not inherit one by accident. The exclusion lives in one helper (`validateConfigValue.isExcludedFeature`, mirrored by the front `dynamicOptions.matchesFeatureFilters`), so this capability adds no image serving path.
- Declaring the field or the source value requires `gladys_version` ≥ the first release whose validator accepts them (older cores reject unknown manifest fields and source values).

The request is shown on the **install screen** as an information block next to the network discovery requests ("This integration requests read access to the device features of other integrations that you choose in its configuration… It can only read the features you select, never your other devices."). Like `location`, the gate is re-read from the stored manifest at each update (the known limit of the declarative contracts, C.3 under `GET /house`).

## 2. The config field: picker, stored value, designation

**Rendering** (`ConfigSchemaForm`): the shared `SelectDeviceFeature` picker the scene editor and the dashboard boxes already use — features of **every** integration grouped by room, searchable, narrowed by the field's `feature_filters` (`filterFeature`, camera images never offered); `multi_select` renders it in multi mode **with mixed kinds allowed** (`allowMixedFeatures`: import and export power, indexes… — the scene editor's "same category and type" restriction does not apply to a designation list). Under the picker, a privacy hint: only the features selected here can be read by the integration. The source is not loaded by the shared `dynamicOptions.js` helper: the picker loads the features itself (`GET /api/v1/room?expand=devices` + `GET /api/v1/device`, routes every authenticated user can read; the Configuration screen is admin-only anyway). **A stored designation that no longer resolves** once the picker has loaded every feature (device deleted since, feature now outside the filters) is dropped from the form value — a `select` becomes `null`, a `multi_select` keeps the resolved selectors only (`SelectDeviceFeature` `onOptionsLoaded`, fired only when **both** fetches succeeded: if `GET /api/v1/device` fails, the devices without room are missing from the list and the stored designations are left untouched) — so the picker, which already shows it empty, and the next save agree: the save records the withdrawal instead of being refused (`422`) with nothing left to clear.

**Stored value** — what `GET /config` and `config-updated` give the integration, like any field:
- `select`: the designated feature **selector** (string), or `null` once the user cleared it;
- `multi_select`: an array of selectors (unique, ≤ 20; `[]` once cleared).

**Validation** (`validateConfigValue` with the `device_features` resolver of `getDynamicOptions`: one query listing every feature's `selector`, `category`, `type`): the selector must be an existing device feature matching the field's `feature_filters`, and not a camera image, `422` otherwise. The error **never lists the features** (`must be one of the selectors of the device features matching the field`) — the answer must not hand the instance's inventory to anyone. `null` is accepted on a `select` (withdrawal); the front sends `null` for a cleared `select` instead of omitting the key, otherwise the partial merge would keep the old designation and the user could not withdraw it.

**The designation is a grant recorded by the core, not the config value.** When the **frontend** saves the Configuration screen (`saveConfigFromFront`), the core records the validated values of the `source: "device_features"` fields present in the payload in a core-owned variable **`GLADYS_DEVICE_FEATURES_GRANT`** (`{ "<field key>": ["<selector>", …] }`, scoped to the integration's `t_service`, partial merge like the config). Three reasons:
- the config value alone cannot be trusted as a user choice — the same reasoning as the `houses` source (C.1): a key that was **free storage** of the integration under an older manifest may become a `device_features` field in a newer one, with a value the integration wrote itself;
- `GLADYS_*` keys are read-only for the integration (`POST /config` → `400`), so it cannot forge the record;
- the record is **not returned** by `GET /config` nor `config-updated` (`getIntegrationConfig` skips it): it is the core's bookkeeping, the integration reads its designations as plain config values.

**The integration never designates.** On `POST /config` from the integration, a `source: "device_features"` field may only be written back **unchanged** (the write-back of its whole config — a no-op, neither re-validated nor persisted); any other value is `403 FORBIDDEN` (`only the user designates the device features of this field`), whatever the manifest declares, with no existence check (no oracle on the features of the instance). Same rule as a `houses` field without `location: true`.

**The effective scope** (`getDeviceFeatureGrant`) is the union of the recorded grant of the `source: "device_features"` fields **the current manifest still declares**, each one **re-filtered by that field's current `feature_filters`** (and the camera exclusion), and it is empty unless the stored manifest declares `device_features_read: true`. A field removed or renamed in a new version stops granting; filters tightened in a new version shrink the scope at once (a selector the field no longer asks for is dropped, the record itself is left as the user saved it); the gate removed in a new version closes everything. A designated feature deleted since (device removed by the user) stays in the grant and answers `404` until the user picks again — like a deleted house. A feature selector is set at creation (`addSelectorBeforeValidateHook` only slugifies new records), so a designation survives renaming the device or the feature.

## 3. Host API (C.3), integration → core

Common to both endpoints, in this order: no `device_features_read: true` in the stored manifest → `403 FORBIDDEN`; malformed parameters → `400`; rate limit → `429 TOO_MANY_REQUESTS` (`RATE_LIMIT_EXCEEDED`, fixed one-minute window per integration, the `POST /state` pattern); any selector **not designated** → `403 FORBIDDEN` listing the refused selectors, decided **before any existence check** (a `403` never says whether a feature exists); a designated feature that no longer exists → `404 NOT_FOUND`.

**`GET /api/integration/v1/device_feature/state?selectors=<selector>,<selector>`** → `200`

```json
[
  {
    "selector": "linky-papp",
    "name": "Puissance apparente",
    "category": "teleinformation",
    "type": "power",
    "unit": "volt-ampere",
    "last_value": 1840,
    "last_value_string": null,
    "last_value_changed": "2026-01-12T10:00:02.000Z"
  }
]
```

1–50 comma-separated selectors (trimmed, duplicates collapsed), one entry per selector in the requested order, read from the core's in-memory state (no database query). `last_value_string` carries the state of a text feature, **up to 1 KB** (UTF-8 bytes, `MAX_DEVICE_FEATURE_STRING_VALUE_BYTES`): above, it is `null` — the capability serves meter-like values, not payloads. Rate limit: **120 requests/minute** — enough for a resynchronization at (re)connection and an occasional poll; the low-latency path is the push of section 4, not polling. A batch containing one deleted feature answers `404` naming it (the integration learns which designation is stale).

**`GET /api/integration/v1/device_feature/aggregate?selector=<selector>&from=<ISO 8601>&to=<ISO 8601>&interval=30m|1h|1d`** → `200`

```json
{
  "selector": "linky-east",
  "unit": "watt-hour",
  "interval": "30m",
  "values": [
    { "created_at": "2026-01-12T00:00:00.000Z", "value": 12.5, "min_value": 10, "max_value": 15, "sum_value": 50, "count_value": 4 }
  ]
}
```

The history of **one** designated feature from the states the core keeps for it (`t_device_feature_state`, DuckDB — a feature whose history the user switched off returns no values), aggregated per bucket: average (`value`), min, max, sum and count — the same columns as the existing aggregation routes (`getDeviceFeaturesAggregates`, `getConsumptionByDates`), so a client of one reads the other. `from` inclusive, `to` exclusive, `from < to`; buckets are aligned in the **Gladys timezone** (`TIMEZONE` system setting, `Europe/Paris` by default — a `1d` bucket is a local day, `created_at` is the bucket start); empty buckets are omitted. Bound: **at most 2,000 buckets per request** (~41 days of `30m`, ~83 days of `1h`, ~5 years of `1d`), `400` beyond — the integration pages through longer ranges. Rate limit: **30 requests/minute**, a counter separate from the state reads (each call is a DuckDB query). No new aggregation engine: one `time_bucket` query on the existing table.

For an index feature, the consumption over a range is the integration's to derive from the bucket `min_value`/`max_value` (the core's own 30-minute consumption feature, derived from a meter index — `host-api-endpoints.md`, energy derivation —, can simply be designated too: its `sum_value` per bucket is the consumption).

## 4. WebSocket (C.4), core → integration

**`external-integration.device-feature.new-state`** — `{ "selector": "linky-papp", "last_value": 1840, "last_value_changed": "2026-01-12T10:00:02.000Z" }` (`last_value_string` instead of `last_value` for a text feature, `null` above 1 KB like the state read). Fire-and-forget: no `message_id`, no ack, **lost while the integration is disconnected** like every core → integration notification (C.4 reliability rules) — the integration resynchronizes with `GET /device_feature/state` at each (re)connection.

Emitted for every new state saved for a designated feature (`device.saveState` / `saveStringState`), within the same tick: the supervisor listens to `EVENTS.TRIGGERS.CHECK` (`type: device.new-state`) — the very hook the Google Home and Alexa state forwarding uses — and sends to each **connected** integration whose designations contain the feature. The designations are held in memory per connected integration (`deviceFeatureReadGrants`): loaded when the integration connects (`integrationConnected`), refreshed when the user saves its config, dropped when it disconnects; the lookup on each state is a `Set` membership test over the connected integrations, so an instance without designations pays nothing (early return), and a state of an undesignated feature costs that membership test only. When the feature is designated, the listener checks it again against the camera exclusion (never sent, even if one were held in memory) and applies the 1 KB cap **before** building the message, so a large text state is never serialized; the payload is built once for every integration it goes to. No throttle: the rate is the meter's own (a teleinformation frame every ~2 s, a Shelly EM every second), the payload is a few bytes, and the push is precisely what power matching needs.

## 5. Privacy and trust boundary

- **Only the designated selectors, never other devices**: there is no listing endpoint — the integration cannot enumerate the features of the instance, it only reads back what the user picked for it. The picker is rendered by the core, in the admin's browser.
- **Consent is an explicit user gesture, revocable**: the designation is recorded only from the Configuration screen; clearing the field withdraws it at once (reads `403`, the push stops on the save). Uninstalling the integration deletes the record with its variables.
- **What a designation exposes**: the feature's name, category, type, unit, current value (a text state up to 1 KB) and its history as stored by the core. Never the device's other features, its params, its room or its integration — and never a camera image.
- **No oracle**: the `403` of the read endpoints and of `POST /config` is decided before any existence check, and validation errors never list features.
- **Server-side enforcement only**: the manifest gate and the grant are checked by the core on every request; the install screen disclosure informs, it does not enforce.
- Accepted: the gate is re-read at each update (same known limit as `location`, C.3) — but an update cannot widen the scope by itself, since the grant only holds what the user picked, and it shrinks it when it tightens the filters (the grant is re-filtered by the current manifest).

## 6. JS SDK (C.8)

Follow-up in `GladysAssistant/integration-sdk-js` (not part of this monorepo change): `getDeviceFeatureStates(selectors)`, `getDeviceFeatureAggregates({ selector, from, to, interval })` and an `onDeviceFeatureNewState(handler)` subscription, plus the resynchronization of designated states at reconnection; the fake Gladys of `integration-sdk/testing` serves the same contract.

## 7. Tests

- `validateManifest` (`externalIntegration.validateManifest.deviceFeatures.test.js`): gate required by a field, boolean gate, source outside the `config_schema` refused (actions, widget settings), the existing source rules, `feature_filters` required, shape and placement, camera / image filters refused, unknown vocabulary warned not rejected, vendored schema mirror.
- Lib (`externalIntegration.deviceFeatureRead.test.js`): resolver and per-field filters (fail closed, camera images never matched), `null` withdrawal, 20-feature cap, grant recorded from the front only and kept out of `GET /config`, an integration-written value never trusted as a grant, scope limited to the declared fields behind the gate and re-filtered by their current filters (camera dropped, deleted feature kept), malformed grant record, `POST /config` write-back rule; both reads (gate, `400`, `403` before `404`, ordering, rate limits and window reset, bucket aggregation, `to` exclusive, local days in the default timezone); 1 KB text cap on the state read; push (designated only, numeric and text states, 1 KB cap, camera never pushed, one payload for several integrations, other events ignored, loaded on connect and dropped on disconnect).
- HTTP (`test/controllers/integrationHost/integrationHost.deviceFeature.test.js`): `200`, `400`, `401`, `403` without the gate and for an undesignated feature, aggregate response shape. The suite reloads the seeded device into the shared instance's state manager before each test (the database is reseeded, the state manager is not: another file of the same mocha worker may have deleted that device).

## 8. Verification (manual e2e, environment with the Docker socket)

1. Install an integration declaring `device_features_read: true` and a `source: "device_features"` field: the install screen shows the disclosure.
2. On its Configuration screen, the picker only offers the features matching the filters (never a camera); pick a meter power feature and save. Delete that device, reopen the screen: the field is empty and saving succeeds, the reads answer `403`.
3. From the container: `GET /device_feature/state?selectors=<picked>` → `200`; with another existing selector → `403`; `GET /device_feature/aggregate` over the last day in `30m` → buckets.
4. Watch the integration WebSocket: each new meter value arrives as `device-feature.new-state`.
5. Clear the field and save: the reads answer `403` and the push stops.

## Follow-ups (deliberately out of this change)

- **Widget settings** as a designation surface: a widget's settings live in the dashboard boxes, so the scope would have to be derived from every dashboard holding a box of the integration (and kept in sync on box edits and dashboard deletions). The picker itself would be free (same form engine), the grant bookkeeping is not: left out, and the source is rejected in widget settings meanwhile rather than offered and inert.
- **Writing** to a designated feature (driving another integration's device, e.g. a smart plug for surplus routing) — a different consent ("control" vs "read") with its own gate; never implied by this one.
- The SDK surface (section 6) and the canonical schema in `GladysAssistant/integration-store`.
- Re-prompting the user when an update adds the gate (the cross-contract known limit, C.3).

## Alternatives considered

- **Let the integration list all features and pick itself** — rejected: the whole inventory of the instance (and its activity) would leak to unaudited third-party code; the user's designation is the only meaningful consent.
- **Trust the stored config value as the scope** — rejected for the free-storage reason of section 2; a grant written only by the frontend path costs one variable.
- **A dedicated config field `type`** (`device_feature`) instead of a `source` — rejected: `select`/`multi_select` already carry single vs multi, the stored value and the dynamic validation path, and `source` is the reserved, extensible enum made for "options provided by the core".
- **Push through a new event bus or a per-feature subscription API** — rejected: the designations already are the subscription; the existing `TRIGGERS.CHECK` hook is where every saved state passes.
