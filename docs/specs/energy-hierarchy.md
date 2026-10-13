# Energy hierarchy (`energy_parent_id`)

> **Living specification — source of truth.** This document specifies how the energy features of
> the devices are linked together (`t_device_feature.energy_parent_id`), who maintains those links
> and what the user can still choose. **Rule: any PR that changes one of these behaviors or
> contracts modifies this file in the same diff.**
>
> Status: **implemented**.

## A. Context

`energy_parent_id` is a self-referencing link between device features (FK `ON DELETE SET NULL`).
It carries two things that have nothing in common:

1. **Derived links**, on one device: a cumulative index → the 30-minute consumption the core
   computes from its deltas → the cost of that consumption (and the same for a consumption an
   integration feeds itself → its cost). They are purely structural: the 30-minute job finds the
   consumption of an index only through this link (`calculateEnergyFromIndex`), and the cost job
   finds the cost of a consumption only through it (`findConsumptionCostPairs`). Changing one of
   them silently stops the computation.
2. **The attachment of a device to a meter**, across devices: a smart plug, a sub-meter or any
   energy device hangs under the meter of the household. It has one purpose only: walking up the
   links (`getRootElectricMeterDevice`) gives the **root meter**, whose contract prices the
   device (`docs/specs/energy-contracts.md`). Nothing aggregates the consumption of the children,
   avoids a double count or computes an "unmeasured" share: attaching a plug under a sub-meter
   or directly under the main meter gives the same costs.

Until this specification, the "My devices" page of the energy monitoring integration let the user
pick any parent for any feature, derived links included, and offered a "Fix" button for the
circular dependencies that flattened the whole tree (every feature of a cycle, and every feature
whose ancestors loop, became a root: the costs stopped for the whole house). The cycles themselves
came from the core: the "main meter feature" every new device is attached to was the first
`energy-sensor` feature of the meter device, which could be a feature derived from the meter's own
index, or the very feature being attached (a supplier meter published by an external integration
is the meter itself). And a contract created on a second meter (a cabin, a second home) was
silently ignored as soon as a discovery attached that meter under the main one.

Decision (maintainer, October 2026): the hierarchy is **maintained by the core**. The user no
longer edits links; the only choice left to them is **which meter a device is on**, and only when
the installation has several meters.

## B. Definitions

- **Energy source feature**: a feature that measures energy by itself — a cumulative index
  (`ENERGY_INDEX_FEATURE_TYPES`: `energy-sensor`/`index`, `energy-sensor`/`energy`,
  `switch`/`energy`, `teleinformation`/`east`, `easf01`…`easf10`) or a consumption
  (`energy-sensor`/`thirty-minutes-consumption`, `energy-sensor`/`daily-consumption`).
  Production features (`energy-production-sensor`) are out of this specification.
- **Rank**: index 3, consumption 2, cost (`thirty-minutes-consumption-cost`,
  `daily-consumption-cost`) 1, anything else 0. A derived link always goes from a lower rank to a
  higher or equal one (cost → consumption → index; Enedis: 30-minute load curve → daily
  consumption).
- **Derived link**: a link whose child and parent are on the **same device**.
- **Attachment link**: a link whose child and parent are on **different devices**.
- **Attachment features of a device**: its energy source features that are not the child of a
  derived link (parent `null` or on another device). They are what attaches the device to a
  meter.
- **Electric meter**: a device that is the `electric_meter_device_id` of at least one contract
  **of direction `consumption`**. A device with only production contracts is not a meter for this
  specification.
- **Root feature of a meter** (`energyContract.getMeterRootFeatureId(meterDeviceId)`): among the
  attachment features of the meter device, the first index (in the order of
  `ENERGY_INDEX_FEATURE_TYPES`, so `east` before `easf01`), else the first consumption; `null`
  when the device has none. This is the feature devices are attached to.
- **Main meter feature** (`getDefaultElectricMeterFeatureId`, unchanged signature): the root
  feature of the meter of the most recently created consumption contract (a production contract
  never makes a solar meter the main meter). It never returns a derived feature.

