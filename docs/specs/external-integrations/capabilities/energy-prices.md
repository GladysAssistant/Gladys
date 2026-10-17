> Part of the [external integrations living spec](../README.md) — the layout, the editing rules and the cross-repo map are there.

# `energy_prices` capability: reading the energy price that applies to the integration's own devices (design)

Goal: that an integration can value the energy one of its devices consumes, stores or shifts with the **user's real contract** (base, peak / off-peak, Tempo, spot, tiers…) instead of asking the user to type their tariffs a second time. First consumer: home batteries (Zendure), which charge when the kWh is cheap and discharge when it is expensive, and want to show the savings. The pricing itself is the core's: the contract object, the tariff grammar and the rule engine are specified in `docs/specs/energy-contracts.md`, the meter a device is on in `docs/specs/energy-hierarchy.md`. This file owns what the capability adds to the external-integration framework: its manifest field, its host API endpoint, its privacy boundary, its SDK surface, its frontend and its tests.

It is a **read** of the core's pricing, distinct from the `energy_contracts` capability (`capabilities/energy-contracts.md`), which *publishes* contract templates, calendars and delegated costs: an integration may declare either, both or none. It is not a capability field in the sense of `capabilities/provider-type.md` (it is not in `CAPABILITY_MANIFEST_FIELDS`): it reads the price of the integration's **own devices**, so a `provider` integration, which has none, has nothing to read with it.

## 1. Manifest (C.1)

Top-level boolean **`energy_prices`** (optional, `false` when absent), validated by `validateManifest` (`energy_prices: must be a boolean`, `422`) and declared in the vendored `manifest.schema.json`:

```json
{ "energy_prices": true }
```

The user's tariff is personal data (it says which contract they have, and a tiered price moves with their consumption): the request follows the authorization-contract pattern of `location` (`contracts/host-api-endpoints.md`, `GET /house`) — **shown on the install screen** (an info block "This integration requests read access to the price per kWh of your electricity contract (energy only) for its own devices", `integration.externalIntegration.install.energyPricesText`, en / fr / de / es) and **enforced server-side**: only an explicit `true` opens the endpoint, anything else gets a `403`. The gate reads the stored manifest, so it has the "declaration re-read at each update" limit stated for `location`. Like every manifest field the older cores do not know, declaring it requires a `gladys_version` minimum at or above the first release shipping it (older validators reject unknown fields); the canonical schema of `GladysAssistant/integration-store` carries the field so the indexer accepts it.

## 2. Host API (C.3), integration → core

**`GET /api/integration/v1/energy/price?device_external_id=ext:zendure:battery-1&from=2026-01-12T00:00:00Z&to=2026-01-13T00:00:00Z`** → `200`

```json
{
  "currency": "EUR",
  "slots": [
    { "starts_at": "2026-01-12T00:00:00.000Z", "ends_at": "2026-01-12T00:30:00.000Z", "price": 0.1296, "label": "Blue off-peak" },
    { "starts_at": "2026-01-12T05:00:00.000Z", "ends_at": "2026-01-12T05:30:00.000Z", "price": 0.7562, "label": "Red peak" },
    { "starts_at": "2026-01-13T00:00:00.000Z", "ends_at": "2026-01-13T00:30:00.000Z", "price": null }
  ]
}
```

(`externalIntegration.getEnergyPrices` → `energyContract.getDeviceElectricMeterId` + `energyContract.getMeterPrices`.)

