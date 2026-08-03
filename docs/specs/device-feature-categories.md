# Device feature categories & types — design and review criteria

**Status:** living spec. Any PR that adds or modifies entries in `DEVICE_FEATURE_CATEGORIES` or `DEVICE_FEATURE_TYPES` must comply with this document, and PR reviews must check the diff against the checklist below.

## Why this document exists

`DEVICE_FEATURE_CATEGORIES` and `DEVICE_FEATURE_TYPES` (defined in `server/utils/constants.js`) are Gladys's **protocol-agnostic device abstraction**. Every integration — Zigbee2MQTT, Matter, MQTT, Z-Wave, Tuya, Netatmo, and all the others — maps its devices onto this single shared taxonomy. This is what makes scenes, dashboards, charts, and alarm features work identically regardless of the brand or protocol behind a device.

The most common review feedback on PRs that add new categories is that the proposed category is modeled on **one specific brand or product** rather than on the underlying capability. This document formalizes the criteria so contributors can self-check before opening a PR.

## Design rules

### 1. A category describes a capability, never a brand

A category (and its types) must describe **what a device does**, not who makes it or which product exposes it. Brand names, product lines, or vendor-ecosystem concepts must never appear in category or type names or semantics.

**Litmus test:** would a device from a completely different brand, with the same capability, naturally use this exact category and these exact types? If the answer is "no, this only makes sense for brand X's device", the category is too specific.

### 2. Categories must group protocols — standards as the reference, not the ceiling

A Gladys category should be able to represent the same capability coming from **several protocols**. When designing a new category or type, check how established smart-home standards model that capability, in this priority order:

1. **Matter** (device types and clusters) — the primary reference. When Matter models the capability well, align the category's semantics (types, value ranges, and naming where reasonable) with the Matter model **by default**: the Matter and Zigbee integrations have to map their clusters onto Gladys categories, and every unjustified divergence turns that mapping into a lossy conversion.
2. **Zigbee** (ZCL clusters, as exposed by Zigbee2MQTT) — the second reference for capabilities Matter does not cover yet.

Matter and Zigbee are the only reference standards: older protocols (Z-Wave, BLE profiles, KNX…) are loosely specified and inconsistently implemented, and must not be used as design references for the taxonomy. When neither Matter nor Zigbee covers the capability, fall back to the "no standard covers the capability" case below.

Standards are the reference, **not a veto**. Matter has real gaps and lags behind the market (electric vehicles, pool sensors, energy metering specifics…), and Gladys must be able to model capabilities beyond it — the existing `electrical-vehicle-*` or `ph-sensor`/`orp-sensor` categories are legitimate examples with no Matter equivalent. Two situations, two burdens of proof:

- **The standard covers the capability but you diverge from it**: allowed, with an explicit justification in the PR of what the standard's model gets wrong or misses for Gladys's use case.
- **No standard covers the capability**: a new category is fine, provided it is designed from the **capability** itself, not from one vendor's API. Show that it is generic — typically, that devices from several brands (or several protocols) expose the same capability and would map onto it naturally.

What remains unacceptable is a category whose semantics are a copy of a **single proprietary API**: being absent from Matter is not a blocker, but being modeled on one brand is.

### 3. Reuse before creating

Before adding a category or type, check the existing list in `server/utils/constants.js`. If an existing category + type combination covers the capability — even under a different name than the integration's native vocabulary — **map to the existing one** instead of creating a new one. A new category is justified only when no existing category can represent the capability without distorting its meaning.

### 4. Right granularity

A device feature holds **one atomic value**: one measurement (a sensor reading) or one control (a command/state). Types within a category are the different atomic values that capability can expose (e.g. `light` → `binary`, `brightness`, `temperature`). Do not create a category that bundles several unrelated values, and do not create a new category when only a new type on an existing category is needed.

### 5. Naming conventions

- Values are **kebab-case** (`co2-sensor`, `energy-production-sensor`).
- Read-only measurement categories use the `*-sensor` suffix.
- Names are in **English** and use the standard's vocabulary when one exists (see rule 2).
- No protocol name inside a category/type name: the taxonomy is protocol-agnostic by definition.

### 6. Full plumbing is part of the change

Adding a category or type is not just a constant. The same PR must include:

- the entry in `server/utils/constants.js` (`DEVICE_FEATURE_CATEGORIES` / `DEVICE_FEATURE_TYPES`);
- translations in **all** `front/src/config/i18n/*.json` files (`npm run compare-translations` enforces this);
- the allowed units in `DEVICE_FEATURE_UNITS_BY_CATEGORY` when the category is a measurement;
- front display support (icon, feature edition/display components) where relevant;
- server tests covering the new code paths.

## Review checklist

For any PR touching `DEVICE_FEATURE_CATEGORIES` / `DEVICE_FEATURE_TYPES`:

- [ ] No brand, product, or vendor-ecosystem name in category/type names or semantics.
- [ ] The capability could not be mapped onto an existing category + type.
- [ ] The Matter model (then Zigbee) was checked; semantics align with the standard by default, and any divergence from an existing standard model is justified in the PR.
- [ ] If no standard covers the capability, the PR shows the category is generic (several brands/protocols would map onto it) and not modeled on a single proprietary API.
- [ ] Naming follows the conventions above (kebab-case, `*-sensor` suffix, English, no protocol name).
- [ ] Translations added to all i18n language files.
- [ ] Units declared in `DEVICE_FEATURE_UNITS_BY_CATEGORY` if the category is a measurement.
- [ ] Tests and (if behavior is covered by a living spec) spec updates are in the same diff.

## Known legacy exceptions

A few existing entries pre-date these rules and would not be accepted today, e.g. `teleinformation` (specific to French electricity meters) or `voc-matter-index-sensor` / `no2-matter-index-sensor` (protocol name embedded in the category). They are kept for backward compatibility but **must not be used as precedents** to justify new brand- or protocol-specific categories.
