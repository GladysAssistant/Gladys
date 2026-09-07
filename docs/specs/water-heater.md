# Water heater (domestic hot water appliances)

> **Living specification — source of truth.** This document specifies the `water-heater` device feature category: its types, its value semantics, and the contracts integrations and the frontend rely on. **Rule: any PR that changes a water-heater behavior or contract modifies this file in the same diff** — spec first, code second.
>
> This category is designed under `docs/specs/device-feature-categories.md`, the taxonomy's design rules and review checklist. Section D audits this design against that checklist.

## Context

Gladys has no category for domestic hot water. A connected water heater can only be published today as a makeshift assembly: `switch`/`binary` for on/off and `heater`/`pilot-wire-mode` — a *room heating* concept — bent into a mode selector. Three consequences:

- the user does not recognize their appliance in the dashboard: no hot-water level, no mode names that mean anything for a tank, a "Heating" label on a device that heats water and not the room;
- integrations have no stable mapping target. `server/services/matter/README.md` lists `WaterHeaterManagement` and `WaterHeaterMode` as **not handled**, precisely because there is nothing to map them onto;
- scenes offer no mode selector, so "switch the water heater to Eco when the house is empty" has to be written as a magic integer against a pilot-wire enum whose values mean something else.

This spec adds a dedicated **`water-heater`** category. `AGENTS.md` mandates the spec-first process for anything touching the data model: a `DEVICE_FEATURE_CATEGORIES` entry is a contract consumed by native integrations, the REST API, external integrations and the three i18n files at once, and renaming it afterwards is breaking.

Scoping decisions:

- **A dedicated category, not an extension of `heater` or `thermostat`.** `heater` is room heating (its single type is `pilot-wire-mode`, a French wiring standard), `thermostat` is an ambient setpoint. Heating domestic hot water is a distinct capability, modelled as such by Matter (`WaterHeaterManagement`, `WaterHeaterMode`), and merging the two would make the dashboard label lie about what the device does.
- **The category covers the capability, not one product family.** It must fit an electric storage tank, a heat-pump water heater and a gas-fired one alike, from any brand and any protocol. Section A.5 and A.6 give two deliberately different reference profiles.
- **Six types, all intrinsic to producing and storing hot water.** Everything a real appliance also reports — its consumption, the temperature it measures, its efficiency — belongs to other categories on the same device (A.4). Section C records what was deliberately left out and why.
- **v1 is core + UI + the external-integration contract.** Concrete Zigbee2MQTT/MQTT/Matter mappings, a dedicated dashboard box and sanitary-safety features are explicit non-goals (section C).

## A. Device model

### A.1 Category and feature types

`DEVICE_FEATURE_CATEGORIES.WATER_HEATER = 'water-heater'`, with a matching `DEVICE_FEATURE_TYPES.WATER_HEATER` block.

**The two keys must be spelled identically** (`WATER_HEATER` on both sides). `front/cli/check_translations.js` looks up `DEVICE_FEATURE_TYPES[categoryKey]` by the *category key*, so a mismatch silently disables translation checking for every type of the category — the repository already carries one such drift (`HEPA_FILTER_MONITORING` vs `FILTER_MONITORING`), and this category must not add a second.

| Type | Value | Direction | Units | min / max | Semantics |
|---|---|---|---|---|---|
| `BINARY` | `binary` | command | — | 0 / 1 | Appliance on/off. `0` = standby (frost protection may still run), `1` = running. |
| `MODE` | `mode` | command | — | 0 / 6 | Operating mode, `WATER_HEATER_MODE` (A.2). The enum is the **full generic set**; which modes a given appliance offers is declared per feature via `supported_options` (A.3). |
| `TARGET_TEMPERATURE` | `target-temperature` | command | `celsius`, `fahrenheit` | 30 / 70 | Hot water setpoint. Bounds are defaults: an integration publishes the appliance's real range. |
| `REMAINING_HOT_WATER` | `remaining-hot-water` | sensor | `percent`, `liter` | 0 / 100 | Hot water available for use. Appliances publish it either as a percentage of the tank or as a V40 volume (litres usable at 40 °C) — hence two allowed units, `percent` being the default. With `liter`, `max` carries the tank's V40 capacity. |
| `HEATING` | `heating` | sensor | — | 0 / 1 | `1` while the appliance is actively heating water, `0` at rest. |
| `BOOST` | `boost` | command | — | 0 / 1 | Forced heating. Writing `1` starts a boost, `0` cancels it. The appliance clears it on its own when the cycle ends — Gladys never expires it (B.2). |

Every unit named above already exists in `DEVICE_FEATURE_UNITS`, so no `deviceFeatureUnit` / `deviceFeatureUnitShort` key is created by this feature.

`read_only` follows the Direction column (`sensor` → `true`, `command` → `false`); it is the field the frontend actually routes on (B.3), not the type name.

Nothing here is mandatory. An appliance publishes the subset it actually exposes; there is no "a water heater must have X" rule.

### A.2 The mode enumeration

Integers, like `PILOT_WIRE_MODE` and `AC_MODE`. This is not a style choice: `ACTIONS.DEVICE.SET_VALUE` in `server/lib/scene/scene.actions.js` aborts the scene with `ACTION_VALUE_NOT_A_NUMBER` on anything non-numeric, so a string-valued mode would be unusable from a scene.

