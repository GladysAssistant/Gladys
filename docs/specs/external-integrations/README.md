# External integrations in Gladys Assistant

> **Living specification — source of truth.** This spec describes the behavior of external integrations and the contracts binding the monorepo to the ecosystem repos (section C: manifest, host API, WS protocol, store formats). Phase 1 is implemented, and the phase 2 workstreams of sections B.15–B.18 (communication type, mediated network discovery, inbound webhooks, weather type) have shipped since. **Rule: any PR that changes an external-integration behavior or contract modifies this spec in the same diff** — spec first, code second. Field feedback (pilot ports, forum) is captured here before being coded.
>
> The spec is split into **one file per section** (this folder). Section identifiers (`A`, `B.1`…`B.20`, `C.1`…`C.8`) are stable and are what the other specs, the code comments and the ecosystem repos refer to: a file's heading keeps its identifier, and the map below tells which file holds which section.

## Context

Community RFC (topic 10343): open Gladys to integrations developed and published by anyone, installable in one click, without maintainer review — without sacrificing stability. Four non-negotiable requirements: (1) a crashing integration never crashes Gladys, (2) no zombie state (state always visible and actionable in the UI), (3) consistent UI with no code injected by integrations, (4) zero technical fiddling for the user.

Scoping decisions validated with the maintainer:
- **Scope**: overall architecture + executable detail of **phase 1** (host API + Docker supervisor + PoC + **store**).
- **Decentralized, zero-approval store**: the source of truth is the GitHub topic `gladys-assistant-integration` (publishing = tagging your public repo); a 100% automatic indexer (public GitHub Action) mechanically validates manifests and publishes a static `index.json` that Gladys instances consume. The maintainer approves nothing and is never a bottleneck. Docker images on **any public registry**; **no moderation in v1** (the Docker sandbox is the defense — assumed and documented).
- **Core→integration return channel**: outbound WebSocket from the integration (no HTTP server in the container).
- **SDK v1**: REST/WS host API documented and open to all languages; official SDK + template in Node.js only.
- **No device creation by the integration**: it publishes discovered devices, the user creates/edits/deletes from the interface (the internal-integration pattern).
- **Merged data model**: no dedicated table — an external integration **is** a `t_service` row (`type` column), to avoid any dual identity to keep in sync.
- **Auth via stateless integration JWT**: not tied to a user, outside `t_session` (reserved for user sessions), regenerated on every container recreation.
- **Frontend on par with internal integrations**: presence in the integration catalog with a simple "external" badge, then a generic 3-screen page — Devices / Discovery / Configuration (form defined in JSON by the integration). A single integration type in v1: "Devices".
- **Multi-container integrations**: some integrations need additional containers (the Frigate case: Frigate container + Mosquitto broker, with a web UI reachable on the LAN and access to the Coral). The manifest **declares** what may run — images, limits, published ports, hardware access — and that is what the user approves at install time; the integration **then drives the lifecycle via the host API** (create/start/stop/restart, only within the declared bounds). Data confined to the integration's folder, full deletion at uninstall, and **never** any access to the Docker socket.

## Map of the spec

