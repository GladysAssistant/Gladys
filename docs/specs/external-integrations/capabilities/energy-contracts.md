> Part of the [external integrations living spec](../README.md) — the layout, the editing rules and the cross-repo map are there.

# `energy_contracts` capability: contract templates, tariff calendars and delegated pricing (design)

Goal: that an energy contract from any country can be published **entirely** as an external integration — its templates, the calendars that feed them (day colours, spot prices, critical peak days) and, when the core rule engine cannot express it, the cost computation itself — with no change to any Gladys repository. The core side (the contract object, the tariff definition grammar, the rule engine, the jobs, the REST API, the frontend and the migration) is specified in `docs/specs/energy-contracts.md`; this file owns everything the capability adds to the external-integration framework: its manifest field, its host API endpoints, its WebSocket messages, its trust boundary, its lifecycle and its SDK surface.

It is a **capability**, not a type (doctrine of `capabilities/provider-type.md`): a `device` integration (a connected meter that also knows its supplier's tariffs), a `provider` or a `weather` one may declare it. The core knows no integration by name: it discovers providers through the manifest stored in the database and through the proxy service in the `stateManager`, like the B.18 weather loop.

## 1. Manifest (C.1)

`energy_contracts` field (added to `CAPABILITY_MANIFEST_FIELDS`), shown on the install screen ("this integration can provide energy contracts and tariff calendars").

```json
{
  "energy_contracts": {
    "templates": [
      {
        "key": "hydro-quebec-d",
        "name": { "en": "Hydro-Québec Rate D", "fr": "Hydro-Québec tarif D" },
        "country": "CA",
        "currency": "CAD",
        "timezone": "America/Toronto",
        "pricing_mode": "rules",
        "version": "2026-04-01",
        "calendars": ["hq-critical-peaks"],
        "inputs": [ { "key": "subscribed_power", "type": "number", "unit": "kW" } ],
        "tariff": { "tariff_version": 1, "components": [ "…" ] }
      },
      {
        "key": "octopus-agile",
        "name": { "en": "Octopus Agile" },
        "country": "GB",
        "currency": "GBP",
        "timezone": "Europe/London",
        "pricing_mode": "delegated",
        "version": "1",
        "inputs": [ { "key": "region", "type": "select", "options": ["A", "B", "C"] } ]
      }
    ],
    "calendars": [
      { "key": "hq-critical-peaks", "granularity": "day", "values": ["normal", "critical-peak"], "timezone": "America/Toronto" }
    ]
  }
}
```

Rules: ≤ 20 templates and ≤ 10 calendars per integration; template `key` unique within the integration and never renamed once published (contracts store it in `template_key`); `tariff` required in `rules` mode, forbidden in `delegated` mode except its `fixed` components; `inputs` reuses the restricted `config_schema` grammar (`number`, `select`, `string`, never `secret`) and its values are substituted into the `tariff` through `{{input:<key>}}` or sent to the integration in delegated mode; a template referencing a calendar must declare it itself or reference a calendar published by another installed integration or by the catalogue (resolved at contract creation; a missing provider shows on the contract as a call to action and the `fallback` applies meanwhile; the core provides no calendar of its own, holidays included). A daily calendar may declare `day_starts_at` (`"HH:MM"`, `"00:00"` by default: the Tempo colour runs from 06:00 to 06:00). The `tariff` schema (`tariff.schema.json`, canonical owner `GladysAssistant/energy-contracts`) is validated by the store indexer and by `validateManifest`, both running the core semantic checks on top of the JSON Schema (`docs/specs/energy-contracts.md`, section 4).

**Calendar keys are global and owned.** A calendar key names one calendar per Gladys instance (`t_tariff_calendar`, core spec section 4): the first installed integration that declares it owns it (`provider_service_id`), with the granularity, timezone, `day_starts_at` and `values` of its declaration. A later integration declaring an already-owned key is installed (its templates work, they read the existing calendar) but its declaration is refused with an explicit warning on the install screen, and its writes to that key get `403`. A redeclaration by the owner with another granularity is refused (the entries would become unreadable); the other metadata follows the owner's latest manifest. Uninstalling the owner keeps the calendar, its metadata and its entries (contracts keep pricing on what was published, with the `fallback` beyond) and marks it `orphaned`; the next installed integration declaring the same key with the same granularity claims it. Keys never carry a provider prefix: a template written for `spot-fr` must work whichever integration feeds `spot-fr`, that is the point of a shared key.

## 2. Host API (C.3), integration → core

| Endpoint | Body | Rules |
| --- | --- | --- |
| `POST /api/integration/v1/energy/calendar` | `{ "calendar_key": "hq-critical-peaks", "entries": [ { "starts_at": "2026-01-12T05:00:00Z", "value": "critical-peak" } ] }` or `{ "calendar_key": "spot-gb-a", "entries": [ { "starts_at": "…", "price": 0.1823, "currency": "GBP" } ] }` | Upsert by `(calendar_key, starts_at)`; ≤ 2,000 entries per call, ≤ 20 MB; the key must be declared in the manifest of **this** integration (`403` otherwise); values within the declared enum (`400` otherwise); `starts_at` aligned on the granularity; accepted window: from − 5 years to + 7 days. Response `200 { "success": true, "count": n, "changed_from": "2026-01-12T05:00:00Z" }` |
| `GET /api/integration/v1/energy/calendar/:key?from=&to=` | | Read back its own calendar (resume after restart: know how far the core is fed) |
| `GET /api/integration/v1/energy/contract` | | The users' contracts referencing a template of this integration: `id`, `template_key`, `inputs`, `valid_from`, `valid_to`, `timezone`, `currency`, never the meter nor the consumption |

When a `POST /energy/calendar` changes a value already used by a computed cost (for instance a corrected Tempo colour or a final spot price replacing a provisional one), the core queues a `calculateCostFrom(changed_from)` recalculation restricted to the meters whose active contract references that calendar. The limit is 1 recalculation per calendar per 10 minutes; beyond it, updates are merged into the next recalculation.

## 3. WebSocket (C.4), core → integration

`external-integration.<domain>.<action>` convention, `command-result` ack:

| Message | Payload | Ack deadline | Role |
| --- | --- | --- | --- |
| `external-integration.energy-contract.price` | `{ message_id, contract: { id, template_key, inputs, currency, timezone, billing_period_start_day }, billing_period: { starts_at, ends_at }, cumulative_before: { day, month, billing_period }, intervals: [ { starts_at, kwh, max_power_kw } ] }` (≤ 1,488 intervals = 31 days, all in one billing period; `cumulative_before` = kWh of the meter before the first interval, per accumulation scope, computed by the core from the stored states) | 30 s | `delegated` mode: the integration returns `data.costs: [ { starts_at, cost, components?: { energy, tax } } ]`, one cost per requested interval, in the contract currency. A retry or a catch-up request carries the same state as a first request for the same intervals, so a tiered or monthly-total tariff gives the same answer |
| `external-integration.energy-contract.current` | `{ message_id, contract, billing_period, cumulative: { day, month, billing_period }, max_power_kw }` (the same state at the current instant, `max_power_kw` = peak of the last interval) | 5 s | Current price and next change for display and the scene trigger: `data: { price, unit: "kWh", valid_until, next_price }` |
| `external-integration.energy-calendar.refresh` | integration → core, no `message_id`, no ack | | "I have a new value" nudge: the core does nothing but trigger the bounded recalculation above; 1 per minute per integration, silently dropped beyond (B.17 doctrine, "trigger, not data") |

**The `energy-contract.price` payload is never trusted**: `normalizeEnergyCosts` checks that every requested `starts_at` has exactly one answer, that `cost` is a finite number, `≥ 0` and `≤ kwh × max_price_per_kwh` (configurable bound, 10 currency units per kWh by default), and that unrequested intervals are ignored. An invalid payload fails like a timeout: the affected intervals receive **no** cost state (never a silent zero), the error is visible in the integration supervision and in the job, and the next run of the job retries. In delegated mode, the `fixed` components of the `tariff` are still computed by the core (the subscription needs no code).

## 4. Provider discovery and lifecycle

- The core lists the available templates by merging: the community catalogue (`community`), the manifests of installed integrations declaring `energy_contracts` (`integration`), and the internal templates (`internal`: `edf-tempo` migrated into a template provided by the internal service). An integration template is offered even when the integration is stopped, with a notice.
- Integration **stopped or disconnected**: `rules` contracts keep being computed as long as the calendars are fed; a calendar without a value for an interval applies the component `fallback` and logs a warning (never an interval without a cost for a `rules` contract). `delegated` contracts accumulate unpriced intervals and catch up on return (the job restarts from the oldest interval without a cost, bounded to 31 days per run).
- Integration **uninstalled**: `provider_service_id` becomes `NULL`, the contract stays and switches to `rules` mode with the stored `tariff` (a copy taken at import, not a reference); a `delegated` contract becomes `orphaned`, visible in the UI with a call to action.
- **Integration update** with a new template `version`: the contract is never modified silently; the UI offers "update the tariff from the template", which creates a new contract from a chosen date and closes the old one (the same gesture as a contract change).

## 5. JS SDK (C.8)

`gladys.energy.publishCalendar(key, entries)`, `gladys.energy.getCalendar(key, { from, to })`, `gladys.energy.getContracts()`, `gladys.energy.requestRecalculation()`; handlers `gladys.energy.onPrice(async ({ contract, billing_period, cumulative_before, intervals }) => costs)` and `gladys.energy.onCurrent(async ({ contract, billing_period, cumulative, max_power_kw }) => current)`: the SDK forwards the whole WebSocket payload of §3, field for field, so the state the core sends (billing period, accumulations, last peak) reaches the handler. The Node.js template gets an `energy-contracts` example with a `rules` template and a calendar.

## 6. Publishing a contract entirely as an external integration

Yes: a contract can live end to end in an external integration, with no PR on `energy-contracts` nor on Gladys. The two publishing paths split on one criterion, **does the contract need code or live data?**

| Path | When | What the author ships | What the user does |
| --- | --- | --- | --- |
| **Community catalogue** (`energy-contracts`) | The tariff is static and fully expressible by the rule engine; any calendar it needs is static too and shipped by the catalogue v2 as dated entries (a country's public holidays) or already published by an installed integration, never by the core | One PR adding a `tariff` JSON; the next release of the repository makes it appear in every Gladys, no Gladys release | Picks it in the wizard, fills the `inputs` |
| **External integration** | Anything else: a calendar to keep fed (day colours, spot prices, critical peak days), a delegated computation, a supplier API to poll, or simply a supplier who wants to own and version their own templates | A store integration (public repo + topic + manifest) whose `energy_contracts` field carries the templates and calendars (§1), plus the container code for the calendars or the delegated pricing | Installs the integration; its templates appear in the wizard next to the catalogue ones, tagged with the integration name |

A running integration may also carry **static templates only** (a connected-meter integration that knows its supplier's tariffs): the `templates` field is enough, nothing else to implement. The reverse is not true: the catalogue never carries code, so a contract that needs a live calendar has to be an integration (or reference a calendar published by an installed one); static calendars (a country's public holidays for the coming years) can ship in the catalogue v2 as dated entries.

**PR #3099** (`energy-calendar` integration type and `day-type` contract) answers the same field need (forum topic 10704) with a dedicated type and a widening of `t_energy_price.day_type`; it must not land as a second energy contract model. Its provider API maps onto the calendar publication above (`POST /api/integration/v1/energy/calendar` with a daily `values` enum), its `day-type` contract onto a `calendar` condition of the tariff grammar, and its provider loop is replaced by calendar ownership; the topic's use cases (EDF Zen Week-End, Engie Elec Week-end) are the `weekdays` + `calendar` rows of the core spec's section 6.

What the integration author never touches: the pricing engine, the cost states, the widgets, the aggregation API. Their templates, calendars and delegated costs enter through the validated paths of §1 to §3 and are computed and displayed exactly like a catalogue contract.

## 7. Tests

- **Manifest** (`validateManifest`): limits (templates, calendars), unique keys, `tariff` required in `rules` and forbidden in `delegated` (except `fixed`), `inputs` grammar, calendar references resolved or explicitly external; the vendored `manifest.schema.json` carries the field.
- **Host API**: `403` on an undeclared calendar key, `400` on a value outside the declared enum or a `starts_at` off the granularity or outside the window, batch and payload limits, `changed_from` computed from the earliest changed entry, recalculation queued and rate-limited.
- **WebSocket**: `normalizeEnergyCosts` (missing interval, duplicate, negative or non-finite cost, cost above the bound, unrequested intervals ignored), ack timeout → no state written, `refresh` nudge rate-limited and accepted only from integrations declaring the capability.
- **Lifecycle**: stop → `rules` contracts keep computing; uninstall → `provider_service_id` nulled, `delegated` contract `orphaned`; update with a new template version → no silent change.

## 8. Verification (manual e2e, environment with the Docker socket)

Dev-install the Octopus pilot (`rules` Economy 7 template + 30-min Agile calendar) → the install screen shows the capability disclosure → create an Economy 7 contract from the wizard, preview over the last 7 days, save → the 30-min job prices the intervals with the engine → create a delegated Agile contract → stop the integration for 2 h → restart it → the catch-up prices the missing intervals with neither gap nor duplicate → uninstall → the Economy 7 contract stays computed, the Agile contract shows as orphaned.