```js
const WATER_HEATER_MODE = {
  OFF: 0,          // appliance stopped (frost protection may remain active)
  AUTO: 1,         // the appliance decides, learning the household's consumption
  ECO: 2,          // the appliance's energy-saving mode: heat-pump-only on a heat-pump
                   // appliance, consumption learning on a plain electric tank
  BOOST: 3,        // the fastest heating the appliance is capable of
  MANUAL: 4,       // fixed setpoint, no learning
  AWAY: 5,         // holiday / away, minimum temperature kept
  PROGRAM: 6,      // follows the schedule stored in the appliance
};
```

This is the **full generic set of operating modes a water heater can have**, deliberately wider than any single appliance. Per rule 6 of the taxonomy spec, an appliance supporting three of these is not a reason to narrow the enum or to add a binary type per mode: it declares its three through `supported_options` (A.3).

Every value is an **operating mode**, never a heat source. An earlier draft carried an `ELECTRIC` value ("resistive element only, auxiliary source disabled"); it was dropped because selecting a heat source is precisely what section C defers under `heat-source`, Matter's mode tags have no equivalent, and the enum is append-only — a value shaped around one appliance family cannot be taken back later. "Which source is heating right now" is a separate question from "what is the appliance trying to do".

Values are **append-only once this spec is merged**. A new mode takes the next free integer; an existing integer never changes meaning, because it will be stored in device states and hard-coded in users' scenes. Renumbering is free only until then.

`BOOST` appears both as a mode value and as the `boost` command type. That mirrors Matter, where boosting is a *command* (`WaterHeaterManagement`) while the operating mode lives in a separate mode cluster. **An integration maps whichever form its appliance natively reports, never both for the same function** — two controls over one state would drift apart the moment one of them is written. When the appliance exposes a real mode enumeration, `mode` is preferred: translated labels, ordered options, one dashboard row instead of several.

### A.3 Supported options — how an appliance declares the modes it has

No two water heaters offer the same mode list, and one appliance may present its modes as separate switches rather than as a selector. Both are handled by `supported_options` (`t_device_feature_supported_option`, created by migration `20260619120000-create-device-feature-supported-option.js`) rather than by narrowing the taxonomy:

- integrations publish `supported_options: [{ value, label, sort_order }]` alongside the feature; `server/utils/normalizeSupportedOptions.js` validates it (integer values on enum-like features such as this one — string values only exist on `text`/`select` dynamic selects —, non-empty labels, no duplicates, `sort_order` defaulted to the array index) and `server/lib/device/device.syncFeatureSupportedOptions.js` persists it on create/update;
- the frontend resolves the list with `resolveFeatureOptions` (`front/src/utils/supportedOptions.js`): the declared options drive **which** entries appear and in what order, while the static catalog supplies the i18n key so the labels stay translated. The integration's raw `label` is only a fallback for a value Gladys does not know.

A feature published **without** `supported_options` falls back to the full `WATER_HEATER_MODE` catalog — **not** bounded by the feature's `max`. The modes are a set, not a ladder: `AWAY` is not "more" than `MANUAL`, so `max` says nothing about which modes an appliance has, and filtering on it would hide valid modes — or, when `max` is unset (a device built by hand carries no `min`/`max`), leave the control with no options at all. Offering every mode is the safe failure: the appliance rejects what it cannot do, whereas an empty selector is a dead end. This fallback exists for legacy and hand-made features; declaring `supported_options` is the recommended path.

**Appliances whose modes are separate toggles.** Many tanks expose "away" and "eco" as independent on/off switches rather than as one selector. They still map onto `mode`: the integration declares the reachable values (`MANUAL`, `ECO`, `AWAY`) in `supported_options` and translates the appliance's switch combination into the current value, writing the corresponding switch when Gladys sets a new one. The user gets one row with named buttons instead of several unlabelled switches, and the appliance keeps its own notion of which mode to return to when "away" is cleared. This is a mapping concern, deliberately kept out of the taxonomy — see D.2 for the one case where it is genuinely constraining.

### A.4 What belongs to other categories

The category covers only the metrics **intrinsic** to producing and storing hot water. A real appliance reports more than that, and each of those values goes to its own category **on the same device** — a Gladys device carries features from several categories, which is the normal shape:

| Value the appliance reports | Category to use | Why not a water-heater type |
|---|---|---|
| Temperature of the water in the tank | `temperature-sensor` / `decimal` — the constant is `DEVICE_FEATURE_TYPES.SENSOR.DECIMAL`, not a `TEMPERATURE_SENSOR` type (that sub-object only holds `min`/`max`/`average`) | A temperature measurement is a temperature measurement whatever measures it (taxonomy rule 2). `server/services/matter/utils/convertToGladysDevice.js` already maps the Thermostat cluster's local temperature to exactly this pair; a tank probe is the same quantity. |
| Electrical consumption, power, index | `energy-sensor` (`power`, `energy`, `index`) | Reusing them links the appliance to the household meter through `energy_parent_id` (`server/utils/resolveEnergyParentId.js`) and to the whole energy pipeline: the `energy-consumption` dashboard box, cost computation, and the 30-minute consumption/cost children created by `server/services/energy-monitoring/utils/addEnergyFeatures.js`. A `water-heater.energy` twin would sit outside `ENERGY_INDEX_FEATURE_TYPES` and be invisible to all of it. |
| Ambient / room temperature, humidity | `temperature-sensor`, `humidity-sensor` | Same rule: the quantity, not the device reporting it. |

### A.5 Reference device A — a heat-pump water heater with a mode selector