| File | Section | Content |
|---|---|---|
| [`a-architecture.md`](a-architecture.md) | A | Overall architecture, deliverable phases |
| [`b01-data-model.md`](b01-data-model.md) | B.1 | Data model: everything in `t_service` |
| [`b02-supervisor.md`](b02-supervisor.md) | B.2 | Supervisor (`server/lib/external-integration/`): state machine, locked-down container, networking, sub-containers, hardware access |
| [`b03-integration-auth.md`](b03-integration-auth.md) | B.3 | Integration auth: stateless JWT, outside `t_session` |
| [`b04-host-api.md`](b04-host-api.md) | B.4 | REST host API design (`/api/integration/v1/`) |
| [`b05-integration-websocket.md`](b05-integration-websocket.md) | B.5 | Integration WebSocket design |
| [`b06-command-routing.md`](b06-command-routing.md) | B.6 | Command routing (proxy service, `sendCommand`) |
| [`b07-management-api.md`](b07-management-api.md) | B.7 | Management API design (admin) |
| [`b08-frontend.md`](b08-frontend.md) | B.8 | Frontend: catalog, install screens, generic 3-screen page |
| [`b09-store.md`](b09-store.md) | B.9 | The store: auto-generated decentralized index, update detection |
| [`b10-js-sdk.md`](b10-js-sdk.md) | B.10 | JS SDK: repo `GladysAssistant/integration-sdk-js` |
| [`b11-integration-template.md`](b11-integration-template.md) | B.11 | Integration template: repo `GladysAssistant/integration-template-js` |
| [`b12-documentation.md`](b12-documentation.md) | B.12 | Documentation: website `GladysAssistant/v4-website` |
| [`b13-tests.md`](b13-tests.md) | B.13 | Tests (100% patch coverage required in CI) |
| [`b14-accepted-risks.md`](b14-accepted-risks.md) | B.14 | Accepted risks (v1) |
| [`b15-communication-type.md`](b15-communication-type.md) | B.15 | "Communication" type (phase 2, shipped) |
| [`b16-network-discovery.md`](b16-network-discovery.md) | B.16 | Mediated network discovery (phase 2, shipped) |
| [`b17-webhooks.md`](b17-webhooks.md) | B.17 | Inbound webhooks via Gladys Plus (phase 2, shipped) |
| [`b18-weather-type.md`](b18-weather-type.md) | B.18 | "Weather" type (phase 2, shipped) |
| [`b20-image-cleanup.md`](b20-image-cleanup.md) | B.20 | Docker image cleanup |
| [`c00-conventions.md`](c00-conventions.md) | C | Interface specification: general conventions (REST errors, WS envelope, dates, `external_id` prefix) |
| [`c01-manifest.md`](c01-manifest.md) | C.1 | The `gladys-assistant-integration.json` manifest (`config_schema`, `containers`, `actions`, `transports`…) |
| [`c02-host-api-conventions.md`](c02-host-api-conventions.md) | C.2 | Host API: access conventions |
| [`c03-host-api-endpoints.md`](c03-host-api-endpoints.md) | C.3 | Host API: endpoints |
| [`c04-websocket-protocol.md`](c04-websocket-protocol.md) | C.4 | Integration WebSocket: protocol |
| [`c05-management-api.md`](c05-management-api.md) | C.5 | Management API (frontend ↔ server) |
| [`c06-indexer-formats.md`](c06-indexer-formats.md) | C.6 | Formats published by the indexer (`index.json`, `rejected.json`) |
| [`c07-container-descriptor.md`](c07-container-descriptor.md) | C.7 | The integration container: Docker descriptor and environment |
| [`c08-js-sdk-api.md`](c08-js-sdk-api.md) | C.8 | JS SDK: public API of `@gladysassistant/integration-sdk` |
| [`verification.md`](verification.md) | — | Verification: automated checks and manual e2e journeys |

There is no B.19: section numbers are never reused nor renumbered, so a reference written yesterday stays valid tomorrow.

## How to extend this spec

The split exists so that two workstreams landing at the same time do not fight over one file. Follow these rules:

- **A new integration type, a new capability or a new phase-2/3 workstream gets its own new file** (`b21-<topic>.md`, then `b22-…`), self-contained on the model of B.15–B.18 and B.20: the problem, the design, the manifest field it adds, the host API / WebSocket messages it introduces and the frontend behavior, all in that file. Add its row to the map above and a one-line pointer where the shared contracts reference it (a row in the C.1 field table, the C.4 message table, the C.8 SDK tables) — the detailed design stays in the new file.
- **A change to an existing behavior or contract edits the file that owns it**, in the same diff as the code, per the living-spec rule.
- **Do not renumber or move sections**: identifiers are cited across specs (`camera-ptz-control.md`, `water-heater.md`, `integration-catalog-categories.md`, `device-migration.md`), in code comments and in the ecosystem repos. Take the next free number for a new section.
- Every file starts with the one-line back-link to this README, and its first heading is the section identifier followed by the title.

## Repo ecosystem

The section C contracts decouple five repos; the `manifest.schema.json` has a **canonical owner: `GladysAssistant/integration-store`** (published on Pages next to the index), the monorepo embeds a vendored copy.

| Repo | Role | Sections |
|---|---|---|
| `GladysAssistant/Gladys` (monorepo) | Supervisor, host API, WS, server-side store, frontend — **and this spec** | B.1–B.9, B.13, C.2–C.5, C.7 |
| `GladysAssistant/integration-store` | Indexer (GitHub Action) + `index.json` on Pages; canonical manifest schema | B.9, C.1, C.6 |
| `GladysAssistant/integration-sdk-js` | npm package `@gladysassistant/integration-sdk` — depends only on the C contracts, no monorepo import | B.10, C.8 |
| `GladysAssistant/integration-template-js` | Official template repository + PoC of the e2e journey (published in the store as a third-party dev would) | B.11, C.1, C.7 |
| `GladysAssistant/v4-website` | Public documentation fr + en (transposition of sections B/C — the spec remains the source of truth) | B.12 |