## C. Invariants

The core guarantees, on every write path:

1. **No cycle, no self-reference.** A write that would close a cycle is refused (user API) or cut
   (device save). The link cut is the one whose child has the highest rank among the links of the
   cycle that go "up" (rank of the child ≥ rank of the parent): in a cycle index → consumption →
   index, the index loses its parent, the derived consumption keeps its link.
2. **An electric meter is a root.** Its attachment features have no parent: a contract on a
   device is the reason the device is priced, it is never silently overridden by another meter.
3. **Derived links are not the user's.** The user API never changes the parent of the child of a
   derived link, and never creates a derived link.

### C.1 Device save (`device.create`, every integration, every "Update" from a discovery)

After the parents of the payload are resolved (an unknown parent is dropped, as before):

- every feature of the device with a parent is checked for a cycle by walking up its ancestors in
  the database (same transaction); a cycle is cut per invariant 1 (only links of this device are
  cut), with a warning in the logs;
- when the device is an electric meter, the attachment features of the payload that received a
  parent on another device are reset to `null` (invariant 2), with a warning. This is what keeps a
  second meter a root when a discovery falls back on the main meter feature.

The derivations of the integrations (`addEnergyFeatures`, `addConsumptionCostFeatures`, the MQTT
"create energy features" button, Enedis) are unchanged: the save enforces the invariants whatever
they send.

### C.2 Contract creation and update

When a contract of direction `consumption` is created or updated, the attachment features of its
meter are detached (parent `null`) **before the contract row is written** (a detach that fails
leaves no half-created contract a retry would conflict with), so the recalculation prices the
meter with its own contract. When the update moves the contract to another meter
(`electric_meter_device_id` changes), a recalculation is requested even if no pricing field
changed, for the former and the new meter (`electric_meter_device_ids: [old, new]`): the new meter
and what hangs under it are priced by this contract from now on, the former one no longer is.

### C.3 Repair at start-up (`energyContract.repairHierarchy`, called by `energyContract.init`)

Installations broken before this specification are repaired once per start, idempotently (nothing
is written when the hierarchy is sound), each change logged:

1. electric meters are made roots per invariant 2, **before** the cycles are cut: in a cycle across
   a meter and a plug of equal ranks, the meter's link is the one to go and the plug stays
   attached. A meter whose energy source features all hang off one another on its own device
   (left by the former free editor, without closing a cycle) has nothing to attach the devices
   to: its best index (else consumption, the order of the root feature) becomes its root;
2. cycles and self-references are cut per invariant 1;
3. derived links lost to the former "Fix" button are restored on the same device, only for a
   feature without a parent:
   - a 30-minute consumption whose `external_id` is `<index external_id>_consumption` gets that
     index back as parent;
   - a cost feature whose `external_id` is `<x>_cost` gets back the consumption of the same
     duration whose `external_id` is `<x>_consumption`, else `<x>`; failing that, the only
     consumption of the same duration on the device.

The repair requests no cost recalculation (the energy-monitoring service is not started yet at
that point): the costs of the repaired period can be recomputed from the energy monitoring
settings ("Calculate cost from beginning").

## D. User API

### D.1 `PATCH /api/v1/device/:device_selector/electric_meter` (new)

Body `{ "electric_meter_device_id": "<meter device id>" }` → `200` with the updated device.
`energyContract.setDeviceElectricMeter(deviceSelector, meterDeviceId)`:

- `404` when the device or the meter does not exist (`DEVICE_NOT_FOUND`,
  `ELECTRIC_METER_DEVICE_NOT_FOUND`);
- `400` when the target is the device itself (`ELECTRIC_METER_IS_THE_DEVICE`), is not an electric
  meter (`ELECTRIC_METER_HAS_NO_CONTRACT`) or has no energy source feature to attach to
  (`ELECTRIC_METER_HAS_NO_ENERGY_FEATURE`), when the device is an electric meter itself
  (`DEVICE_IS_AN_ELECTRIC_METER`, invariant 2), or when it has no attachment feature
  (`DEVICE_HAS_NO_ENERGY_FEATURE`);