```json
{
  "name": "Water heater",
  "external_id": "ext:my-integration:heat-pump-tank",
  "features": [
    {
      "name": "State",
      "external_id": "ext:my-integration:heat-pump-tank:binary",
      "category": "water-heater",
      "type": "binary",
      "read_only": false, "has_feedback": true, "keep_history": true,
      "min": 0, "max": 1
    },
    {
      "name": "Mode",
      "external_id": "ext:my-integration:heat-pump-tank:mode",
      "category": "water-heater",
      "type": "mode",
      "read_only": false, "has_feedback": true, "keep_history": true,
      "min": 0, "max": 6,
      "supported_options": [
        { "value": 1, "label": "Auto", "sort_order": 0 },
        { "value": 2, "label": "Eco", "sort_order": 1 },
        { "value": 3, "label": "Boost", "sort_order": 2 },
        { "value": 5, "label": "Away", "sort_order": 3 }
      ]
    },
    {
      "name": "Setpoint",
      "external_id": "ext:my-integration:heat-pump-tank:target-temperature",
      "category": "water-heater",
      "type": "target-temperature",
      "unit": "celsius",
      "read_only": false, "has_feedback": true, "keep_history": true,
      "min": 40, "max": 62
    },
    {
      "name": "Available hot water",
      "external_id": "ext:my-integration:heat-pump-tank:remaining-hot-water",
      "category": "water-heater",
      "type": "remaining-hot-water",
      "unit": "percent",
      "read_only": true, "has_feedback": false, "keep_history": true,
      "min": 0, "max": 100
    },
    {
      "name": "Heating",
      "external_id": "ext:my-integration:heat-pump-tank:heating",
      "category": "water-heater",
      "type": "heating",
      "read_only": true, "has_feedback": false, "keep_history": true,
      "min": 0, "max": 1
    },
    {
      "name": "Water temperature",
      "external_id": "ext:my-integration:heat-pump-tank:temperature",
      "category": "temperature-sensor",
      "type": "decimal",
      "unit": "celsius",
      "read_only": true, "has_feedback": false, "keep_history": true,
      "min": 0, "max": 100
    },
    {
      "name": "Consumption",
      "external_id": "ext:my-integration:heat-pump-tank:energy",
      "category": "energy-sensor",
      "type": "energy",
      "unit": "kilowatt-hour",
      "read_only": true, "has_feedback": false, "keep_history": true,
      "min": 0, "max": 1000000
    }
  ]
}
```

Two of its seven features are **not** water-heater types (A.4) — that is the intended shape, not an omission.

### A.6 Reference device B — an electric tank exposing switches

The counter-example: a flat multi-position steatite electric storage tank with no heat pump, whose native interface is three independent switches (away, eco, boost) plus a water temperature and a hot-water percentage. It publishes **no `binary`, no `target-temperature`**, and it is a perfectly valid water heater — this profile exists so that no later change can quietly make any type mandatory, and so the mapping of A.3 has a worked example.

```json
{
  "name": "Water heater",
  "external_id": "ext:my-integration:tank",
  "features": [
    {
      "name": "Mode",
      "external_id": "ext:my-integration:tank:mode",
      "category": "water-heater",
      "type": "mode",
      "read_only": false, "has_feedback": true, "keep_history": true,
      "min": 0, "max": 6,
      "supported_options": [
        { "value": 4, "label": "Manual", "sort_order": 0 },
        { "value": 2, "label": "Eco", "sort_order": 1 },
        { "value": 5, "label": "Away", "sort_order": 2 }
      ]
    },
    {
      "name": "Boost",
      "external_id": "ext:my-integration:tank:boost",
      "category": "water-heater",
      "type": "boost",
      "read_only": false, "has_feedback": true, "keep_history": true,
      "min": 0, "max": 1
    },
    {
      "name": "Available hot water",
      "external_id": "ext:my-integration:tank:remaining-hot-water",
      "category": "water-heater",
      "type": "remaining-hot-water",
      "unit": "percent",
      "read_only": true, "has_feedback": false, "keep_history": true,
      "min": 0, "max": 100
    },
    {
      "name": "Water temperature",
      "external_id": "ext:my-integration:tank:temperature",
      "category": "temperature-sensor",
      "type": "decimal",
      "unit": "celsius",
      "read_only": true, "has_feedback": false, "keep_history": true,
      "min": 0, "max": 100
    }
  ]
}
```

The appliance's two-position eco switch and its away switch are folded into the single `mode` feature: `supported_options` lists the three reachable values, the integration derives the current one from the switch states, and setting `ECO` flips the eco switch while setting `MANUAL` clears it. The dashboard shows one row with three named buttons.

## B. Detailed design

### B.1 Constants (`server/utils/constants.js`)

1. `WATER_HEATER: 'water-heater'` in `DEVICE_FEATURE_CATEGORIES` (alphabetical position, next to `WATER_VALVE`).
2. The `WATER_HEATER: { … }` block in `DEVICE_FEATURE_TYPES`, carrying the **inline scope comment** required by rule 8 of the taxonomy spec:

