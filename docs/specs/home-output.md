# Home output control (output power limit)

> **Living specification — source of truth.** This document specifies the `home-output` device feature category: its single command type `power-limit`, its value conventions, the frontend registration points and the external-integration contract. **Rule: any PR that changes a home-output behavior or contract modifies this file in the same diff** — spec first, code second.
>
> This category is designed under `docs/specs/device-feature-categories.md`, the taxonomy's design rules and review checklist. Section D audits it against that checklist. It was split out of the battery-storage controls (`docs/specs/battery-storage.md`, A.5 and D.2).

## Context

`home-output-sensor` measures the power a device **itself** delivers to the installation it feeds through its AC output (a storage inverter's home output, a plug-in battery's AC port, its backup output). Many of those devices let the user **bound** that output, and it is the setting users touch most often: "never push more than 600 W into the house", "0 W at night", "follow the base load".

Before this category the only documented answer was a lossy mapping onto the battery limits (`docs/specs/battery-storage.md`, earlier draft of A.5): the AC output of a plug-in storage system carries solar power that never went through the battery, so with sun an "output limit" published as `discharge-power-limit` lets the battery discharge less than the limit, or even charge. A review of that draft asked for an exact type; this is it.

Scoping decisions:

- **A command category of its own, the counterpart of `home-output-sensor`.** Rule 7 reserves the `-sensor` suffix for read-only measurement categories, so the command cannot be a type of `home-output-sensor`. The precedent is `thermostat` (holds the setpoint) next to `temperature-sensor` (holds the measurement). The measurements stay in `home-output-sensor`, unchanged.
- **Not a `battery-storage` type.** The output limit bounds solar and battery power together, and devices without any battery have the same setting (micro-inverters). A battery type would fail rule 2 (one quantity, one category) and rule 5 (intrinsic metrics only).
- **One type in v1.** The other controls of the same devices are either battery settings (`battery-storage` commands, including `grid-charge-power-limit`) or out of scope (C).

## A. Device model

### A.1 Category and feature type

`DEVICE_FEATURE_CATEGORIES.HOME_OUTPUT = 'home-output'`, with the matching `DEVICE_FEATURE_TYPES.HOME_OUTPUT` block (both keys spelled `HOME_OUTPUT`, so `front/cli/check_translations.js` checks the type).

| Type | Value | Direction | Units | min / max | Semantics |
|---|---|---|---|---|---|
| `POWER_LIMIT` | `power-limit` | command | `watt`, `kilowatt` | 0 / device rating | **Maximum power the device itself delivers to the installation it feeds through its AC output**, whatever its source (solar, battery, both). The device delivers up to this power. |

`power-limit` is a string no other category uses; the dashboard still routes it by category (B.3) so that a later homonym cannot steal it.

### A.2 Value conventions

Stated once here and in the inline comment (B.1):

- **Non-negative**, in the feature's unit. There is no direction to sign: the type bounds the output only.
- **`0` means zero.** A limit of `0` means no output; it never means "unlimited". A device whose API uses `0` or `-1` for "no limit" publishes its rated maximum instead, and `max` carries that rating.
- **A limit is persistent.** It is a setting the device keeps until it is written again, not a timed request (D.1).
- **The device stays the authority.** Gladys does not check the value against the rating: the device clamps or rejects, and the integration reports the value actually applied (B.2).

### A.3 What belongs to other categories

| Value the device reports or accepts | Category to use |
|---|---|
| Power / energy delivered through the AC output (measurement) | `home-output-sensor` (`power`, `index`, `off-grid-*`) |
| PV production of a PV-only inverter (measurement) | `energy-production-sensor` — for such a device the AC output **is** its production, which keeps its own category (rule 2); the limit on that output is still `home-output` / `power-limit` |
| Battery charge / discharge limits, grid charge limit, state-of-charge limits, mode | `battery-storage` commands (`docs/specs/battery-storage.md`) |
| Grid export limit / zero-export setting | — (out of scope, C): it bounds the exchange at the connection point (`grid-sensor`), not the device output |
| Output limit as a percentage of the rating | — (later, separate type, C) |

### A.4 Reference devices

Every mapping is **direct**:

| Device family | Native setting | Gladys feature |
|---|---|---|
| Plug-in storage system (Zendure SolarFlow) | `outputLimit` (W delivered to the home) | `home-output` / `power-limit` |
| Plug-in storage system (Anker Solix) | output power preset | `home-output` / `power-limit` |
| Plug-in storage / micro-inverter (EcoFlow PowerStream) | custom load / output power | `home-output` / `power-limit` |
| Micro-inverters (Hoymiles, APsystems, Enphase) | active power limit in watts | `home-output` / `power-limit` |
| Storage / hybrid inverter | active power limit of the AC output, in watts | `home-output` / `power-limit` |

