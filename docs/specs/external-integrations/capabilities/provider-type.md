> Part of the [external integrations living spec](../README.md) — the layout, the editing rules and the cross-repo map are there.

# `provider` type: integrations made only of capabilities (design)

Goal: a technical `type` for an integration that **manages no device and implements none of the core-consumed interfaces** of the other types — its whole contract is the set of **capability fields** it declares in its manifest. The first such capability is the dashboard widget (`capabilities/dashboard-widgets.md`, the TMDB "upcoming releases" pilot, a fuel-price widget…); the next ones are the scene triggers and actions workstream. Each capability is its own file in `capabilities/`; this file owns the type — its screens, its catalog visibility, its manifest rule and the bar for any future type — so a new capability adds its field to the list below without touching a widget spec, and vice versa.

## Decision and rationale (maintainer, PR #3109)

- **`type` names the primary contract**: the interface the core itself consumes — devices and states for `device`, `message.sendToUser` for `communication`, the `weather.get` provider loop for `weather`. Those three types keep their full meaning: they classify integrations by what they *are* for Gladys, and each may declare capability fields on top (a `device` vacuum with a widget, a `weather` provider with a richer forecast panel).
- **An integration with no primary interface needs a home.** Two drafts were rejected: `type: "device"` with Devices/Discovery screens that can never fill (a declaration that lies to the user, and a device host-API surface the integration has no business with), and a `widget` type (a type named after one capability breaks on the first integration combining two — a widget *and* a scene trigger, no device). The type must name the **shape** (capabilities, no devices), not a capability: **`provider`**.
- **The rule this fixes for good**: a new contract that the core does not consume through a dedicated interface is a **capability field usable by every type, never a type**. The bar for a fifth type is the one `weather` passed: a generic pivot interface the core itself consumes (dashboard, assistant, scenes), never a domain.
- **Naming, recorded**: the word "provider" already appears in B.18 ("weather *provider*", `GET /api/v1/weather/provider`, the "provider loop"). The technical value `"provider"` is unrelated to that wording: a `type: "provider"` manifest never joins the `weather.get` loop (only `type: "weather"` does, section 1 of B.18), the indexer and the server enforce it, and the install screen says what the integration provides. Renaming a technical type after the first store manifests exist is the costly mistake (the `device-feature-categories.md` rule 7 doctrine), so the name is fixed here, once.

## Manifest (C.1)

`type` gains the value **`"provider"`** (enum of the canonical `manifest.schema.json` and of `validateManifest`). A `provider` manifest **must declare at least one capability field** — a provider providing nothing is rejected with an explicit error (`type: a provider integration must declare at least one capability field (…)`). The capability fields, each specified in its own `capabilities/` file:

| Field | Capability file |
|---|---|
| `widgets` | `capabilities/dashboard-widgets.md` |
| `scene_triggers` | `capabilities/scene-triggers-and-actions.md` |
| `scene_actions` | `capabilities/scene-triggers-and-actions.md` |
| `energy_contracts` | `capabilities/energy-contracts.md` (contract templates, tariff calendars, delegated pricing) |

The list grows with the folder; `CAPABILITY_MANIFEST_FIELDS` in `server/lib/external-integration/constants.js` is its code mirror. Every other manifest field keeps its own rules whatever the type (`config_schema`, `actions`, `containers`, `webhooks`…).

## What the type implies

All by transposition of what `communication` and `weather` already do:

- **screens**: Configuration / Supervision / Logs only — `provider` joins the two types without device screens in the generic page (`hasDeviceScreens`, the shared `TYPES_WITHOUT_DEVICE_SCREENS` list of the frontend); like them, its catalog card and its direct URLs land on the configuration screen of the shared external integration page (`/dashboard/integration/device/external/:selector/config`);
- **no device surface**: it never goes through discovered devices or states (the device screens do not exist for it; a per-type `403` on the device host API is a later hardening common to the three device-less types, not part of this file);
- **catalog**: hidden from non-admins like `device` and `weather` (installing is an admin act; what the integration provides reaches the users through the capability's own surface — for widgets, the dashboard picker and the widget list route); browse placement comes from `categories` (`integration-catalog-categories.md` §2.2), the display axis decoupled from `type`;
- **install screen**: an information line saying the integration manages no device and provides its capabilities, plus the disclosure line of each declared capability (for `widgets`: the list of widgets; for `scene_triggers` / `scene_actions`: the list of declared triggers and actions; for `energy_contracts`: the list of contract templates and the calendars the integration feeds, with a warning when a template delegates its pricing to the integration) — the whole of its contract description;
- **proxy service**: registered in the stateManager like every integration, with no `device.*`, `message.*` or `weather.*` capability attached — only what its declared capabilities add.

## Tests

- **Manifest** (`validateManifest`): `type: "provider"` accepted with a capability field, rejected without any (explicit error naming the accepted fields); the vendored `manifest.schema.json` carries the enum value and the `if type = provider then required widgets` rule.
- **Frontend**: a `provider` integration page shows Configuration / Supervision / Logs only, its card lands on the configuration screen, it is hidden from the non-admin catalog, its install screen shows the provider information line.

## Verification (manual e2e, environment with the Docker socket)

Dev-install a `type: "provider"` manifest declaring one capability (a content-only dashboard widget, the cinema `card-list` of the pilot) → the install screen shows the provider line and the capability disclosure → the integration page shows Configuration / Supervision / Logs and no Devices / Discovery screen → as a non-admin, the integration is absent from the catalog while what it provides (the widget tile) is reachable → dev-install the same manifest with its `widgets` field removed: rejected with the explicit error.

## Later leads

- A per-type `403` on the device host API for the three device-less types (`communication`, `weather`, `provider`).
- The scene triggers and actions capability, the first field to join the table above.