```js
// Domestic hot water appliances: electric storage tanks, heat-pump water heaters,
// gas-fired water heaters. Scope is limited to producing and storing hot water.
// Boundary with neighboring categories: the water temperature measured in the tank
// is a temperature-sensor/decimal feature, electrical consumption is energy-sensor,
// and room heating stays in heater/thermostat — a water heater device carries those
// features alongside its water-heater ones.
// Value conventions: all commands are non-negative integers; `mode` is an index into
// WATER_HEATER_MODE, `binary`/`heating`/`boost` are 0/1. Boosting exists both as a
// mode value and as the `boost` command: an integration maps whichever form its
// appliance natively reports, never both for the same function.
WATER_HEATER: {
  BINARY: 'binary',                            // appliance on/off (command)
  MODE: 'mode',                                // operating mode, WATER_HEATER_MODE (command)
  TARGET_TEMPERATURE: 'target-temperature',    // hot water setpoint (command)
  REMAINING_HOT_WATER: 'remaining-hot-water',  // hot water available, % or litres V40 (sensor)
  HEATING: 'heating',                          // actively heating water or not (sensor)
  BOOST: 'boost',                              // forced heating on/off (command)
},
```

3. `WATER_HEATER_MODE` next to the other enums at the top of the file, with its own `module.exports.` line.
4. `DEVICE_FEATURE_UNITS_BY_CATEGORY[WATER_HEATER] = [CELSIUS, FAHRENHEIT, PERCENT, LITER]`.
5. **`DEVICE_FEATURE_UNITS_BY_CATEGORY_AND_TYPE[WATER_HEATER]`, mandatory.** The category-level list mixes three dimensions, and the device edit form (`front/src/components/device/UpdateDeviceFeature.jsx`) and the MQTT device page (`front/src/routes/integration/all/mqtt/device-page/setup/Feature.jsx`) both fall back to the category list when there is no per-type entry — a user editing the setpoint would be offered "litres":

```js
[DEVICE_FEATURE_CATEGORIES.WATER_HEATER]: {
  [DEVICE_FEATURE_TYPES.WATER_HEATER.BINARY]: [],
  [DEVICE_FEATURE_TYPES.WATER_HEATER.MODE]: [],
  [DEVICE_FEATURE_TYPES.WATER_HEATER.TARGET_TEMPERATURE]: [CELSIUS, FAHRENHEIT],
  [DEVICE_FEATURE_TYPES.WATER_HEATER.REMAINING_HOT_WATER]: [PERCENT, LITER],
  [DEVICE_FEATURE_TYPES.WATER_HEATER.HEATING]: [],
  [DEVICE_FEATURE_TYPES.WATER_HEATER.BOOST]: [],
},
```

An empty array means "this type has no unit" and hides the unit dropdown entirely.

**No database migration.** `DEVICE_FEATURE_CATEGORIES_LIST` and `DEVICE_FEATURE_TYPES_LIST` are derived by `createList` at module load, `server/models/device_feature.js` builds its Sequelize `ENUM`s from those lists, and SQLite stores enums as `TEXT` without enforcing them. The `water-valve` category shipped with no migration file; this one does the same.

### B.2 Writing values and feedback

No server-side handler. `server/lib/device/device.setValue.js` is fully generic: it forwards to the service's `device.setValue` and, **only when `has_feedback` is false**, saves the value itself. Water heaters answer slowly (a setpoint change takes seconds to be acknowledged, a boost minutes to show up as `heating`), so integrations should publish `has_feedback: true` on every command feature — `binary`, `mode`, `target-temperature`, `boost` — and let the appliance's own state report land through `saveState`. With `has_feedback: false` the dashboard would show a mode the appliance never accepted.

`boost` deserves an explicit rule: Gladys **never** resets it. A boost ends when the appliance says so, by reporting `0` back. Nothing in the core expires a feature value, and adding a timer here would fight with appliances that run boosts of different lengths.

### B.3 Dashboard UI

Routing happens in `front/src/components/boxs/device-in-room/DeviceRow.jsx`, in this order: `read_only` → `SensorDeviceFeature`, then `ROW_TYPE_BY_CATEGORY_AND_TYPE`, then `ROW_TYPE_BY_FEATURE_TYPE`, then `SensorDeviceFeature` as fallback.

**Command features must be registered in `ROW_TYPE_BY_CATEGORY_AND_TYPE`, not in `ROW_TYPE_BY_FEATURE_TYPE`.** Three of them — `binary`, `mode`, `target-temperature` — are type strings already used by other categories, and the type-keyed map is a flat object where the last declaration silently wins for *every* category. Registering `water-heater`'s `mode` there would hijack `fan`'s; its `target-temperature` would hijack `thermostat`'s. The category-aware map exists precisely for this, and its in-file comment says so.

| Feature | Component |
|---|---|
| `binary`, `boost` | `BinaryDeviceFeature` (existing) |
| `mode` | **new** `WaterHeaterModeDeviceFeature.jsx` |
| `target-temperature` | `SetpointDeviceFeature` (existing) |

`WaterHeaterModeDeviceFeature.jsx` is a copy of `AirConditioningModeDeviceFeature.jsx`: a static `MODE_OPTIONS` catalog mapping each `WATER_HEATER_MODE` value to an i18n key, passed through `resolveFeatureOptions` (A.3) and rendered by the shared `AdaptiveOptionControl` — a button group that collapses into a `<select>` when it does not fit the card, which matters here because the enum has seven values.

`SetpointDeviceFeature` needs two entries in its existing per-category tables: `SETPOINT_STEP_BY_CATEGORY[WATER_HEATER] = 1` (the default 0.5 °C step is a room-thermostat granularity; no tank is set to 54.5 °C) and `DEFAULT_VALUE_BY_CATEGORY[WATER_HEATER] = 55` (a common storage setpoint, used when the feature has no value yet).

Read-only features route through `SensorDeviceFeature.jsx`. Register them in `DISPLAY_BY_FEATURE_TYPE` — **not** in `DISPLAY_BY_FEATURE_CATEGORY`, which is checked first and would force one renderer on the whole category: `remaining-hot-water` → `BadgeNumberDeviceValue` (the existing default), `heating` → `BinaryDeviceValue`.