- **Query.** `device_external_id` (non-empty string), `from` and `to` (ISO 8601 instants) are all required. `to` after `from`, a window of **at most 7 days**, `from` at most **one year ago**, `to` at most **48 hours ahead** (the horizon of the current price scan, core spec §7.7, and of the day-ahead markets: a calendar is never published further than 7 days ahead, and a future price is only as good as what the providers have published). `400` otherwise.
- **The device must be the integration's own**: a device created by the user whose `service_id` is the calling integration (`deviceByExternalId`), `404 DEVICE_NOT_FOUND` otherwise — a device of another integration is reported exactly like an unknown one, never as a `403`, so its existence does not leak (the `POST /camera/image` convention).
- **The root electric meter** (`energyContract.getDeviceElectricMeterId`, `docs/specs/energy-hierarchy.md` section B): the root reached by walking up the parents (`getRootElectricMeterDevice`) of the first **attachment feature** of the device that resolves — the meter the user put it on, directly or through a sub-meter, or the device itself when it is a meter. A device with **no energy source feature at all** (a home battery publishing only powers and `battery-storage` indexes, which never enter the hierarchy) can never be attached to a meter: it is on the **main meter**, the meter of the most recently created consumption contract, the same default the core attaches new energy devices to. `404 DEVICE_NOT_ON_ELECTRIC_METER` when the hierarchy does not resolve (a missing parent, a cycle) or when the device has no energy source feature and the instance has no consumption contract.
- **The active contract, slot by slot** (`energyContract.getMeterPrices`): the consumption contracts of that meter (a production contract never prices it); `404 ELECTRIC_METER_HAS_NO_CONTRACT` when it has none — an unattached device, its own root, lands here, consistently with "an unattached device is simply not priced" (energy hierarchy, D.1). Each slot is priced by the contract active at its start, the one whose `valid_from` / `valid_to` contain the slot's local date in that contract's timezone, exactly as the cost job attributes an interval (core spec §7): a contract change inside the window is followed, and a slot that no contract covers has `price: null`.
- **Slots.** One slot per **30 minutes of the local clock of the active contract** (`:15` / `:45` UTC in a `:45` zone such as Asia/Kathmandu), **15 minutes** when its tariff reads a `fifteen_minutes` calendar (core spec §7.1); the first slot is the one containing `from`, the last one ends at or after `to`. A clock-change day has 46 or 50 slots of 30 minutes. `ends_at` is always given (the slot length can change with the contract inside a window).
- **Price.** The price per kWh **of the energy only**: the sum of the matching consumption rules of the tariff plus the taxes that apply to them, rounded like the engine (6 decimals) — the price `getUnitPriceAt` gives the current price (core spec §7.7), evaluated at the start of each slot. Fixed charges (subscription) and demand charges are not per kWh and are never in it. `label` is the label of the matching rule of the first consumption component that has one (absent otherwise, and absent on a `null` price). The details of the evaluation:
  - a **tier** rule is evaluated with the **real accumulations** of the meter: those stored before the slot where the contract starts in the window (`getMeterCumulative`, the filtered `counts_when` counters included), then advanced slot after slot by the meter's stored 30-minute consumption (half of an interval per 15-minute slot), and reset at each day, month and billing period boundary as the engine does; a future slot carries the accumulation of the last stored interval. The price is the price of the **next** kWh, the one an integration shifting energy displaces;
  - a **`power_threshold`** rule is evaluated at 0 kW: no peak is known for a slot of the window, and the integration asks for the price of energy, not for a demand penalty;
  - a calendar price that is missing yields the component `fallback`, as in the cost job; when the fallback has no value either, the price is **`null`** ("unknown"), never a guess;
  - the response has a single **`currency`**, the currency of the meter's most recent contract; a slot priced by a contract in another currency is `null` (nothing the caller could add up).
- **Delegated contracts.** A `delegated` contract is priced by its integration, through `energy-contract.price` on real intervals or `energy-contract.current` at the current instant (`capabilities/energy-contracts.md` §3): the core cannot price an arbitrary instant of it. Its slots are therefore `null`, except, when it is the contract active **now** and the window has not ended, the slot containing now and the following slots ending at or before the `valid_until` the integration answered: they carry the current price (`energyContract.getCurrent`, the same request and the same 5-minute cache as the widget). The delegated integration unreachable or answering an invalid payload → those slots are `null` too (a warning is logged), never an error of the read. The delegated integration is never asked for a window in the past or for a contract that is not active now.
- **What never leaves the core**: the meter (its id, its name, its features), its consumption, the contract (id, name, selector, template, inputs, validity) and the components breakdown. The prices of a tiered tariff move with the consumption by construction; that is the price the user pays, and what the authorization covers.
- **Rate limit**: 30 reads per minute per integration (fixed one-minute window in memory, the `POST /state` mechanics), `429 RATE_LIMIT_EXCEEDED` beyond, counted once the `energy_prices` gate is passed. A read costs a few database queries (the contracts, the calendars of the window, and for a tiered tariff the accumulations and the stored consumption); nothing is cached on the core side: a price changes at most every 15 minutes, the integration reads a window and keeps it.