A micro-inverter whose limit is expressed **only** as a percentage of its rating converts it with the rating when it knows it, or does not publish the feature (C).

```json
{ "name": "Output limit", "external_id": "ext:my-integration:plug-in-battery:output-limit",
  "category": "home-output", "type": "power-limit", "unit": "watt",
  "read_only": false, "has_feedback": true, "keep_history": true, "min": 0, "max": 800 }
```

The plug-in storage system of `docs/specs/battery-storage.md` A.5 publishes this feature next to its `home-output-sensor` measurement and its `battery-storage` features.

## B. Detailed design

### B.1 Constants (`server/utils/constants.js`)

1. `HOME_OUTPUT: 'home-output'` in `DEVICE_FEATURE_CATEGORIES`, just before `HOME_OUTPUT_SENSOR`, with a short pointer comment.
2. `DEVICE_FEATURE_TYPES.HOME_OUTPUT = { POWER_LIMIT: 'power-limit' }`, after `HOME_OUTPUT_SENSOR`, carrying the **inline scope comment** of rule 8: scope (power the device itself delivers through its AC output, solar and battery together), boundary with `home-output-sensor` (measurements), `battery-storage` and `grid-sensor` (export limits out of scope), and the conventions of A.2.
3. `DEVICE_FEATURE_UNITS_BY_CATEGORY[HOME_OUTPUT] = [WATT, KILOWATT]`; no per-type entry is needed (one type).

`DEVICE_FEATURE_CATEGORIES_LIST` / `DEVICE_FEATURE_TYPES_LIST` are derived, so `externalIntegration.setDiscoveredDevices.js` accepts the category, type and units with no code change. **No database migration**: `server/models/device_feature.js` builds its enums from the same lists and SQLite does not enforce them.

### B.2 Writing values and feedback

No server-side handler: `server/lib/device/device.setValue.js` forwards to the integration. As for the battery commands, integrations should publish **`has_feedback: true`** and report the value the device actually applied through `saveState`.

### B.3 Dashboard UI

- `ROW_TYPE_BY_CATEGORY_AND_TYPE[HOME_OUTPUT][power-limit] = SetpointDeviceFeature` in `DeviceRow.jsx`;
- `SETPOINT_STEP_BY_CATEGORY[HOME_OUTPUT] = 10` (W) and `SETPOINT_STEP_BY_CATEGORY_AND_UNIT[HOME_OUTPUT][kilowatt] = 0.1` in `SetpointDeviceFeature.jsx`, the battery power limits' logic; a feature's own `step` wins;
- `SUPPORTED_FEATURE_TYPES_BY_CATEGORY[HOME_OUTPUT]` in `SupportedFeatureTypes.jsx`;
- `DeviceFeatureCategoriesIcon[HOME_OUTPUT][power-limit] = 'log-out'` in `front/src/utils/consts.js` (present in `server/config/icons.json` and the theme CSS);
- history: `home-output` joins the energy group of `front/src/routes/history/categoryGroups.js`, next to `home-output-sensor`.

### B.4 Scenes

Nothing specific: the limit is a number. `ACTIONS.DEVICE.SET_VALUE` (`DeviceSetValue.jsx`) shows the generic numeric input, the trigger (`DeviceFeatureState.jsx`) the generic threshold widget.

### B.5 i18n

Four files (`en`, `fr`, `de`, `es`), key-parallel (`npm run compare-translations`):

| Key | en / fr / de / es |
|---|---|
| `deviceFeatureCategory.home-output.shortCategoryName` | Home output / Sortie maison / Hausausgang / Salida del hogar |
| `deviceFeatureCategory.home-output.power-limit` | Output power limit / Limite de puissance de sortie / Ausgangsleistungsgrenze / Límite de potencia de salida |

### B.6 MQTT feature defaults (`front/src/routes/integration/all/mqtt/device-page/utils.js`)

`home-output` has no `-sensor` suffix and is **not** listed in `isSensorCategory`, so the baseline is writable. `getFeatureDefaultValues` returns `min: 0, max: 10000, read_only: false, unit: watt` in a category-scoped branch placed before every type-only test; `getDefaultUnitForFeature` returns `watt` for the category before any suffix rule (a type ending in `-limit` must never fall to a kWh fallback); `getFeaturePreviewValue` returns `800`.

### B.7 External integrations

**No protocol change.** Over `external-integration.device.set-value`, `value` is a number ≥ 0 in the feature's unit: the integration converts it to the device's unit and scale, clamps it to the device range, applies it and reports the applied value back — never echoing an unapplied value. The SDK (`@gladysassistant/integration-sdk`) mirrors the core constants; resynchronising it is a follow-up, after which the Zendure integration maps `outputLimit` onto this type.

