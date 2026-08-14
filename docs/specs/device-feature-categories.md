# Device feature categories & types — design and review criteria

**Status:** living spec. Any PR that adds or modifies entries in `DEVICE_FEATURE_CATEGORIES` or `DEVICE_FEATURE_TYPES` must comply with this document, and PR reviews must check the diff against the checklist below.

## Why this document exists

`DEVICE_FEATURE_CATEGORIES` and `DEVICE_FEATURE_TYPES` (defined in `server/utils/constants.js`) are Gladys's **protocol-agnostic device abstraction**. Every integration — Zigbee2MQTT, Matter, MQTT, Z-Wave, Tuya, Netatmo, and all the others — maps its devices onto this single shared taxonomy. This is what makes scenes, dashboards, charts, and alarm features work identically regardless of the brand or protocol behind a device.

The most common review feedback on PRs that add new categories is that the proposed category is modeled on **one specific brand or product** rather than on the underlying capability. This document formalizes the criteria so contributors can self-check before opening a PR.

## Design rules

### 1. A category describes a capability, never a brand

A category (and its types) must describe **what a device does**, not who makes it or which product exposes it. Brand names, product lines, or vendor-ecosystem concepts must never appear in category or type names or semantics.

**Litmus test:** would a device from a completely different brand, with the same capability, naturally use this exact category and these exact types? If the answer is "no, this only makes sense for brand X's device", the category is too specific.

### 2. One physical quantity, one category — whatever device measures it

A category represents a quantity or capability, never the device that happens to measure it. The same physical quantity must not be split across categories depending on the measuring hardware: grid import/export is the same measurement whether it comes from a plug-in battery's grid port, an EM clamp, or a whole-home meter — they all publish to `grid-sensor`. If a category's definition depends on which device reports the value, the same data ends up scattered across several categories, and every future cross-device feature (auto-built energy dashboards, room aggregations…) has to special-case them all.

### 3. Categories must group protocols — standards as the reference, not the ceiling

A Gladys category should be able to represent the same capability coming from **several protocols**. When designing a new category or type, check how established smart-home standards model that capability, in this priority order:

1. **Matter** (device types and clusters) — the primary reference. When Matter models the capability well, align the category's semantics (types, value ranges, and naming where reasonable) with the Matter model **by default**: the Matter and Zigbee integrations have to map their clusters onto Gladys categories, and every unjustified divergence turns that mapping into a lossy conversion.
2. **Zigbee** (ZCL clusters, as exposed by Zigbee2MQTT) — the second reference for capabilities Matter does not cover yet.

Matter and Zigbee are the only reference standards: older protocols (Z-Wave, BLE profiles, KNX…) are loosely specified and inconsistently implemented, and must not be used as design references for the taxonomy. When neither Matter nor Zigbee covers the capability, fall back to the "no standard covers the capability" case below.

Standards are the reference, **not a veto**. Matter has real gaps and lags behind the market (electric vehicles, pool sensors, energy metering specifics…), and Gladys must be able to model capabilities beyond it — the existing `electrical-vehicle-*` or `ph-sensor`/`orp-sensor` categories are legitimate examples with no Matter equivalent. Two situations, two burdens of proof:

- **The standard covers the capability but you diverge from it**: allowed, with an explicit justification in the PR of what the standard's model gets wrong or misses for Gladys's use case.
- **No standard covers the capability**: a new category is fine, provided it is designed from the **capability** itself, not from one vendor's API. Show that it is generic — typically, that devices from several brands (or several protocols) expose the same capability and would map onto it naturally.

What remains unacceptable is a category whose semantics are a copy of a **single proprietary API**: being absent from Matter is not a blocker, but being modeled on one brand is.

### 4. Reuse before creating

Before adding a category or type, check the existing list in `server/utils/constants.js`. If an existing category + type combination covers the capability — even under a different name than the integration's native vocabulary — **map to the existing one** instead of creating a new one. A new category is justified only when no existing category can represent the capability without distorting its meaning.

### 5. Right granularity — intrinsic metrics only

