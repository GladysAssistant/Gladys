# External integrations in Gladys Assistant

> **Living specification — source of truth.** This spec describes the behavior of external integrations and the contracts binding the monorepo to the ecosystem repos (section C: manifest, host API, WS protocol, store formats). Phase 1 is implemented, and the phase 2 workstreams of sections B.15–B.18 (communication type, mediated network discovery, inbound webhooks, weather type) have shipped since. The "calendar" type (`capabilities/calendar-type.md`, B.19) has shipped its milestone 1 (push model, per-user accounts, host and management APIs); its milestone 2 (per-user OAuth2) is design-only — implement it from the spec, not from scratch. **Rule: any PR that changes an external-integration behavior or contract modifies this spec in the same diff** — spec first, code second. Field feedback (pilot ports, forum) is captured here before being coded.
>
> The spec is split into **one file per topic** in this folder (layout and editing rules below): the framework in `core/`, the contracts in `contracts/`, and one self-contained file per integration type or capability in `capabilities/`.

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

## Layout of the spec

The spec is a folder, not a file, so that workstreams landing in parallel never edit the same file. **The folder listing is the index**: there is no hand-maintained table of contents to update, and file names are topics, never numbers, so two branches adding two topics can never pick the same name.

| Folder / file | What lives there |
|---|---|
| [`architecture.md`](architecture.md) | Section A: overall architecture, deliverable phases |
| `core/` | Sections B.1–B.14 and B.20: the design of the framework itself — `data-model`, `supervisor`, `integration-auth`, `host-api`, `integration-websocket`, `command-routing`, `management-api`, `frontend`, `store`, `js-sdk`, `integration-template`, `documentation`, `tests`, `accepted-risks`, `image-cleanup` |
| `capabilities/` | **One file per integration type or capability** built on the framework — the folder listing is the list, this README never repeats it (the phase-2 workstreams B.15–B.19 live there, each file's first heading carries its identifier). Each file is self-contained: the problem, the design, the manifest field it adds, the host API endpoints and WebSocket messages it introduces, the SDK surface, the frontend behavior, its tests and its manual verification steps |
| `contracts/` | Section C, the v1 contracts binding the monorepo to the ecosystem repos: `conventions`, `manifest` (C.1), `host-api-conventions` (C.2), `host-api-endpoints` (C.3), `websocket-protocol` (C.4), `management-api` (C.5), `indexer-formats` (C.6), `container-descriptor` (C.7), `js-sdk-api` (C.8) |
| [`verification.md`](verification.md) | Automated checks and the manual e2e journeys of the framework |

**Section identifiers.** The original single-file spec numbered its sections (A, B.1…B.20, C.1…C.8), and those identifiers are cited by the other specs, by code comments and by the ecosystem repos. Existing files keep their identifier in their first heading so every such reference still resolves (nothing is ever renumbered). **No new identifier is allocated**: a new file is cited by its path (`capabilities/<topic>.md`), which is unique by construction — two parallel branches cannot both take "B.21".

## How to extend this spec

- **A new integration type, capability or workstream is a new file in `capabilities/`** (`capabilities/<topic>.md`, kebab-case topic name), self-contained on the model of the four existing ones. It owns everything it adds — including its contracts: its manifest field, its endpoints, its WebSocket messages and its SDK methods are specified **in that file**, not as rows added to the shared tables of `contracts/` (two branches appending rows to the same table is exactly the conflict this layout removes). The shared contract files describe the v1 core surface and point to `capabilities/` for the rest.
- **A change to an existing behavior or contract edits the file that owns it**, in the same diff as the code, per the living-spec rule.
- **Nothing is renumbered, moved or renamed**: paths and section identifiers are cited elsewhere. A file that grows a second topic is split into a new topic file, never renamed.
- **This README is stable by design**: it describes the layout and the rules, never the list of capabilities. Do not add a per-file map here.
- Every file starts with the one-line back-link to this README, and its first heading is its title (with the historic section identifier for the files that have one).

## Repo ecosystem

The section C contracts decouple five repos; the `manifest.schema.json` has a **canonical owner: `GladysAssistant/integration-store`** (published on Pages next to the index), the monorepo embeds a vendored copy.

| Repo | Role | Sections |
|---|---|---|
| `GladysAssistant/Gladys` (monorepo) | Supervisor, host API, WS, server-side store, frontend — **and this spec** | B.1–B.9, B.13, C.2–C.5, C.7 |
| `GladysAssistant/integration-store` | Indexer (GitHub Action) + `index.json` on Pages; canonical manifest schema | B.9, C.1, C.6 |
| `GladysAssistant/integration-sdk-js` | npm package `@gladysassistant/integration-sdk` — depends only on the C contracts, no monorepo import | B.10, C.8 |
| `GladysAssistant/integration-template-js` | Official template repository + PoC of the e2e journey (published in the store as a third-party dev would) | B.11, C.1, C.7 |
| `GladysAssistant/v4-website` | Public documentation fr + en (transposition of sections B/C — the spec remains the source of truth) | B.12 |