- admin only, like the contracts;
- every attachment feature of the device gets the root feature of the meter as parent;
- when a parent changed, the costs of this device **and of the devices hanging under it** (a
  sub-meter moved with its plugs: their root meter changed too) are recomputed from the earliest
  `valid_from` of the meter's contracts (`energy-contract.recalculate` with `device_ids`, the
  energy-monitoring service restricting `calculateCostFrom` to those devices; the work is
  proportional to the states read, a window before a device's first state reads nothing);
  attaching a device to the meter it is already on writes and recomputes nothing.

There is no "detach": a device always belongs to a meter once attached, an unattached device is
simply not priced.

### D.2 `PATCH /api/v1/device_feature/:selector` (kept, restricted)

Still accepts `energy_parent_id` only, now refused with `400` when the feature is not an energy
source feature, when it is the child of a derived link, when the new parent is on the same device
(a derived link), when the device is an electric meter and the new parent is not `null`, or when
the new parent would close a cycle (as before).

## E. Front: the "My devices" page

`/dashboard/integration/device/energy-monitoring` becomes a read-only view of the meters:

- one card per electric meter, listing the devices whose root is that meter (directly or through
  a sub-meter), with their energy features;
- a card "Not attached to a meter" for the devices with an attachment feature and no meter;
- for every device that is not a meter, when the installation has at least one electric meter, a
  "Meter" select listing the electric meters (`D.1`); with a single meter the select still shows
  it, so an unattached device can be attached in one click;
- no contract at all: a message pointing to the contracts tab;
- the free parent selects, the circular dependency banner and the "Fix" button are removed.

## F. Integrations

- Zigbee2mqtt, Tasmota, MQTT, Enedis and the external integrations keep their derivation.
- **Matter** derives the energy features of a published cumulative index at discovery (the
  paired devices of `GET /api/v1/service/matter/paired-device`), like Zigbee2mqtt: the features
  already in Gladys keep their id and their parent — **a root included**: `addEnergyFeatures`
  only knows "no parent" and would otherwise propose the main meter for a second meter or a
  device the user left unattached — the derived features already in Gladys are re-injected while
  their index is still published, then `addEnergyFeatures` adds what is missing (a new device
  falls back on the main meter). When a re-paired device replaces an existing one (new node id),
  the server cannot see the existing device: the front gives every matched feature the id and the
  parent of the existing one (the meter the user chose, or a root), and remaps the parents of the
  newly derived features onto those ids.
- The `<index>_consumption` / `<index>_cost` naming is owned by `addEnergyFeatures.js`
  (`DERIVED_CONSUMPTION_SUFFIX`, `DERIVED_COST_SUFFIX`, with `CONSUMPTION_COST_TYPES`): the repair
  and Matter import it.
- The other internal integrations publishing an index without derivation (Tuya, Xiaomi, Z-Wave JS
  UI, Broadlink) are deprecated in favour of external integrations and are not changed.

## G. Tests

- Pure helpers: ranks, roles, cycle cut (self-reference, index ↔ consumption, cycle across two
  devices).
- `device.create`: a payload closing a cycle is cut on the right link; a meter's index sent with
  a parent on another device is saved as a root; a non-meter keeps its attachment.
- `PATCH /device_feature`: each refusal of D.2.
- `setDeviceElectricMeter`: each refusal of D.1, attachment of every attachment feature, the
  recalculation event with `device_ids`.
- `getMeterRootFeatureId` / `getDefaultElectricMeterFeatureId`: index preferred to a derived
  consumption, `east` preferred to `easf01`, a consumption fed by an integration accepted.
- Contracts: creation and meter change detach the meter.
- `repairHierarchy`: cycle cut, meter made root, derived links restored by name and by
  uniqueness, nothing written on a sound hierarchy.
- Matter: derived features added, ids and parents of existing features kept, derived features
  re-injected, no bogus selector.
- Front: Cypress spec of the page (meters, unattached devices, meter select).