### B.8 Compatibility

New category, no existing feature touched, no migration.

## C. Non-goals for v1

Adding a type later is non-breaking:

- **A percent-of-rating output limit** (some micro-inverters accept only that). It would be a separate type (`power-limit-percent` or similar), never a second unit on `power-limit`: a percentage and a power are not interchangeable without the rating.
- **Grid export limit / zero export.** It bounds the exchange at the connection point, whatever the devices behind it do; it is an installation-level `grid-sensor` concern, not this device's output.
- **Timed output requests** ("deliver at most 300 W for 30 minutes"): Matter's `PowerAdjustRequest` model (D.1). Scenes plus a delay express it today.
- **A limit on the backup / off-grid output.** No reference device exposes one separately; `off-grid-power-limit` can be added when one does.
- **Concrete Matter / Zigbee2MQTT / MQTT-catalog mappings.**

## D. Compliance with the taxonomy design rules

### D.1 Standards alignment (rule 3)

Checked in matter.js 0.17.9 (the version `server/services/matter/package.json` pins): the **Solar Power** device type (id 23 / `0x0017`) and the **Battery Storage** device type (id 24 / `0x0018`) put their control surface in **DeviceEnergyManagement** (DEM), with the `PowerAdjustment` feature mandatory for Solar Power. Its only power control is the `PowerAdjustRequest { Power (mW), Duration (s), Cause }` command, all three fields mandatory — a **timed** request, cancelled by `CancelPowerAdjustRequest` or by its expiry. No attribute of DEM, DEM Mode, Electrical Power Measurement, Electrical Energy Measurement or Power Topology is writable (no `RW` access in their model definitions), so **no Matter cluster exposes a persistent AC output limit**.

| Home-output type | Matter counterpart | Nature of the mapping |
|---|---|---|
| `power-limit` | DEM `PowerAdjustRequest` on a Solar Power / Battery Storage device | **Declared divergence** — persistent limit vs timed request, the same divergence as the battery power limits (`docs/specs/battery-storage.md` D.1, divergence 1). A Matter mapping would re-issue requests to hold a limit; that is a mapping concern. |

Zigbee (ZCL) has no inverter output-limit cluster; the second reference adds nothing.

### D.2 Checklist

- [x] **No brand, product or vendor name** in the category, type or semantics; brands appear only in A.4, as the evidence the type is generic.
- [x] **Could not be mapped onto an existing category + type.** `home-output-sensor` is read-only and rule 7 keeps it so; the battery limits bound the battery only (Context).
- [x] **The same quantity is not split across categories.** The measurement stays in `home-output-sensor` (or `energy-production-sensor` for a PV-only inverter's production), the command bounding it lives here, as `temperature-sensor` / `thermostat`.
- [x] **Types are intrinsic to the capability.** One type, the output bound; export limits and percentage limits deferred (C).
- [x] **Matter checked** (D.1): no persistent counterpart, divergence declared and argued.
- [x] **Generic, not modelled on one API.** Plug-in storage systems, micro-inverters and storage inverters from several brands map onto it directly (A.4).
- [x] **Enum-like type**: not applicable (a number).
- [x] **Naming**: kebab-case, English, no protocol name; no `-sensor` suffix because the category is a command, its name otherwise aligned on `home-output-sensor`.
- [x] **Names stress-tested** against plug-in batteries, micro-inverters, hybrid inverters and grid export limits (the latter explicitly excluded, C).
- [x] **Inline scope comment** with the boundaries and value conventions (B.1).
- [x] **Translations** in all four locale files (B.5); no `deviceFeatureValue` keys (not an enum).
- [x] **Units** declared in `DEVICE_FEATURE_UNITS_BY_CATEGORY` (B.1).
- [x] **MQTT defaults and history grouping** (B.3, B.6).
- [x] **Tests and spec in the same diff** — `server/test/utils/constants.test.js` covers the category, the type, the units and the derived lists external integrations are validated against.

## Verification

1. `cd front && npm run compare-translations` — `home-output.shortCategoryName` and `home-output.power-limit` in all locales.
2. `cd front && npm run prettier-check && npm run eslint && npm run build`; `cd server && npm run prettier-check && npm run eslint && npx mocha test/utils/constants.test.js`.
3. Dashboard: a writable `home-output` / `power-limit` feature renders as a setpoint with the `log-out` icon, stepping by 10 W (0.1 kW for a kW feature); the demo's solar inverter carries one.
4. Scenes: an action on it stores a number; a trigger on it shows the threshold widget.
5. MQTT catalog: picking "Home output → Output power limit" pre-fills `read_only: false`, `0..10000`, `watt`.
