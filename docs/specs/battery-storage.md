# Battery storage controls (power limits, state-of-charge limits, mode)

> **Living specification — source of truth.** This document specifies the **command** side of the `battery-storage` device feature category: its six command types, the `BATTERY_STORAGE_MODE` enum, how a battery declares the modes it supports, the frontend registration points and the external-integration contract. **Rule: any PR that changes a battery-storage behavior or contract modifies this file in the same diff** — spec first, code second.
>
> This extension is designed under `docs/specs/device-feature-categories.md`, the taxonomy's design rules and review checklist. Section D audits it against that checklist.

## Context

`battery-storage` shipped (#2682) as a **measurement** category: six read-only types — state of charge, charge/discharge power, their two energy indexes, remaining energy. That review is the origin of rule 5 of the taxonomy spec: the category was narrowed from 17 vendor-shaped types to the metrics intrinsic to storage, everything else going to `grid-sensor`, `home-output-sensor`, `energy-production-sensor` and `energy-sensor`.

What it cannot do is **control** a battery. Stationary storage systems — plug-in batteries, hybrid inverters with a battery, home battery packs — are driven by a handful of settings that every brand exposes under its own name: how much power may go into the battery, how much may come out, at which state of charge charging stops, how much charge is held back as a reserve, and an operating mode (let the device optimise self-consumption, force a charge, force a discharge, stay idle). Without Gladys types for them:

- the dashboard cannot show these controls, so the user goes back to the vendor app for the most useful action a battery offers ("charge from the grid during off-peak hours", "keep 30 % for the evening");
- scenes cannot drive them, although that is precisely where a home automation box adds value over the vendor app (tariff-driven charging, Tempo red days, solar forecast);
- integrations have no stable mapping target. The first consumer is the external integration for Zendure SolarFlow batteries ([forum topic](https://community.gladysassistant.com/t/integration-externe-zendure/11309)); Anker Solix, EcoFlow and Modbus hybrid inverters expose the same settings.

Scoping decisions:

- **New types on the existing category, not a new category.** The controls bound the very quantities `battery-storage` already measures (charge power, discharge power, state of charge). Taxonomy rule 5 says a new category is not created when only new types are needed; rule 2 says one quantity must not be split across categories.
- **Six command types, all intrinsic to storing energy.** Everything a real product also lets the user set — grid export limits, per-pack settings — is either another capability or a device-specific setting (section C). The limit on the power the device delivers through its AC output (solar and battery together) is not a battery setting either: it is the `home-output` / `power-limit` command (`docs/specs/home-output.md`), the control counterpart of `home-output-sensor`.
- **v1 is core + UI + the external-integration contract.** Concrete Matter/Zigbee2MQTT/MQTT mappings are non-goals (section C).

## A. Device model

### A.1 Feature types

The category and its key do not change: `DEVICE_FEATURE_CATEGORIES.BATTERY_STORAGE = 'battery-storage'` with the matching `DEVICE_FEATURE_TYPES.BATTERY_STORAGE` block (both keys spelled `BATTERY_STORAGE`, so `front/cli/check_translations.js` checks every new type).

The six existing types are unchanged and listed for completeness. The six new ones are commands:

| Type | Value | Direction | Units | min / max | Semantics |
|---|---|---|---|---|---|
| `BATTERY_LEVEL` | `battery-level` | sensor | `percent` | 0 / 100 | State of charge (existing). |
| `CHARGE_POWER` | `charge-power` | sensor | `watt`, `kilowatt` | 0 / — | Power INTO the battery (existing). |
| `DISCHARGE_POWER` | `discharge-power` | sensor | `watt`, `kilowatt` | 0 / — | Power OUT of the battery (existing). |
| `CHARGE_INDEX` | `charge-index` | sensor | `kilowatt-hour` | 0 / — | Cumulative charged energy (existing). |
| `DISCHARGE_INDEX` | `discharge-index` | sensor | `kilowatt-hour` | 0 / — | Cumulative discharged energy (existing). |
| `BATTERY_ENERGY_REMAINING` | `battery-energy-remaining` | sensor | `kilowatt-hour` | 0 / — | Stored energy available now (existing). |
| `CHARGE_POWER_LIMIT` | `charge-power-limit` | command | `watt`, `kilowatt` | 0 / device rating | **Maximum power INTO the battery, whatever its source** (solar, grid, AC or DC). The device charges at up to this power. |
| `DISCHARGE_POWER_LIMIT` | `discharge-power-limit` | command | `watt`, `kilowatt` | 0 / device rating | **Maximum power OUT of the battery.** The device discharges at up to this power. |
| `TARGET_CHARGE_LIMIT` | `target-charge-limit` | command | `percent` | 0 / 100 | State of charge at which **charging stops** (the charge ceiling). Same string and same meaning as `electrical-vehicle-charge` / `target-charge-limit`. |
| `TARGET_DISCHARGE_LIMIT` | `target-discharge-limit` | command | `percent` | 0 / 100 | State of charge at which **discharging stops** — the reserve the battery keeps (reserve / minimum SoC; distinct from the `BACKUP` mode). |
| `MODE` | `mode` | command | — | 0 / 5 | Operating mode, `BATTERY_STORAGE_MODE` (A.2). Which modes a given battery offers is declared per feature via `supported_options` (A.3). |
| `GRID_CHARGE_POWER_LIMIT` | `grid-charge-power-limit` | command | `watt`, `kilowatt` | 0 / device rating | **Maximum power INTO the battery FROM THE GRID** (AC charging). A sub-bound of `charge-power-limit`: charging from the solar inputs is not bounded by it. |

`read_only` follows the Direction column (`sensor` → `true`, `command` → `false`); it is the field the frontend routes on (B.3).

Value conventions, stated once for the whole category (they are also in the inline comment, B.1):

- **No sign.** Powers and power limits are non-negative; the direction is carried by the type (`charge-*` = into the battery, `discharge-*` = out of it). An integration whose device reports or accepts a signed power splits it.
- **`0` means zero.** A power limit of `0` forbids that direction; it never means "unlimited". A device whose API uses `0` or `-1` for "no limit" publishes its rated maximum instead, and `max` carries that rating. A `grid-charge-power-limit` of `0` forbids grid charging only: solar charging is unaffected.
- **Grid charging is bounded twice.** `charge-power-limit` covers charging from any source, `grid-charge-power-limit` only the share drawn from the grid. When a device publishes both, the effective grid charging is bounded by both (the lower one wins); neither rewrites the other. A device with a single "max charge power" publishes `charge-power-limit` only, a device whose only charge setting is the grid-charge one publishes `grid-charge-power-limit` only.
- **A limit is persistent.** It is a setting the device keeps until it is written again, not a request that expires (see D.1, divergence 1).
- **The device stays the authority.** Gladys does not check that `target-discharge-limit` ≤ `target-charge-limit`, nor that a power limit is under the rating: the device clamps or rejects, and the integration reports the value actually applied (B.2).

Every unit named above already exists in `DEVICE_FEATURE_UNITS`; no `deviceFeatureUnit` key is created.

Nothing here is mandatory. A battery publishes the subset it actually exposes; there is no "a battery must have X" rule.

### A.2 The mode enumeration

Integers, like `WATER_HEATER_MODE` and `AC_MODE`: `ACTIONS.DEVICE.SET_VALUE` (`server/lib/scene/scene.actions.js`) aborts a scene with `ACTION_VALUE_NOT_A_NUMBER` on anything non-numeric, so a string-valued mode would be unusable from a scene.

```js
const BATTERY_STORAGE_MODE = {
  AUTO: 0,      // self-consumption: the device decides when to charge and discharge
  CHARGE: 1,    // forced charge, drawing from the grid allowed
  DISCHARGE: 2, // forced discharge to the installation
  STANDBY: 3,   // idle: neither charges nor discharges
  TIME_OF_USE: 4, // follows the time-of-use programme stored in the device (charge and discharge windows)
  BACKUP: 5,    // keeps the stored energy for a grid outage: the battery only discharges when the grid fails
};
```

This is the **full generic set**, deliberately wider than any single battery: a battery with no standby, or one that cannot be forced to discharge, declares its subset through `supported_options` (A.3), never by narrowing the enum (taxonomy rule 6).

- `AUTO` is the device's own optimisation — "self-consumption", "self-use", "smart mode" in vendor vocabulary: it charges on surplus and discharges to cover the home, within the limits of A.1.
- `CHARGE` / `DISCHARGE` force a direction; the power is still bounded by `charge-power-limit` / `discharge-power-limit`, and the forced charge still stops at `target-charge-limit`, the forced discharge at `target-discharge-limit`.
- `STANDBY` holds the charge: no charging, no discharging.
- `TIME_OF_USE` hands control to the programme stored in the device ("time of use", "economy", "TOU" in vendor vocabulary: charge and discharge windows, often tied to off-peak hours). The programme itself (its windows) is configured on the device and is out of scope (C); Gladys only selects the mode.
- `BACKUP` keeps the energy for a grid outage ("backup", "UPS", "emergency power"): the battery charges up to `target-charge-limit` and only discharges when the grid fails. It differs from `STANDBY` (which never discharges, outage or not) and from `target-discharge-limit` (the reserve kept below normal operation, a level rather than a mode).

**Mode and limits are independent features.** Writing a mode does not rewrite a limit and vice versa. Some devices have no mode at all and are driven by their limits only (a `discharge-power-limit` of `0` keeps the charge); they simply do not publish `mode`. **An integration maps whichever form its device natively offers, never both for the same function**: a device whose only "standby" is "output limit = 0" does not publish a `STANDBY` mode emulated on top of the limit it already publishes — two controls over one setting drift apart as soon as one is written.

Values are **append-only once this spec is merged**. A new mode takes the next free integer; an existing integer never changes meaning, because it is stored in device states and hard-coded in users' scenes.

### A.3 Supported options — how a battery declares the modes it has

Exactly the water-heater mechanism (`docs/specs/water-heater.md` A.3), with no new code on the server:

- integrations publish `supported_options: [{ value, label, sort_order }]` on the `mode` feature; `server/utils/normalizeSupportedOptions.js` validates it (integer values, non-empty labels, no duplicates) and `server/lib/device/device.syncFeatureSupportedOptions.js` persists it;
- the frontend resolves the list with `resolveFeatureOptions` (`front/src/utils/supportedOptions.js`): the declared options drive which entries appear and in what order, the static catalog supplies the translated label.

A feature published **without** `supported_options` falls back to the full `BATTERY_STORAGE_MODE` catalog — **not** bounded by `max`: the modes are a set, not a ladder (`STANDBY` is not "more" than `CHARGE`), so `max` says nothing about which modes a battery has. Offering every mode is the safe failure: the device rejects what it cannot do and the integration reports the real mode back. Declaring `supported_options` is the recommended path.

### A.4 What belongs to other categories

Unchanged from the measurement side, and it applies to the controls too:

| Value the device reports or accepts | Category to use | Why not a battery-storage type |
|---|---|---|
| PV production (power, index) | `energy-production-sensor` | Production is a quantity of its own (taxonomy rule 2). |
| Grid import / export (power, indexes) | `grid-sensor` | Same measurement whatever measures it. |
| Power delivered to the home (inverter AC output, off-grid output) | `home-output-sensor` | The output also carries solar power that never went through the battery. |
| A limit on that home output (AC output limit, active power limit) | `home-output` / `power-limit` (`docs/specs/home-output.md`) | It bounds solar power too, not only the battery's: a battery type would fail rules 2 and 5. |
| Grid export limit / zero-export setting | — (no type in v1) | An installation-level grid constraint, not storage (section C). |

### A.5 Reference device A — a plug-in storage system (AC-port settings)

Plug-in storage systems (Zendure SolarFlow, Anker Solix, EcoFlow PowerStream…) combine solar inputs, a battery and an AC port in one box. Their settings are shaped around **the AC port**, not around the battery: they typically expose an **AC output limit** (power delivered to the home, solar and battery together) and, on AC-coupled models, an **AC grid-charge limit**. Neither is a battery charge/discharge limit, and mapping them onto `discharge-power-limit` / `charge-power-limit` would be lossy (with sun, the output limit lets the battery discharge less, or charge; the grid-charge limit leaves solar charging unbounded). Each has its own exact type instead: the AC output limit is `home-output` / `power-limit` (`docs/specs/home-output.md`), the grid-charge limit is `grid-charge-power-limit`.

Mapping used by the Zendure integration (the first consumer):

| Device setting | Gladys feature | Nature of the mapping |
|---|---|---|
| `outputLimit` (W delivered to the home) | `home-output` / `power-limit` | **Direct** — it bounds the AC output, solar and battery together, which is exactly that type's meaning. |
| `inputLimit` (W drawn from the grid on the AC port) | `grid-charge-power-limit` | **Direct** — it bounds the charge drawn from the grid only, which is exactly that type's meaning. |
| `socSet` (charge ceiling) | `target-charge-limit` | **Direct** — same meaning; the integration converts the device's scale to percent if it is not one. |
| `minSoc` (discharge floor) | `target-discharge-limit` | **Direct** — same meaning, same conversion rule. |
| `acMode` 1 (AC input) / 2 (AC output) | `mode` = `CHARGE` / `DISCHARGE`, `supported_options` limited to those two | **Lossy.** `acMode` selects the direction of the AC port; the power actually flowing is still bounded by the two limits above and by the solar input, so it is not a "charge/discharge at full power" order. `AUTO` and `STANDBY` have no `acMode` value and are not declared. |

The AC-port limits are never **also** published as `charge-power-limit` / `discharge-power-limit`: an integration publishes those only for a battery-side setting with that exact meaning, never as an emulation on top of the AC-port limits it already publishes (two controls over one setting drift apart as soon as one is written). No power setting is mapped lossily any more; the only lossy row left is the mode.

```json
{
  "name": "Plug-in battery",
  "external_id": "ext:my-integration:plug-in-battery",
  "features": [
    { "name": "Battery level", "external_id": "ext:my-integration:plug-in-battery:soc",
      "category": "battery-storage", "type": "battery-level", "unit": "percent",
      "read_only": true, "has_feedback": false, "keep_history": true, "min": 0, "max": 100 },
    { "name": "Output limit", "external_id": "ext:my-integration:plug-in-battery:output-limit",
      "category": "home-output", "type": "power-limit", "unit": "watt",
      "read_only": false, "has_feedback": true, "keep_history": true, "min": 0, "max": 800 },
    { "name": "Grid charge limit", "external_id": "ext:my-integration:plug-in-battery:input-limit",
      "category": "battery-storage", "type": "grid-charge-power-limit", "unit": "watt",
      "read_only": false, "has_feedback": true, "keep_history": true, "min": 0, "max": 1200 },
    { "name": "Charge ceiling", "external_id": "ext:my-integration:plug-in-battery:soc-set",
      "category": "battery-storage", "type": "target-charge-limit", "unit": "percent",
      "read_only": false, "has_feedback": true, "keep_history": true, "min": 70, "max": 100 },
    { "name": "Discharge floor", "external_id": "ext:my-integration:plug-in-battery:min-soc",
      "category": "battery-storage", "type": "target-discharge-limit", "unit": "percent",
      "read_only": false, "has_feedback": true, "keep_history": true, "min": 0, "max": 50 },
    { "name": "AC mode", "external_id": "ext:my-integration:plug-in-battery:ac-mode",
      "category": "battery-storage", "type": "mode",
      "read_only": false, "has_feedback": true, "keep_history": true, "min": 0, "max": 3,
      "supported_options": [
        { "value": 1, "label": "Input", "sort_order": 0 },
        { "value": 2, "label": "Output", "sort_order": 1 }
      ] },
    { "name": "Home output", "external_id": "ext:my-integration:plug-in-battery:home-output",
      "category": "home-output-sensor", "type": "power", "unit": "watt",
      "read_only": true, "has_feedback": false, "keep_history": true, "min": 0, "max": 2400 }
  ]
}
```

The bounds (`min`/`max`) are illustrative: an integration publishes the real range of each device.

### A.6 Reference device B — a hybrid inverter with a battery (direct mappings)

Hybrid inverters (driven over Modbus or a vendor cloud) expose settings shaped around the battery itself: a maximum charge power, a maximum discharge power, a charge ceiling, a backup / reserve state of charge and a work mode (self-use, forced charge, forced discharge, standby on many models). Here every mapping is **direct**:

| Inverter setting | Gladys feature | Nature of the mapping |
|---|---|---|
| Max battery charge power | `charge-power-limit` | **Direct** |
| Max battery discharge power | `discharge-power-limit` | **Direct** |
| Charge SoC ceiling | `target-charge-limit` | **Direct** |
| Backup / reserve SoC | `target-discharge-limit` | **Direct** |
| Max grid charge power (Huawei "Maximum charging power from grid", GoodWe, Deye / Sunsynk grid charge) | `grid-charge-power-limit` | **Direct**; published alongside `charge-power-limit` when the inverter has both (a grid charge set as a current follows the conversion rule below) |
| Work mode self-use / force charge / force discharge / standby / time-of-use / backup | `mode` `AUTO` / `CHARGE` / `DISCHARGE` / `STANDBY` / `TIME_OF_USE` / `BACKUP` | **Direct**; a model lacking one of them leaves it out of `supported_options` |
| Active power limit of the inverter's AC output | `home-output` / `power-limit` | **Direct** (`docs/specs/home-output.md`) |

An inverter whose limits are expressed as a battery current (A) rather than a power is out of scope for these types: the integration converts with the battery voltage if it can, or does not publish the feature.

The two profiles are deliberately different: a battery-centred device maps onto the battery limits, an AC-port-centred device onto `grid-charge-power-limit` and `home-output` / `power-limit`, and every power setting of both is a direct mapping. The only approximation left (the plug-in device's AC direction as a `mode`) is written down where it happens.

## B. Detailed design

### B.1 Constants (`server/utils/constants.js`)

1. Six types appended to the `BATTERY_STORAGE` block, each with an end-of-line comment (meaning, unit, `(command)`), and the block's **inline scope comment** required by rule 8 of the taxonomy spec, stating the boundary with neighbouring categories, the measurements/commands boundary and the value conventions of A.1.
2. `BATTERY_STORAGE_MODE` next to the other mode enums (after `WATER_HEATER_MODE`), with its own `module.exports.` line.
3. `DEVICE_FEATURE_UNITS_BY_CATEGORY[BATTERY_STORAGE]` unchanged (`percent`, `watt`, `kilowatt`, `watt-hour`, `kilowatt-hour` already cover every command).
4. `DEVICE_FEATURE_UNITS_BY_CATEGORY_AND_TYPE[BATTERY_STORAGE]`, new, for the **command types only**:

```js
[DEVICE_FEATURE_CATEGORIES.BATTERY_STORAGE]: {
  [DEVICE_FEATURE_TYPES.BATTERY_STORAGE.CHARGE_POWER_LIMIT]: [WATT, KILOWATT],
  [DEVICE_FEATURE_TYPES.BATTERY_STORAGE.DISCHARGE_POWER_LIMIT]: [WATT, KILOWATT],
  [DEVICE_FEATURE_TYPES.BATTERY_STORAGE.TARGET_CHARGE_LIMIT]: [PERCENT],
  [DEVICE_FEATURE_TYPES.BATTERY_STORAGE.TARGET_DISCHARGE_LIMIT]: [PERCENT],
  [DEVICE_FEATURE_TYPES.BATTERY_STORAGE.MODE]: [],
  [DEVICE_FEATURE_TYPES.BATTERY_STORAGE.GRID_CHARGE_POWER_LIMIT]: [WATT, KILOWATT],
},
```

The device edit form (`front/src/components/device/UpdateDeviceFeature.jsx`) and the MQTT setup (`front/src/routes/integration/all/mqtt/device-page/setup/Feature.jsx`) fall back to the category list when a type has no entry — they would offer kWh on a power limit and watts on a percentage. The six measurement types keep that fallback, as before this change. An empty array hides the unit dropdown (the mode).

**No database migration**: `server/models/device_feature.js` builds its enums from the derived lists, and SQLite does not enforce them (same as `water-heater`).

### B.2 Writing values and feedback

No server-side handler. `server/lib/device/device.setValue.js` forwards to the integration and saves the value itself only when `has_feedback` is false. Batteries apply settings asynchronously and may clamp them, so integrations should publish **`has_feedback: true` on every command** and report the value the device actually applied through `saveState`; with `has_feedback: false` the dashboard would show a limit the device never accepted.

### B.3 Dashboard UI

Routing in `front/src/components/boxs/device-in-room/DeviceRow.jsx`: `read_only` → `SensorDeviceFeature`, then `ROW_TYPE_BY_CATEGORY_AND_TYPE`, then `ROW_TYPE_BY_FEATURE_TYPE`.

**All six commands are registered in `ROW_TYPE_BY_CATEGORY_AND_TYPE[BATTERY_STORAGE]`.** `mode` is a string five other categories own, and `target-charge-limit` is already registered by type for the electrical vehicle; routing by type alone would let declaration order decide the component for every category.

| Feature | Component |
|---|---|
| `charge-power-limit`, `discharge-power-limit`, `grid-charge-power-limit` | `SetpointDeviceFeature` (existing) |
| `target-charge-limit`, `target-discharge-limit` | `MultiLevelDeviceFeature` (existing slider, as the vehicle `target-charge-limit`) |
| `mode` | **new** `BatteryStorageModeDeviceFeature.jsx`, a copy of `WaterHeaterModeDeviceFeature.jsx`: static `MODE_OPTIONS` catalog → `resolveFeatureOptions` → `AdaptiveOptionControl` |

`SetpointDeviceFeature` step: `SETPOINT_STEP_BY_CATEGORY[BATTERY_STORAGE] = 10` (watts; no storage system is set by the watt) and a new per-unit override `SETPOINT_STEP_BY_CATEGORY_AND_UNIT[BATTERY_STORAGE][kilowatt] = 0.1` — a 10 kW step would skip the whole range of a feature published in kW. A feature's own `step` still wins over both. No `DEFAULT_VALUE_BY_CATEGORY` entry: the generic `0` is the right starting point for a limit with no value yet.

Other registrations:

- `SUPPORTED_FEATURE_TYPES_BY_CATEGORY[BATTERY_STORAGE]` in `SupportedFeatureTypes.jsx` — the six commands, scoped to the category (the box editor only offers writable features listed there);
- `DeviceFeatureCategoriesIcon[BATTERY_STORAGE]` in `front/src/utils/consts.js` — `arrow-down-circle` (charge power limit), `arrow-up-circle` (discharge power limit), `battery-full` (target charge level), `battery-low` (discharge reserve), `sliders` (mode), `download` (grid charge power limit), all present in `server/config/icons.json`; without them the row renders `fe-undefined`.

### B.4 Scenes

Triggers — `front/src/routes/scene/edit-scene/triggers/DeviceFeatureState.jsx`: a `batteryStorageModeDevice` flag (category `battery-storage` + type `mode`) renders the new `device-states/BatteryStorageModeDeviceState.jsx` (copy of `WaterHeaterModeDeviceState.jsx`), and **is negated in both `defaultDevice` and `thresholdDevice`**, otherwise two widgets stack on the same trigger. The five limits are numbers and keep the existing threshold widget.

Actions — no dedicated `ACTIONS.BATTERY_STORAGE.*`: the generic `ACTIONS.DEVICE.SET_VALUE` reaches every feature. `DeviceSetValue.jsx` renders the new `components/device/SelectBatteryStorageMode.jsx` (copy of `SelectWaterHeaterMode.jsx`) for category `battery-storage` + type `mode`; the limits keep the numeric input.

### B.5 i18n

Four files (`en`, `fr`, `de`, `es`), key-parallel (`npm run compare-translations`):

| Key | Content (en / fr) |
|---|---|
| `deviceFeatureCategory.battery-storage.charge-power-limit` | Charge power limit / Limite de puissance de charge |
| `deviceFeatureCategory.battery-storage.discharge-power-limit` | Discharge power limit / Limite de puissance de décharge |
| `deviceFeatureCategory.battery-storage.target-charge-limit` | Target charge level / Niveau de charge cible |
| `deviceFeatureCategory.battery-storage.target-discharge-limit` | Discharge reserve / Réserve de décharge |
| `deviceFeatureCategory.battery-storage.mode` | Mode / Mode |
| `deviceFeatureCategory.battery-storage.grid-charge-power-limit` | Grid charge power limit / Limite de puissance de charge réseau |
| `deviceFeatureAction.category.battery-storage.mode.{auto,charge,discharge,standby,timeOfUse,backup}` | Auto, Charge, Discharge, Standby, Time of use, Backup / Auto, Charge, Décharge, Veille, Heures creuses / programme, Secours |
| `deviceFeatureValue.category.battery-storage.mode.{0,1,2,3,4,5}` | Same labels, addressed by integer (history, scene selectors) |

No `binary` key is involved, so the `zero`/`one`/`other` plural trap of `water-heater.md` B.5 does not apply; the mode labels are plain integer-keyed strings like `water-heater.mode`.

### B.6 MQTT feature defaults (`front/src/routes/integration/all/mqtt/device-page/utils.js`)

`battery-storage` **is** listed in `isSensorCategory`, so the category baseline is `read_only: true` — right for the six measurements, wrong for the six commands. It stays listed (removing it would flip the measurements), and the commands get explicit branches placed **before** every type-only test and before the existing `-power` / `-index` suffix rules (the command types end in `-limit` and would otherwise fall to the kWh / `0..1000000` fallback):

| Type | `getFeatureDefaultValues` | `getDefaultUnitForFeature` | `getFeaturePreviewValue` |
|---|---|---|---|
| `charge-power-limit`, `discharge-power-limit`, `grid-charge-power-limit` | `min: 0, max: 10000, read_only: false` | `watt` | 1200 / 800 / 600 |
| `target-charge-limit`, `target-discharge-limit` | `min: 0, max: 100, read_only: false` | `percent` | 90 / 10 |
| `mode` | `min: 0, max: 5, read_only: false` | none (`CATEGORIES_WITHOUT_UNIT` entry `battery-storage`×`mode`) | `BATTERY_STORAGE_MODE.AUTO` |

`has_feedback` keeps the MQTT default (`false`), as for `water-heater`: a hand-built MQTT device has no guaranteed state topic.

### B.7 External integrations

**No protocol change.** `server/lib/external-integration/externalIntegration.setDiscoveredDevices.js` validates `category`, `type` and `unit` against the constant lists and passes the rest of the feature through, `supported_options` included. Command semantics over `external-integration.device.set-value`:

| Feature | `value` | Integration contract |
|---|---|---|
| `charge-power-limit`, `discharge-power-limit`, `grid-charge-power-limit` | number ≥ 0, in the feature's unit | Clamp to the device range, apply, report the applied value back |
| `target-charge-limit`, `target-discharge-limit` | number 0..100 | Convert to the device's scale, apply, report the applied value back |
| `mode` | a `BATTERY_STORAGE_MODE` integer | Translate to the device's mode; if the device refuses, report the real mode back — never echo an unapplied value |

The SDK (`@gladysassistant/integration-sdk`) mirrors the core constants; resynchronising it is a follow-up once this lands, after which the Zendure integration publishes A.5.

### B.8 Compatibility

No migration, no existing feature touched, no behaviour change for the six measurement types or any other category.

## C. Non-goals for v1

Adding a type later is non-breaking, so these are deferrals:

- **Timed power requests** — "charge at 2 kW for 30 minutes". That is Matter's `PowerAdjustRequest` model (D.1); Gladys features hold persistent values, and a duration would need a second feature. Scenes plus a delay express it today.
- **Grid export limit / zero export** — an installation-level constraint on `grid-sensor` exchange, not storage.
- **The home output limit is not deferred, it is elsewhere** — the AC output limit is the `home-output` / `power-limit` command, specified in `docs/specs/home-output.md` (a command category of its own, the counterpart of `home-output-sensor`).
- **The time-of-use programme itself** — its charge / discharge windows and tariffs. `TIME_OF_USE` only selects the programme stored in the device; editing it is a schedule problem, out of scope like the water heater's programme.
- **Per-pack settings** — limits or states per battery module. Packs that need them are separate Gladys devices or out of scope.
- **A new category** — see Context.
- **Concrete Matter / Zigbee2MQTT / MQTT-catalog mappings** — the Matter mapping in particular needs the divergences of D.1 resolved in code.
- **Voice assistants and MCP** — their allow-lists stay limited to lights, switches and shutters.

## D. Compliance with the taxonomy design rules

### D.1 Standards alignment (rule 3)

Matter models this capability with the **Battery Storage** device type (introduced in Matter 1.4; device type id 24 / `0x0018` in matter.js 0.17.9, the version `server/services/matter/package.json` pins, which documents it in spec § 14.4). Its control surface is **DeviceEnergyManagement** (DEM) and **DeviceEnergyManagementMode**, both listed as not handled in `server/services/matter/README.md`. What was checked, in the matter.js 0.17.9 type definitions:

- DEM `PowerAdjustment` feature: `PowerAdjustRequest { power, duration, cause }` and `CancelPowerAdjustRequest` — a **temporary** power request with a mandatory duration, within a `PowerAdjustmentCapability` advertised by the device;
- DEM `AbsMinPower` / `AbsMaxPower`: read-only, **signed** capability attributes — for a battery storage inverter, `AbsMaxPower` is the maximum charging power (positive) and `AbsMinPower` the maximum discharging power (negative);
- DEM Mode tags: the Mode Base tags (`Auto`, `Quick`, `Quiet`, `LowNoise`, `LowEnergy`, `Vacation`, `Min`, `Max`, `Night`, `Day`) plus `NoOptimization`, `DeviceOptimization`, `LocalOptimization`, `GridOptimization` — they say **who may optimise** the device's energy use, not which direction power flows;
- no attribute for a state-of-charge ceiling or floor was found in DEM or DEM Mode (Power Source carries the state of charge itself, `BatPercentRemaining`, which is the existing `battery-level`).

| Battery-storage type | Matter counterpart | Nature of the mapping |
|---|---|---|
| `charge-power-limit` | DEM `PowerAdjustRequest` with a positive power; `AbsMaxPower` as the bound | **Declared divergence 1** (persistent limit vs timed request) |
| `discharge-power-limit` | DEM `PowerAdjustRequest` with a negative power; `AbsMinPower` as the bound | **Declared divergence 1**, plus the sign convention (divergence 3) |
| `target-charge-limit` | none found | **No counterpart** — the type exists because every non-Matter storage API exposes it, and the electrical-vehicle category already defines it |
| `target-discharge-limit` | none found | **No counterpart**, same reason |
| `mode` | DEM Mode | **Declared divergence 2** (direction modes vs optimisation tags) |
| `grid-charge-power-limit` | none found | **No counterpart** — `PowerAdjustRequest` carries one signed power at the device's terminals and does not say where the charging power comes from; no DEM, Electrical Power Measurement or Power Topology attribute separates grid charging from solar charging |

**Declared divergence 1 — persistent limits, not timed requests.** A Matter energy manager asks a battery for a given power *for a duration*; when it expires the device returns to its own behaviour. Gladys features hold one persistent value that a user sets on a dashboard or a scene writes, which is what plug-in batteries and hybrid inverters expose natively. A Matter mapping would have to re-issue requests to hold a limit, which is a mapping concern; timed requests are a non-goal (C).

**Declared divergence 2 — the mode enum is not the optimisation tags.** `BATTERY_STORAGE_MODE` says what the battery does (`AUTO`, forced `CHARGE`, forced `DISCHARGE`, `STANDBY`, `TIME_OF_USE`, `BACKUP`); DEM Mode says who is allowed to optimise. The only tag-level correspondence that can be argued is `AUTO` ↔ a mode tagged `DeviceOptimization` (the device optimises itself); `CHARGE` / `DISCHARGE` / `STANDBY` correspond to DEM power requests or to pausing, not to mode tags. This mapping is **to be confirmed at implementation time** and is not a claim of alignment.

**Declared divergence 3 — no sign.** Matter uses one signed power (charging positive, discharging negative). Gladys keeps the split types that `battery-storage` already uses for its measurements (`charge-power` / `discharge-power`), so the commands read the same way; a Matter mapping splits on the sign.

Zigbee (ZCL) has no stationary-storage control cluster (its Power Configuration cluster describes a device's own supply battery, the `battery` category); the second reference adds nothing.

### D.2 AC-port devices

An earlier draft of A.5 mapped the plug-in devices' AC output limit and AC grid-charge limit onto `discharge-power-limit` / `charge-power-limit`, lossily. Both now have exact types:

- the **AC output limit** is `home-output` / `power-limit` (`docs/specs/home-output.md`). A type meaning "AC output limit" in `battery-storage` would fail rule 2 (it bounds solar power too, which is not stored energy) and rule 5 (it is not intrinsic to storage: micro-inverters without any battery have the same setting); it cannot go into `home-output-sensor` either, because rule 7 reserves the `-sensor` suffix for read-only measurements;
- the **AC grid-charge limit** is `grid-charge-power-limit`. It does belong here: it bounds a share of the power INTO the battery, a quantity `battery-storage` already measures (`charge-power`), so rule 5 keeps it in the category rather than in `grid-sensor` (which measures the exchange at the connection point, not what the battery draws).

### D.3 Checklist

- [x] **No brand, product or vendor name** in the types or their semantics. Brands appear only in the mapping tables (A.5), as the evidence the types are generic.
- [x] **Could not be mapped onto an existing category + type.** The existing six types are read-only measurements; no category carries a writable storage limit. `target-charge-limit` **is** reused (same string and meaning as the vehicle type), routed by category.
- [x] **The same quantity is not split across categories.** The limits bound quantities `battery-storage` already measures; home output, grid exchange and production stay in their categories (A.4).
- [x] **Types are intrinsic to the capability.** Six settings that bound storing energy (`grid-charge-power-limit` bounds the grid share of the charge power); grid export and per-pack settings deferred (C); the home output limit is its own command category, `home-output` (D.2).
- [x] **Matter checked** (D.1), every type qualified (divergence, no counterpart), three divergences argued, unverified correspondences flagged as such.
- [x] **Generic, not modelled on one API.** Two device families with different native interfaces (A.5 AC-port-centred, A.6 battery-centred) map onto the taxonomy with every power setting direct; `grid-charge-power-limit` is exposed by both (plug-in AC charging, hybrid inverters' grid charge power).
- [x] **Enum-like type exposes the full generic set** (six modes); per-device subsets go through `supported_options` (A.3).
- [x] **Naming**: kebab-case, English, no protocol name; `target-*-limit` mirrors the existing vehicle type; no `-sensor` suffix needed (existing category).
- [x] **Names stress-tested** against plug-in batteries, hybrid inverters, home battery packs and the electrical-vehicle charge limit; an inverter with current-based limits is explicitly out of scope (A.6).
- [x] **Inline scope comment** extended with the measurements/commands boundary and the value conventions (B.1).
- [x] **Translations** in all four locale files, including `deviceFeatureAction` / `deviceFeatureValue` for the mode (B.5).
- [x] **Units** declared per type in `DEVICE_FEATURE_UNITS_BY_CATEGORY_AND_TYPE` (B.1).
- [x] **MQTT defaults** specified (B.6); history grouping unchanged — `battery-storage` is already in `front/src/routes/history/categoryGroups.js`.
- [x] **Tests and spec in the same diff** — `server/test/utils/constants.test.js` covers the enum, the types and the per-type units; there is no new server runtime path.

## Verification

1. `cd front && npm run compare-translations` — every new type has its `deviceFeatureCategory` label in all locales (including `grid-charge-power-limit` and the `home-output` category).
2. `cd front && npm run prettier-check && npm run eslint && npm run build`; `cd server && npm run prettier-check && npm run eslint && npx mocha test/utils/constants.test.js` (and `npm run coverage` in CI).
3. Manual pass on both reference profiles, hand-built from the MQTT feature catalog or published by a test integration: each command row has its own icon; the power limits (grid charge included) step by 10 W (0.1 kW for a kW feature); A.5's output limit renders as a `home-output` setpoint, not as a battery row; the state-of-charge limits are sliders in %; the mode control lists only the declared `supported_options` (two buttons for A.5, six for A.6); the measurement rows are unchanged.
4. Scene pass: a trigger on `mode` shows exactly one widget (the negation of B.4); an action on `mode` stores an integer; an action on a limit (grid charge and home output limits included) stores a number.
5. MQTT catalog: picking each new type pre-fills `read_only: false`, the bounds and the unit of B.6, and the six measurement types keep their previous defaults.
6. `cd front && npm run cypress:run` — dashboard and scene specs stay green.