Two more registrations, both of which produce a visible defect when forgotten:

- `SUPPORTED_FEATURE_TYPES` in `front/src/components/boxs/device-in-room/SupportedFeatureTypes.jsx` — the box editor filters on `feature.read_only || SUPPORTED_FEATURE_TYPES.includes(feature.type)`, so a command feature missing from it cannot be added to a dashboard box at all;
- `DeviceFeatureCategoriesIcon[WATER_HEATER]` in `front/src/utils/consts.js` — one entry per type, or the row renders `fe-undefined`, a blank box. All the icons this category needs already exist in `server/config/icons.json`: `heater`, `bath`, `shower-head`, `droplets`, `flame`, `thermometer`, `zap`, `activity`.

### B.4 Scenes

Triggers — `front/src/routes/scene/edit-scene/triggers/DeviceFeatureState.jsx` is a cascade of per-widget booleans. Add a `waterHeaterModeDevice` flag (category `water-heater` + type `mode`) rendering a new `device-states/WaterHeaterModeDeviceState.jsx` (model: `PilotWireModeDeviceState.jsx`), and extend the existing `binaryDevice` condition with `water-heater`'s `binary`, `boost` and `heating`.

**Every new flag must also be negated in `defaultDevice` and `thresholdDevice`.** Those two are computed as "none of the specific flags matched"; a flag added to the cascade but not to the negations renders two widgets stacked on the same trigger. This is the single most-missed step of the whole procedure.

Actions — no dedicated `ACTIONS.WATER_HEATER.*`. The generic `ACTIONS.DEVICE.SET_VALUE` already reaches every feature of every category; a bespoke action would only duplicate it and would need its own server handler and tests. What is needed is the value editor: a `SelectWaterHeaterMode.jsx` in `front/src/components/device/` (model: `SelectPilotWireMode.jsx`, `react-select` based, labels from `deviceFeatureAction.*`) wired into `DeviceSetValue.jsx`, plus adding `water-heater`'s `binary` and `boost` to the branch that pre-fills a binary action with `value: 0` on feature selection.

### B.5 i18n

Three namespaces, three files (`en.json`, `fr.json`, `de.json`), all key-parallel — `comparejson -e` enforces parity between languages and `front/cli/check_translations.js` enforces coverage against the constants.

| Key | Required by | Content |
|---|---|---|
| `deviceFeatureCategory.water-heater.shortCategoryName` | `check_translations.js` (hard CI failure) | "Water heater" / "Chauffe-eau" / "Warmwasserbereiter" |
| `deviceFeatureCategory.water-heater.<type>` | `check_translations.js`, one per type | Feature label shown in device lists, charts and the box editor |
| `deviceFeatureAction.category.water-heater.mode.<i18nKey>` | `WaterHeaterModeDeviceFeature`, `SelectWaterHeaterMode` | Mode button labels: `off`, `auto`, `eco`, `boost`, `manual`, `away`, `program` |
| `deviceFeatureValue.category.water-heater.mode.<0..6>` | history, sensor rendering | Same labels, addressed by integer |
| `deviceFeatureAction.category.water-heater.binary.{state,stateLiveFinished}.{0,1}` | `BinaryDeviceFeature` | Turning these on switches the toggle to a labelled two-button group ("Stop" / "Start" instead of an unlabelled switch) — worth doing for an appliance whose on/off is not self-evident |
| `deviceFeatureAction.category.water-heater.boost.{state,stateLiveFinished}.{0,1}` | `BinaryDeviceFeature` | "Cancel boost" / "Start boost" |
| `deviceFeatureValue.category.water-heater.{boost,heating}.{0,1}` | `BinaryDeviceValue`, `BinaryDeviceState` | Read-only labels: "Boost off" / "Boost on", "Idle" / "Heating". Without them the dashboard badge and the scene trigger fall back to the generic "Inactive" / "Active" |

`BinaryDeviceFeature` renders two buttons: the disabled one carries `stateLiveFinished.<current value>` (the state the device is in), the enabled one carries `state.<target value>` (the action the click applies). So `state.0` must always read as "set to 0" and `state.1` as "set to 1" — never as a description of value `0`/`1` itself.

**Do not add a `deviceFeatureValue.category.water-heater.binary` key.** `BinaryDeviceValue` and `BinaryDeviceState` both build their label from a hardcoded `deviceFeatureValue.category.<category>.binary` lookup with `plural={value}`, *whatever the feature's type is*, and fall back to their children only when that lookup misses. Defining the key makes it resolve — to an object with no `zero`/`one`/`other` form — and it does so for **every** binary-rendered feature of the category, `heating` and `boost` included, not just the `binary` type. `water-valve` works precisely because it never defines that key. The cost is that the `binary` type falls back to the generic "Inactive" / "Active", exactly like `light` and `switch`: the type is literally named `binary`, so its per-type key and the category-wide plural key are the same path and cannot both exist. The writable toggle is unaffected — it reads `deviceFeatureAction`, which has no such hardcoded suffix.

The MQTT feature catalog also reads `integration.mqtt.featureCatalog.categoryDescriptions.water-heater` and `.descriptions.water-heater.<type>`; without them the catalog falls back to a generic description, which is acceptable but poor.

### B.6 Secondary registration points

Two files outside the dashboard path that degrade silently when skipped:

