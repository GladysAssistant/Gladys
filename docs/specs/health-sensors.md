# Health sensors (measures of a person's body)

> **Living specification — source of truth.** This document specifies the `body-composition-sensor`, `blood-pressure-sensor`, `heart-rate-sensor` and `blood-oxygen-sensor` device feature categories: their types, units and value conventions. **Rule: any PR that changes one of these categories, types or conventions modifies this file in the same diff.**
>
> These categories are designed under `docs/specs/device-feature-categories.md`. Section D audits this design against its checklist.

## Context

Gladys has no category for a measure taken on a person. Smart scales, blood pressure monitors, watches, oximeters and bed sensors are published today with `unknown` features: the UI shows "Unknown" with no unit, and integrations have no stable mapping target.

## A. Categories and types

One category per physical quantity, whatever the device measuring it (rule 2): a heart rate is the same quantity whether a watch, a blood pressure monitor, a scale or a bed sensor reports it.

| Category                  | Types                                                                           | Units                   | Values                                     |
| ------------------------- | ------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------ |
| `body-composition-sensor` | `weight`, `fat-mass`, `fat-free-mass`, `muscle-mass`, `bone-mass`, `body-water` | `kilogram`, `pound`     | decimal, >= 0                              |
|                           | `body-fat-percentage`                                                           | `percent`               | decimal, 0-100, share of fat in the weight |
|                           | `visceral-fat-index`                                                            | none                    | decimal, >= 0, unitless index              |
| `blood-pressure-sensor`   | `systolic`, `diastolic`                                                         | `millimeter-of-mercury` | integer, >= 0                              |
| `heart-rate-sensor`       | `integer`                                                                       | `beats-per-minute`      | integer, >= 0                              |
| `blood-oxygen-sensor`     | `integer`                                                                       | `percent`               | integer, 0-100 (SpO2)                      |

- **Body composition** is what a scale reports: the body weight and its components. A plain scale publishes `weight` only; a bioimpedance scale adds the components it measures. An integration publishes the form its device natively reports: a device reporting both the fat mass and the fat percentage publishes both, a device reporting only one does not compute the other.
- **Blood pressure** is one reading made of two values; each is a feature. A pulse measured during the reading goes to `heart-rate-sensor`, not to this category (rule 5).
- **Heart rate** covers spot, continuous and averaged values (for instance the average heart rate of a night); the feature name tells them apart.
- None of these categories feeds a room aggregate: they describe a person, not a room.

## B. What stays elsewhere

| Quantity                  | Category                       | Why                                                       |
| ------------------------- | ------------------------------ | --------------------------------------------------------- |
| Body and skin temperature | `temperature-sensor` / `probe` | A temperature; `probe` already stays out of room averages |
| Sleep durations           | `duration`                     | A duration                                                |
| Steps, wake-ups           | `counter-sensor`               | A count                                                   |
| Pulse wave velocity       | `speed-sensor`                 | A speed                                                   |
| Presence in bed           | `presence-sensor` / `binary`   | A presence                                                |

## C. Non-goals for v1

- **Energy expenditure (kcal).** It needs its own category: `energy-sensor` is electrical energy, read by energy monitoring to compute consumption and cost.
- **Sleep score, vascular age.** Each vendor computes them with its own algorithm and scale: no shared definition yet (rule 1).
- **Activity history grouping.** The categories fall into the "other" group of `front/src/routes/history/categoryGroups.js` for now.

Adding a type or a category later is not breaking; these are left out until a second vendor shows a shared definition.

## D. Compliance with the taxonomy design rules

### D.1 Standards (rule 3)

Matter has no cluster for any of these quantities, and Zigbee 3.0 has none in the ZCL. Rule 3's "no standard covers the capability" case applies: the categories are designed from the quantity itself.

They are generic: the same quantities are exposed by many brands and several transports.

| Category                  | Devices reporting it (examples)                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `body-composition-sensor` | Withings Body scales, Xiaomi Mi Body Composition Scale, Eufy, Renpho, Tanita, Garmin Index (BLE / Wi-Fi / cloud) |
| `blood-pressure-sensor`   | Omron, Withings BPM, Beurer (BLE / cloud)                                                                        |
| `heart-rate-sensor`       | Watches and bands (Garmin, Fitbit, Withings ScanWatch), chest straps, bed sensors, BP monitors                   |
| `blood-oxygen-sensor`     | Fingertip and wrist oximeters (Wellue, Masimo), watches, Withings ScanWatch                                      |

The Bluetooth SIG profiles for these devices (Weight Scale, Body Composition, Blood Pressure, Heart Rate, Pulse Oximeter) draw the same boundaries. They are cited as evidence that the split is not one vendor's, not as a naming reference.

### D.2 Checklist

- [x] No brand, product or vendor name in category/type names or semantics.
- [x] No existing category covers these quantities (section B lists the ones that do and are reused).
- [x] One quantity, one category, whatever device measures it (heart rate from a watch, a scale or a BP monitor goes to `heart-rate-sensor`).
- [x] Types are intrinsic; other values a product reports go to their own categories (section B).
- [x] Matter and Zigbee checked: no model (D.1).
- [x] Generic: several brands and transports per category (D.1).
- [x] No enum types.
- [x] Naming: kebab-case, `*-sensor` suffix, English, no protocol name.
- [x] Stress-tested against neighboring devices (BP monitor pulse, bed sensor heart rate, plain scale without bioimpedance).
- [x] Inline scope comments on the constants.
- [x] Translations in all i18n files.
- [x] Units in `DEVICE_FEATURE_UNITS_BY_CATEGORY`, and per type in `DEVICE_FEATURE_UNITS_BY_CATEGORY_AND_TYPE` for `body-composition-sensor`.
- [x] MQTT defaults (read-only through the `*-sensor` suffix, units, min/max, preview values); history grouping deliberately left to "other" (C).
- [x] Constant-only change: the constants test covers the units mapping.