Errors: `403` (no `energy_prices: true`), `400` (query), `404` with the `message` `DEVICE_NOT_FOUND`, `DEVICE_NOT_ON_ELECTRIC_METER` or `ELECTRIC_METER_HAS_NO_CONTRACT`, `429`; the standard error format of `contracts/conventions.md`. The typical use: read the next 24 to 48 hours once an hour (or when a day-ahead calendar is published) to plan the charge, and read the past day once to value what was shifted.

## 3. JS SDK (C.8)

`gladys.energy.getPrices(deviceExternalId, { from, to })` → `{ currency, slots }` (`GET /energy/price`; `from` and `to` as `Date` or ISO strings). The SDK keeps the scope and the errors of §2 (it adds no cache and no retry on a `404`), and documents the `energy_prices: true` declaration next to the method; the Node.js template mentions it in its manifest documentation. Implemented in `GladysAssistant/integration-sdk-js`, which depends only on this contract.

## 4. Frontend

The install screen (`front/src/routes/integration/all/external-integration/install-page/index.js`) shows the request as an info block next to the `location` one when the manifest declares `energy_prices: true`; nothing else in the UI changes (the user manages their contracts and the meter of each device as before, in the energy monitoring screens).

## 5. Tests

- **Manifest** (`validateManifest`): `energy_prices: true` accepted, a non-boolean rejected.
- **Host API** (`externalIntegration.getEnergyPrices`, `integrationHost.energy.test.js`): `403` without the declaration, with `false`, with the string `"true"` and without a manifest; `400` on each invalid query (missing device, invalid dates, `to` not after `from`, window over 7 days, `from` over a year ago, `to` over 48 hours ahead); `404 DEVICE_NOT_FOUND` on an unknown device and on another integration's device, `404 DEVICE_NOT_ON_ELECTRIC_METER`; the rate limit per integration and its reset; the route registered with the integration authentication only.
- **Meter resolution** (`getDeviceElectricMeterId`): a device attached to a meter, the meter itself, an unattached device (its own root), a broken hierarchy (`null`), a device without energy source feature on the main meter (never a production meter), no contract at all (`null`).
- **Pricing** (`getMeterPrices`): 30-minute slots with the taxes and without the subscription, a window starting mid-slot, slots on the local clock of a `:45` zone, the 46 slots of the spring clock change with the local time ranges, a contract change inside the window with a gap priced `null`, a contract in another currency `null`, a Tempo calendar with its 06:00 day start, 15-minute slots of a spot calendar with an unpublished quarter `null`, a tiered tariff on the real accumulations (crossing the allowance inside the window, reset at midnight), a `counts_when` counter fed only by the matching slots, half an interval per 15-minute slot, the delegated current slot and its `valid_until`, a delegated integration failing, no delegated request for a past window or a contract not active now, a meter without consumption contract.

## 6. Verification (manual e2e)

Create an EDF Tempo contract on the main meter (with the `edf-tempo` calendar fed) → dev-install an integration declaring `energy_prices: true` → the install screen shows the request → the integration publishes a battery device without energy feature, the user creates it → `GET /energy/price` for the next 24 hours returns 48 slots with the blue / white / red prices and their labels → the same read from an integration without the declaration gets a `403`, for another integration's device a `404` → a device of the integration publishing an energy index, left unattached by the user, gets `404 ELECTRIC_METER_HAS_NO_CONTRACT` → attached to the main meter from the "My devices" page, it gets the Tempo prices.