- `front/src/routes/history/categoryGroups.js` — add `WATER_HEATER` to the `climate` group (which already holds `HEATER`, `THERMOSTAT`, `AIR_CONDITIONING`, `FAN`). Unlisted categories fall into the computed "other" bucket, where the activity history shows them with a generic icon and colour.
- `front/src/routes/integration/all/mqtt/device-page/utils.js` — the MQTT catalog builds its category/type picker from the i18n dictionary, so the category appears by itself as soon as B.5 lands; but `getFeatureDefaultValues` decides the pre-filled `min`/`max`/`read_only`/`unit`. Without an entry, every water-heater feature defaults to `0..100, read_only: false` — wrong for **every type** of the category, since none is a 0..100 writable number. 
  **Add per-type branches in `getFeatureDefaultValues`, and do not touch `isSensorCategory`.** That helper takes a *category*, not a type, and its result is the category-wide baseline (`read_only: isSensorCategory(category)`); listing `water-heater` there would default the four **command** features to `read_only: true`. Since `water-heater` neither ends in `-sensor` nor appears in that list, the baseline is already `read_only: false` — right for the commands — and only the two sensor types need an explicit override. Follow what the other **mixed actuator/sensor categories** already do — `air-conditioning`, `thermostat`, `vacuum-cleaner` — whose types are handled by explicit per-type branches (`LIGHT.BINARY`, `SWITCH.BINARY`, `THERMOSTAT.TARGET_TEMPERATURE`…), never by a category-wide flag:

  | Type | Defaults |
  |---|---|
  | `binary`, `boost` | `min: 0, max: 1, read_only: false` |
  | `mode` | `min: 0, max: 6, read_only: false` |
  | `target-temperature` | `min: 30, max: 70, read_only: false, unit: celsius` |
  | `remaining-hot-water` | `min: 0, max: 100, read_only: true, unit: percent` |
  | `heating` | `min: 0, max: 1, read_only: true` |

  Then add a `getFeaturePreviewValue(category, type)` entry, and register the unitless features in `CATEGORIES_WITHOUT_UNIT` — that set is keyed by **(category, type) pairs** through `categoryTypeKey`, so it needs one entry per pair: `water-heater`×`binary`, ×`mode`, ×`heating`, ×`boost`. The generic short-circuit that drops the unit for `SENSOR.BINARY` / `SWITCH.BINARY` / `BUTTON.PUSH` does not apply here, because these type strings are the category's own.

This path matters more than it looks: it is how a user brings in an appliance no native integration supports yet, hand-building the device from the MQTT catalog and picking category and type per feature.

### B.7 External integrations

**No protocol change.** `server/lib/external-integration/externalIntegration.setDiscoveredDevices.js` validates `category`, `type` and `unit` against `DEVICE_FEATURE_CATEGORIES_LIST` / `TYPES_LIST` / `UNITS_LIST` and passes the rest of the feature object through untouched (`return { ...feature }`). The day `water-heater` is in the constants, an external integration can publish the A.5 payload to `POST /api/integration/v1/discovered_device` with nothing else to change — including `supported_options`, which travels to the Discovery screen and then to `device.create` through the standard `POST /api/v1/device`.

Command semantics over `external-integration.device.set-value` (the core → integration WebSocket message carrying `{ device_feature: { external_id, category, type }, value }`):

| Feature | `value` | Integration contract |
|---|---|---|
| `binary` | `0` \| `1` | Stop / start the appliance |
| `mode` | a `WATER_HEATER_MODE` integer | Translate to whatever the appliance exposes (a mode index, a set of switches — A.3). Reject silently and report the real mode back if the appliance refuses; never echo an unapplied value |
| `target-temperature` | number, in the feature's unit | Clamp to the appliance's range and report the clamped value back |
| `boost` | `0` \| `1` | Start / cancel a boost; report `0` when the appliance ends it (B.2) |

Since these features are published with `has_feedback: true`, the integration must publish the resulting state through `POST /api/integration/v1/state` — nothing is persisted by the core on the write path.

`docs/specs/external-integrations.md` documented `discovered_device` without ever mentioning `supported_options`, even though it already flowed end-to-end; its `discovered_device` section now describes the field, closed in this diff.

### B.8 Compatibility

No migration, no existing device touched, no behavior change for any other category. Users who modelled a water heater with `switch` / `temperature-sensor` features keep a working device; nothing forces them to move.

There is no in-place category change: `docs/specs/device-migration.md` moves history, scenes and dashboards **between devices**, it does not rewrite a feature's category. Migrating a hand-rolled water heater therefore means creating the device again in its integration — which is exactly what the migration feature is for.

## C. Non-goals for v1

Named explicitly, so their absence reads as a decision rather than an oversight. Adding a type to an existing category later is non-breaking, so these are deferrals, not exclusions:

- **`heat-source`** — which source is currently producing heat. Matter models this as a **bitmap** of heater types (resistive elements, heat pump, boiler…), and a Gladys feature holds a single scalar; a four-value enum would be a lossy, under-specified divergence from the standard. Deferred until the bitmap-to-scalar question is settled against the real Matter model.
- **`cop`** — coefficient of performance. It is a heat-pump efficiency ratio, not a metric intrinsic to producing hot water, and no standard models it. It would be the kind of vendor-telemetry type the taxonomy spec's rule 5 warns about.
- **Durations, as a whole** — how long the away mode lasts (`absence-duration`) and how long a boost runs. v1 has no duration type: `boost` is a bare on/off even though Matter's boost command carries a duration (D.1, divergence 2), and absence has no end date. Deferred together because they are one question, not two — whether such durations belong in this category at all or reuse the existing `duration` category. Neither reference profile needs them.
- **Sanitary safety** — anti-legionella cycles and anti-scald protection. They deserve their own types and, more importantly, their own thinking about what Gladys should be allowed to command on a health-relevant function.
- **A dedicated dashboard box.** The `devices-in-room` box renders the whole category correctly; a bespoke box (hot-water gauge, off-peak schedule) is a UI project of its own.
- **Native scheduling.** Off-peak-hours control is expressible today with scenes plus `CONDITION.CHECK_TIME`, and appliance-side programs are covered by `MODE = PROGRAM`.
- **Concrete integration mappings** — Zigbee2MQTT `exposes` entries, MQTT catalog device templates, and the Matter `WaterHeaterManagement` / `WaterHeaterMode` clusters. The last one is the natural follow-up: it is the reason this category exists, and landing it means updating the coverage table in `server/services/matter/README.md`.
- **Voice assistants and MCP** — `services/alexa`, `services/homekit`, `services/google-actions` and `services/mcp/lib/selectFeature.js` all keep category allow-lists limited to lights, switches and shutters. Extending them is orthogonal to this spec.

## D. Compliance with the taxonomy design rules

Audited against the checklist of `docs/specs/device-feature-categories.md`.

### D.1 Standards alignment (rule 3)

Matter is the primary reference and it **does** model this capability: `server/services/matter/README.md` lists `WaterHeaterManagement` ("control the operation of a hot water heating appliance so that it can be used with energy management") and `WaterHeaterMode` ("derived from the Mode Base cluster… for water heater devices"), both currently unhandled. The category is shaped on that model:

Each type below states **what kind of mapping it is** — a direct correspondence, a derivation that loses information, or a declared divergence. An unqualified "aligned with Matter" claim is not reviewable, and this table is meant to be checked line by line when the Matter mapping is written.

| Water-heater type | Matter counterpart | Nature of the mapping |
|---|---|---|
| `mode` | `WaterHeaterMode` (a Mode Base derivative — an enumerated mode with per-device supported modes, exactly the `supported_options` shape) | **Direct**, tag by tag (table below) |
| `binary` | `OnOff` | **Direct** |
| `remaining-hot-water` | `WaterHeaterManagement`'s tank-percentage attribute | **Direct** when the appliance reports a percentage; the `liter` unit has no Matter counterpart and is there for appliances that report a V40 volume instead |
| `heating` | `WaterHeaterManagement`'s heat-demand attribute | **Derived, lossy** — divergence 3 below |
| `boost` | `WaterHeaterManagement`'s boost command and boost state | **Partial.** The state maps directly; the command does not — Matter's boost carries a **duration**, Gladys's `boost` is a bare `0`/`1` (divergence below) |
| `target-temperature` | `Thermostat` / `TemperatureControl` setpoint | **Declared divergence** on the Gladys side (below); the underlying value maps directly |

Proposed mode-tag correspondence, to be confirmed against the Matter specification at implementation time:

| `WATER_HEATER_MODE` | Matter mode tag |
|---|---|
| `OFF` | `Off` |
| `AUTO` | `Auto` (Mode Base) |
| `ECO` | `LowEnergy` (Mode Base) |
| `BOOST` | `Quick` (Mode Base) — the *mode*, not to be confused with the `Boost` command, which is carried by the `boost` type |
| `MANUAL` | `Manual` |
| `AWAY` | `Vacation` (Mode Base) |
| `PROGRAM` | `Timed` |

Attribute-level naming and exact value ranges must be re-checked against the Matter specification when the mapping is implemented; this section commits to the cluster- and tag-level model, not to attribute spellings.

**Declared divergence 1 — the setpoint's category.** Matter carries the water heater's setpoint on the `Thermostat` (or `TemperatureControl`) cluster, and `server/services/matter/README.md` suggests mapping `TemperatureControl` onto `thermostat/target-temperature`. This spec gives the category **its own** `target-temperature` instead. Rationale: `thermostat` in Gladys means the ambient setpoint of a room, and labelling a tank setpoint "Thermostat Temperature" misinforms the user; the codebase already applies exactly this pattern, with `thermostat`, `air-conditioning` and `electrical-vehicle-climate` each carrying their own `target-temperature` type for the same underlying quantity in different capabilities. A heat pump that heats both the house and the tank must be able to expose both setpoints on one device without collision.

**Declared divergence 2 — boost has no duration.** Matter's boost command takes a duration; `boost` is a bare on/off. A Gladys feature holds one atomic value, so a duration would need a second feature, and v1 has no duration type at all (see `absence-duration` in section C — the same gap). Consequence for a Matter mapping: boosting is issued with the appliance's or the integration's default duration, and cancelling goes through the cancel path rather than by writing `0` to a timer. Adding a duration type later is non-breaking.

**Declared divergence 3 — `heating` is derived, not reported.** Matter has no boolean "is heating" attribute: `HeatDemand` on `WaterHeaterManagement` is a **heat-source bitmap** telling which sources are currently demanding heat. `heating` is therefore an integration-derived "is producing heat" signal, not a 1:1 attribute map — `0` when the bitmap is empty, `1` as soon as any bit is set. The information dropped is *which* source is demanding heat, which is exactly the `heat-source` type deferred in section C and built from the same bitmap; deriving `heating` now does not prejudge that design. Appliances that natively report a plain heating boolean (most non-Matter integrations) map it directly, with no derivation involved.