A device feature holds **one atomic value**: one measurement (a sensor reading) or one control (a command/state). Types within a category are the different atomic values that capability can expose (e.g. `light` → `binary`, `brightness`, `temperature`). Do not create a category that bundles several unrelated values, and do not create a new category when only a new type on an existing category is needed.

A category also covers only the metrics **intrinsic** to its capability. Real products often report values belonging to other subsystems (a storage battery's API may expose PV production, grid exchange, and home output) — a Gladys device simply exposes features from several categories, one per capability. Shaping a single category around everything one product family reports is how brand-specific contracts sneak in: `battery-storage` was initially proposed with 17 types mirroring one vendor's telemetry, and was narrowed down to the six metrics intrinsic to storage (level, charge/discharge power and indexes, remaining energy), the rest going to the existing energy categories.

### 6. Model the full capability — declare per-device support with `supported_options`

For enum-like features (modes, fan speeds, swing positions, button click types…), the category/type defines the **full generic set of values** the capability can have (e.g. `AC_MODE`), never the subset one brand happens to implement.

Real devices rarely support the whole set: an air conditioner may only do cool + fan, another one heat + cool + dry. That per-device subset is **not** expressed in the taxonomy — it is declared by the integration through **`supported_options`** on the device feature (rows in `t_device_feature_supported_option`, `{ value, label, sort_order }`, validated by `normalizeSupportedOptions` at device creation/update). The UI then only shows the declared subset (`resolveFeatureOptions` in the front). For legacy features with absent or empty `supported_options`, the feature UI applies its compatibility fallback — `resolveFeatureOptions` itself returns the full static list, but a feature component may narrow it further (air-conditioning mode filters the static list by the feature's `max` range so cooling-only units don't get dead dry/fan buttons).

Option values are either **integers** (the enum-like case above) or **free strings**. String values exist for one specific situation: lists that no generic value set can describe because the values only exist on the appliance itself — installed TV apps, HDMI sources, vacuum rooms, native scenes. Those lists go through the dedicated `text` / `select` feature type: the integration declares the discovered choices as `supported_options` (`{ value: 'com.disney.disneyplus-prod', label: 'Disney+' }`), the UI shows the labels, and the selected value is the feature's state — stored as a string in `last_value_string`, with **no state history** (like `text`/`text`). Storage mirrors `last_value` / `last_value_string` on the feature itself: a string value lives in the option row's `value_string` column while the integer `value` column keeps a filler, and the model exposes whichever is set as one polymorphic `value` — an API consumer never sees the split. An integer and its string twin (`5` and `'5'`) are rejected as duplicates within a feature's options, and a string value on any feature other than `text`/`select` is rejected outright (`normalizeSupportedOptions` scopes the value domain by feature type). A dynamic select is **not** a way to bypass the taxonomy: a capability standards do cover (AC modes, fan speeds…) keeps its own category/type with integer values and translated labels.

Consequence for reviews: "brand X only supports 3 of the 5 modes" is **never** a reason to create a narrower category, a brand-specific type, or a stripped-down enum. Keep the generic value set and let the integration declare what each device supports. The air-conditioning features are the reference example: the Matter service builds the `supported_options` of the AC mode feature from the Thermostat cluster's capability flags (heating/cooling/autoMode).

### 7. Naming conventions — renaming is the costly mistake

- Values are **kebab-case** (`co2-sensor`, `energy-production-sensor`).
- Read-only measurement categories use the `*-sensor` suffix.
- Names are in **English** and use the standard's vocabulary when one exists (see rule 3).
- No protocol name inside a category/type name: the taxonomy is protocol-agnostic by definition.

Adding a type to an existing category later is non-breaking; renaming a category or changing its semantics after integrations have published it is. Review effort should therefore concentrate on **names and semantics**: stress-test them against the neighboring and future device classes that will use the category (for an energy category: hybrid inverters, micro-inverters, EM clamps / P1 meters, plug-in batteries…), not only against the device that motivates the PR. A category that would need renaming to fit the next device class is not ready to merge; a category that only needs more types later is fine.

### 8. Full plumbing is part of the change

Adding a category or type is not just a constant. The same PR must include:

- the entry in `server/utils/constants.js` (`DEVICE_FEATURE_CATEGORIES` / `DEVICE_FEATURE_TYPES`);
- an **inline comment on the new constant** defining the category's scope, its boundary with neighboring categories (e.g. `home-output-sensor` = power the device itself delivers to the installation it feeds; house consumption measured by an inverter goes to `energy-sensor`), and its value conventions — sign, direction, non-negative semantics. When both a signed type and split input/output types exist, state that an integration maps whichever form its device natively reports, never both for the same measurement. Without this comment, the first integration that stretches the category's meaning wins by default;
- translations in **all** `front/src/config/i18n/*.json` files (`npm run compare-translations` enforces this);
- the allowed units in `DEVICE_FEATURE_UNITS_BY_CATEGORY` when the category is a measurement — and in `DEVICE_FEATURE_UNITS_BY_CATEGORY_AND_TYPE` when units differ by type within the category;
- front display support where relevant: icon, feature edition/display components, and the explicit allowlists a control-type feature must join to render at all — `SUPPORTED_FEATURE_TYPES` in `front/src/components/boxs/device-in-room/SupportedFeatureTypes.jsx` and any category-aware dashboard maps;
- MQTT feature defaults in `front/src/routes/integration/all/mqtt/device-page/utils.js` where relevant (`isSensorCategory` special cases, `getFeatureDefaultValues` min/max/`read_only`, `getFeaturePreviewValue`);
- history grouping in `front/src/routes/history/categoryGroups.js` when the category should appear in the activity history;
- enumerated value translations (`deviceFeatureValue` keys in all locale files) when the type's values are an enum not covered by the existing binary/push helpers;
- tests for any new or changed runtime behavior (a constant-only addition does not need a test that dumps the constants list).

## Review checklist

For any PR touching `DEVICE_FEATURE_CATEGORIES` / `DEVICE_FEATURE_TYPES`:

- [ ] No brand, product, or vendor-ecosystem name in category/type names or semantics.
- [ ] The capability could not be mapped onto an existing category + type.
- [ ] The same physical quantity is not split across categories depending on which device measures it.
- [ ] Types are intrinsic to the capability; other values the product reports go to their own categories on the same device.
- [ ] The Matter model (then Zigbee) was checked; semantics align with the standard by default, and any divergence from an existing standard model is justified in the PR.
- [ ] If no standard covers the capability, the PR shows the category is generic — capability-first; multi-brand/protocol mapping is the usual evidence — and not modeled on a single proprietary API.
- [ ] Enum-like types expose the full generic value set; per-device subsets go through `supported_options`, not through a narrowed category or type.
- [ ] Naming follows the conventions above (kebab-case, `*-sensor` suffix, English, no protocol name).
- [ ] Names and semantics stress-tested against neighboring and future device classes (a later rename is breaking; adding types later is not).
- [ ] The new constant carries an inline scope comment: boundary with neighboring categories and value conventions (sign/direction, signed vs split input/output).
- [ ] Translations added to all i18n language files (including `deviceFeatureValue` keys for enumerated values, where relevant).
- [ ] Units declared in `DEVICE_FEATURE_UNITS_BY_CATEGORY` if the category is a measurement (and in `DEVICE_FEATURE_UNITS_BY_CATEGORY_AND_TYPE` when units are type-specific).
- [ ] MQTT feature defaults (`front/src/routes/integration/all/mqtt/device-page/utils.js`) and history grouping (`front/src/routes/history/categoryGroups.js`) updated where relevant.
- [ ] Tests for new/changed runtime behavior and (if behavior is covered by a living spec) spec updates are in the same diff.

## Known legacy exceptions

A few existing entries pre-date these rules and would not be accepted today, e.g. `teleinformation` (specific to French electricity meters) or `voc-matter-index-sensor` / `no2-matter-index-sensor` (protocol name embedded in the category). They are kept for backward compatibility but **must not be used as precedents** to justify new brand- or protocol-specific categories.