Zigbee (ZCL, via Zigbee2MQTT) has no water-heater-specific cluster; the second reference adds nothing here.

#### Two decisions, settled by the author — still open to a maintainer's call

Both were raised as open questions before implementation and are now settled **by the PR author**, not by a Gladys maintainer. They are recorded here rather than deleted, because both remain cheap to reverse and a maintainer may still overrule either one:

1. **Own `target-temperature`, kept** — not a reuse of `thermostat/target-temperature`. Rationale under divergence 1 above. Reversing it is a one-line change in `constants.js` plus the frontend registrations that name the type.
2. **Gladys enum vocabulary, kept** — `ECO` / `AWAY` / `PROGRAM` rather than Matter's `LowEnergy` / `Vacation` / `Timed`. They match the existing `PILOT_WIRE_MODE` and `AC_MODE` enums, and rule 7's naming conventions govern category and type *values* (kebab-case strings in the taxonomy), not internal enum keys. The tag-by-tag correspondence is documented above either way, so switching is a rename of seven constants and their i18n keys.

### D.2 Known limitation — appliances reachable only as booleans

A.3 folds switch-based appliances into `mode`, which requires the integration to translate between switch states and mode values. That is the right place for it, but it leaves one real gap: when an appliance reaches Gladys through a **generic boolean transport** — an unmapped Matter `OnOff` endpoint, or a device hand-built from the MQTT catalog — there is no integration code to do the translation, and a `0`/`1` payload cannot drive an enum-typed `mode`.

This is recorded as a **tooling gap, not a taxonomy one**: the fix belongs in the MQTT device page (a per-value mapping for enum features) or in the integration that owns the device, not in a per-mode binary type. Adding `absence` / `eco-mode` binaries would duplicate values the mode enum already carries and would be a narrowed, appliance-shaped type — precisely what rule 6 forbids.

### D.3 Checklist

- [x] **No brand, product or vendor name** in the category, the types or their semantics. Both reference profiles are described by capability ("heat-pump water heater", "electric storage tank"), never by product.
- [x] **Could not be mapped onto an existing category.** `heater` is room heating via pilot wire, `thermostat` is an ambient setpoint, `switch` loses all meaning. No existing category expresses stored hot water.
- [x] **The same quantity is not split across categories.** Water temperature stays `temperature-sensor`, consumption stays `energy-sensor` (A.4) — the main correction this audit produced.
- [x] **Types are intrinsic to the capability**; everything else the appliance reports goes to its own category on the same device (A.4). Six types, deliberately narrow; deferrals listed in C.
- [x] **Matter checked** (D.1), every mapping qualified as direct, lossy-derived or divergent, and the three declared divergences argued.
- [x] **Generic, not modelled on one API.** The two reference profiles are different appliance families with different native interfaces mapping onto the same types.
- [x] **Enum-like types expose the full generic set** (A.2, seven modes); per-device subsets go through `supported_options` (A.3), including for appliances whose native interface is switches.
- [x] **Naming**: kebab-case, English, no protocol name. No `*-sensor` suffix on the category — it is a controllable appliance, not a measurement category; its two read-only types are the sensor side of that appliance.
- [x] **Names stress-tested** against neighbouring and future classes: gas and solar-assisted water heaters (same six types, fewer of them), heat pumps heating both house and tank (D.1), instantaneous water heaters (`target-temperature` + `heating`, no `remaining-hot-water`).
- [x] **Inline scope comment** on the constant, with the boundary and the value conventions (B.1).
- [x] **Translations** in all locale files including `deviceFeatureValue` for the mode enum (B.5).
- [x] **Units** declared in both `DEVICE_FEATURE_UNITS_BY_CATEGORY` and `DEVICE_FEATURE_UNITS_BY_CATEGORY_AND_TYPE` (B.1).
- [x] **MQTT defaults and history grouping** specified (B.6).
- [x] **Tests and spec updates in the same diff** — the addition is constants plus frontend wiring, so no server runtime behavior to test; the external-integrations spec gap is closed in the same PR (B.7).

## Verification

The implementation carries no new server logic, so the risk sits entirely in the registration points. Verify in this order:

1. `cd front && npm run compare-translations` — the gate that catches a missing category or type translation, and the mismatch between the `DEVICE_FEATURE_CATEGORIES` and `DEVICE_FEATURE_TYPES` keys (A.1).
2. `cd front && npm run prettier-check && npm run eslint && npm run build`, `cd server && npm run prettier-check && npm run eslint && npm run coverage`. Patch coverage must stay at 100 % (CI contract); constants are covered by the existing suites that import them, but any new server helper needs its own test in `server/test/` mirroring the source path.
3. Manual pass on **both** reference profiles, hand-built from the MQTT feature catalog. Device A (A.5): each row shows its own icon (no blank box), the mode control lists only the four declared `supported_options`, the setpoint steps by 1 °C, and the two non-water-heater features render as an ordinary temperature sensor and energy sensor on the same device. Device B (A.6): the mode row shows exactly three named buttons.
4. Scene pass: build a trigger on `mode` and an action setting `mode`, `target-temperature` and `boost`; confirm the trigger shows exactly one widget (the `defaultDevice` / `thresholdDevice` negation of B.4) and that the action stores an integer.
5. External-integration pass: publish the A.5 payload from a test integration, create the device from the Discovery screen, and confirm `supported_options` survived to the dashboard.
6. `cd front && npm run cypress:run` — dashboard and integration specs must stay green.
