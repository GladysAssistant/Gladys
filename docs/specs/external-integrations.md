# External integrations in Gladys Assistant

> **Living specification — source of truth.** This document specifies the behavior of external integrations and the contracts binding the monorepo to the ecosystem repos (section C: manifest, host API, WS protocol, store formats). Phase 1 is implemented, and the phase 2 workstreams of sections B.15–B.18 (communication type, mediated network discovery, inbound webhooks, weather type) have shipped since. **Rule: any PR that changes an external-integration behavior or contract modifies this file in the same diff** — spec first, code second. Field feedback (pilot ports, forum) is captured here before being coded.

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

## A. Overall architecture

```
┌───────────────────── Gladys core (host network) ─────────────────────┐
│  gladys.externalIntegration (supervisor)    gladys.system (dockerode) │
│   • state machine + backoff + health   ──►  • pull/create/stop/logs   │
│   • integration WS connection registry      • + createNetwork (new)   │
│   • proxy service in the stateManager                                 │
│      ▲ REST /api/integration/v1/*    ▲ WS (JWT auth, commands)        │
└──────┼───────────────────────────────┼────────────────────────────────┘
       │   dedicated bridge network `gladys-integrations` (icc disabled) │
  ┌── integration container A ──┐  ┌── integration container B ──┐
  │  Node SDK (or any language) │  │  ...                        │
  └─────────────────────────────┘  └─────────────────────────────┘
```

- **Supervisor** (`server/lib/external-integration/`): full lifecycle — `Installed → Starting → Running → Degraded → Broken → Stopped` — persisted in DB and pushed to the frontend in real time.
- **REST host API** (`/api/integration/v1/*`): the only integration→core surface, delegates to existing libs (`saveState`, `gladys.variable`), strict "tenant" isolation via integration JWT. **The integration never creates or deletes a device**: it publishes *discovered devices*, and it is the user who creates/edits/deletes from the interface (same pattern as internal integrations with their "Discovery" tab).
- **Integration WS**: extension of the existing `WebsocketManager`, auth via integration JWT; core→integration channel (device commands, scan requests, device lifecycle notifications, ping/pong, config).
- **Manifest**: file **`gladys-assistant-integration.json` at the root of the GitHub repo** — the one the store robot scrapes (source of truth for the index) — and duplicated in the Docker image (LABEL `io.gladysassistant.manifest`, for the "dev" install by image name without a repo). Content: name, version, compatible Gladys versions, **`config_schema`** (describes the Configuration screen's form, see B.8). Field `manifest_version: 1` frozen from v1. No permission system in v1 (not technically applicable, see B.14).
- **An external integration is a service**: a `t_service` row with `type: 'external'`, devices attached normally, and a *proxy service* in the stateManager (start/stop/setValue) that inserts it into the existing lifecycle **without modifying the core device or the core service**.
- **Sub-containers: declaration + lifecycle API**: the manifest declares the allowed additional containers (`containers` field, see C.1 — images, volumes, limits, published ports, hardware access), and the `/container` host API (C.3) lets the integration drive their lifecycle **within those bounds**. The supervisor executes everything: private network per integration, same sandbox, volumes derived under the integration's folder, full deletion at uninstall (detail in B.2, contracts C.1/C.3/C.7).
- **Decentralized store**: publishing an integration = creating a public GitHub repo with the `gladys-assistant-integration` topic and a manifest at the root. An automatic indexer (repo `GladysAssistant/integration-store`, scheduled GitHub Action) crawls the topic, validates by script, publishes a static `index.json` on GitHub Pages/CDN. Gladys downloads and caches this index → catalog, one-click install, update detection (detail in B.9).

### Deliverable phases

| Phase | Content | Observable deliverable |
|---|---|---|
| **1** *(shipped)* | Host API + WS, supervisor, auth, admin API, **decentralized store** (indexer + catalog + 1-click install + updates), frontend on par with internal integrations: entry in the catalog ("external" badge) + generic 3-screen page Devices / Discovery / Configuration (form generated from the `config_schema`), Node SDK (dedicated repo), template/PoC (dedicated repo), **public documentation on the website** (internal vs external + developer guide). "Dev" install by Docker image kept. | Any dev tags their repo → their integration appears in the catalog of every Gladys with no approval whatsoever → a user installs it in one click, its discovered devices are created from the UI, actionable, configurable via the generated form; the integration survives a kill (auto restart), goes "Broken" with logs after repeated failures. |
| **2** | Mediated network discovery *(shipped)* (passive listening **and active scan** broadcast/mDNS/SSDP by the core — full design in B.16), inbound webhooks via Gladys Plus *(shipped)* (generic gateway → integration relay, full design in B.17), advanced config widgets, device-scoped actions (`scope: "device"`, button on the device card — in v1 the `source: "devices"` select covers the need, see C.1), integration types other than "Devices" — first the "communication" type to move Telegram & co out of the core *(shipped, full design in B.15)*, then the "weather" type *(shipped, full design in B.18)*. | An integration detects its hardware without manual config; a messaging channel installs from the store; a weather provider (Météo France…) installs from the store and feeds the dashboard weather widget and the assistant. |
| **3** | Ecosystem: community SDKs in other languages, store ranking/stats, supply-chain hardening (digest pinning, image signing?). | Self-sufficient ecosystem, with no maintainer intervention. |

## B. Detailed design

### B.1 Data model: everything in `t_service`

**No dedicated table.** An external integration is a `t_service` row — it is conceptually the same thing as an internal service, and it avoids the dual identity to keep in sync (status, version, name in two tables). Verified in the code:
- `service.load.js:14` only iterates over the keys of `servicesFromFiles` → dynamically created rows are never touched/overwritten at boot;
- `service.startAll.js:20` iterates over the stateManager and calls `start()` → if the proxy service exposes `start()`/`stop()` delegating to the supervisor, external integrations slot into the existing lifecycle **for free** (including the "`STOPPED` = skipped at startup" rule, which replaces the `enabled` column initially considered);
- `t_service` already has `version`, `status`, and `pod_id` (aligned with the remote integrations mentioned by the RFC).

**`addColumn` migration on `t_service`** (`server/migrations/<timestamp>-add-external-integration-columns.js`, + update of `server/models/service.js`):

| Column | Type | Role |
|---|---|---|
| `type` | ENUM `('internal','external')`, default `'internal'` | ENUM rather than boolean: a future type (`'remote'` off-instance…) fits without a migration (TEXT under SQLite) |
| `docker_image` | STRING nullable | installed image:tag |
| `manifest` | JSON nullable | full manifest |
| `container_id` | STRING nullable | current Docker id |
| `failure_count` | INTEGER default 0 | backoff counter |
| `last_heartbeat` | DATE nullable | |
| `token_version` | INTEGER default 0 | integration JWT invalidation (see B.3) |
| `store_slug` | STRING nullable | link to the store index entry (`owner/repo`) for update detection; null for dev installs |
| `granted_devices` | JSON nullable | hardware access classes **granted by the user** (subset of the classes requested by the manifest, see B.2); null = none |

All nullable/defaulted for existing internal services. **Derivation of the `selector`** (and the `name`): `ext-` prefix to avoid any collision with a future native service (`service.load` looks up by `(pod_id: null, name)`), then — store or `repo_url` install: `ext-<owner>-<repo>` slugified, **unique by construction** (it is the `store_slug`); dev install by image: `ext-dev-<slugified manifest name>`, numeric suffix on collision.

- **Statuses**: reuse the existing `SERVICE_STATUS`, adding **a single value: `DEGRADED`**. Projection of the RFC state machine: Installed→`ENABLED`, Starting→`LOADING`, Running→`RUNNING`, Degraded→`DEGRADED`, Broken→`ERROR`, Stopped→`STOPPED`.
- **Logs: no table, no push.** The integration writes to stdout/stderr; Gladys reads the logs on demand via the Docker API (existing `system.getContainerLogs(container_id)`, equivalent to `docker logs`).
- **Constants** (`server/utils/constants.js`): `SERVICE_STATUS.DEGRADED`, `SERVICE_TYPES`, `EVENTS.EXTERNAL_INTEGRATION.*`, `WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.*` (frontend: `STATUS_CHANGED`, `DISCOVERED_DEVICES_UPDATED`, `CONNECTION_STATUS_UPDATED`, `DEVICE_TRANSPORT_UPDATED`; integration: `DEVICE_SET_VALUE`, `DEVICE_POLL`, `COMMAND_RESULT`, `SCAN_REQUEST`, `DEVICE_CREATED`, `DEVICE_UPDATED`, `DEVICE_DELETED`, `HEARTBEAT`, `CONFIG_UPDATED`, `HARDWARE_UPDATED`, `OAUTH_GET_AUTHORIZE_URL`, `OAUTH_CALLBACK`, `ACTION_RUN`, `CAMERA_GET_IMAGE`), `AUTHENTICATION.INTEGRATION_REQUEST`.
- **Discovered devices: no table.** The list of discovered devices published by each integration is held **in memory** in the supervisor (as internal service handlers do, e.g. philips-hue), lost on restart and republished by the integration on connection.

### B.2 Supervisor — `server/lib/external-integration/`

Prototype "one function per file" pattern (like `server/lib/system/`). Injected in `server/lib/index.js` (with the `jwtSecret`, like `Session`, and the `energyPrice` manager, which the energy features derived at discovery need — C.3); `init()` called **before** `service.startAll()`: it registers the proxy services in the stateManager, and `startAll` then starts internal and external integrations through the same path (+ `disableExternalIntegration` flag for tests).

Main files: `index.js` (constructor: WS connection maps, pending commands, timers), `externalIntegration.init.js` (loads `t_service` rows of type `external`, **reconciles** containers by label — the backup-restore case —, registers the proxy services), `install.js` (manifest resolution — from the store index, or from the image labels in dev mode — → pull → validation → creation of the `t_service` row of type `external` → JWT generation (B.3) → container → start), `buildContainerDescriptor.js`, `start/stop/restart/uninstall.js` (start/stop also called via the proxy service by the standard lifecycle; **uninstall removes everything**: stop + deletion of the container, of any sub-containers and their private network (see below), of the devices, of the config variables, then destroy of the `t_service` row — no "keep the devices" option, `t_device.service_id` is a mandatory FK and orphan devices do not exist in the model; the user gets everything back via Discovery if they reinstall), `saveStatus.js` (update `t_service.status` + `EVENTS.WEBSOCKET.SEND_ALL`), `checkHealth.js` (every 30 s), `scheduleRestart.js` (backoff `min(10s·2^n, 15min)`), `integrationConnected/Disconnected.js`, `sendCommand.js` (message_id + ack, **5 s timeout**), `registerProxyService.js`, `getLogs.js` (simple delegation to `system.getContainerLogs(container_id)`).

**State machine transitions (exact rules)**:
- `LOADING`: on container start (start/restart/install/update).
- `LOADING → RUNNING`: on the **first successful WS auth or first HTTP heartbeat** — a started container is not a working integration. Neither one within **60 s** of the start → `DEGRADED`.
- `RUNNING → DEGRADED`: 2 missed WS pongs, or WS closed, or heartbeat > 60 s (`checkHealth`).
- `DEGRADED → RUNNING`: on WS reconnection or receipt of a heartbeat.
- Container exited (observed by `checkHealth`) → restart with backoff; `failure_count` incremented on every supervisor restart, **reset to zero after 60 s of stable `RUNNING`** (without the reset, 5 crashes spread over six months would mark the integration broken); `failure_count ≥ 5` → `ERROR` (no more auto restart, admin action required).
- `STOPPED`: only by user action (stop); skipped at boot by `startAll`.

**Locked-down container**: read-only rootfs, zero capabilities, no escalation, 256 MB / 0.5 CPU / 100 pids, a single `/data` bind (via `system.getGladysBasePath()`), noexec `/tmp` tmpfs, dedicated bridge, restart handled by the supervisor (not by Docker), reconciliation label, bounded logs. The supervisor **precreates the `/data` bind source and hands it to uid/gid 1000** (`ensureDataFolder`, before every container creation): Docker creates a missing bind source owned by `root:root`, which left the only writable path read-only for the template's `USER node`. The `chown` is deliberately **non-recursive** (the folder itself, never the files — a later "recursive chown hardening" must not land: sub-container volume files may legitimately use other uids, see the sub-containers section) and **best-effort** (Gladys running as an unprivileged host process cannot chown to another uid: warn and continue, same behavior as before). **Complete `createContainer` descriptor, field-by-field justification and environment variable contract (`GLADYS_HOST_API_URL`, `GLADYS_INTEGRATION_TOKEN`, `GLADYS_INTEGRATION_SELECTOR`, `TZ`): specified in C.7.**

**Additions to `server/lib/system/`**: `system.createNetwork.js` (`gladys-integrations` bridge, `enable_icc=false` to isolate integrations from each other, **subnet pinned via IPAM**: `172.30.0.0/24`, gateway `172.30.0.1` — see C.7), `system.inspectNetwork.js` (reads the effective gateway for `GLADYS_HOST_API_URL`), `system.getImageLabels.js` (reads the manifest), `system.imageExists.js` (local presence of an image, backing the dev-install local fallback of `ensureImage` — see below and B.9), `system.listImages.js` and `system.removeImage.js` (image cleanup, see B.20).

**Image acquisition (`ensureImage`)**: every image an install or update needs (main + sub-containers) goes through `externalIntegration.ensureImage`, which pulls it — the registry stays the source of truth whenever it answers, so a mutable tag is refreshed on every install/update. **Dev installs only** (no `store_slug`) get a fallback when the pull fails: if the image is already present locally (`system.imageExists`), it is used — this is what lets a developer install and iterate on an image built with `docker build` on the host, which exists in no registry (the UI's developer mode used to require pushing every build to a registry first). On the store paths the rule stays **pull or fail** (`UNABLE_TO_PULL_IMAGE`): a leftover local tag must never shadow a registry failure, and a store update whose remote pulls fail must fail closed rather than silently recreate the container from local bits (see B.9).

**Networking: compatible with production Gladys running `--network=host`, without touching the existing `docker run`.**
- The bridge is created **on the fly** at the supervisor's first startup (`dockerode.createNetwork`, idempotent via `listNetworks`) — creating a Docker network after the fact requires no restart.
- A container in `--network=host` **cannot** join another network (Docker refuses) — but it does not need to: Gladys in host mode listens on all host interfaces, including the bridge's (`br-xxxx`). From an integration container, the **bridge gateway** is the host → `GLADYS_HOST_API_URL = http://<gateway>:<SERVER_PORT>`. Since the subnet is pinned at network creation (`172.30.0.0/24`), the gateway is **deterministic: `172.30.0.1`** on virtually every install; if that subnet is already taken on the machine (rare), fall back to Docker auto-assignment, and the effective gateway is read via `inspectNetwork` (`IPAM.Config[0].Gateway`). No NAT, no port to publish.
- Gladys running in **bridge** mode (non-standard installs): attaching after the fact does work there (`network.connect(getGladysContainerId())`, hot), and integrations reach Gladys through the custom bridge's embedded DNS. The two cases are told apart via the existing `getNetworkMode()`. More permissive design than current services (node-red/z2m/matterbridge require host mode).
- `enable_icc=false` only blocks container↔container traffic on the bridge (the intended isolation between integrations); container→gateway (Gladys) and container→internet (NAT) pass normally. To document: a strict host firewall (ufw) filters bridge→host traffic (INPUT chain).
- **Guarantee: unicast LAN access works.** Reaching a device at `192.168.x` (TCP or UDP — Tuya local protocol port 6668, Shelly local API, local MQTT…) traverses the bridge NAT like any outbound connection: Gladys filters **nothing** on egress, neither internet nor LAN. This is a **contractual requirement** for local integrations, verified in the e2e journey (Verification section). If it fails at a user's, the cause is outside the framework — classic case: a strict host firewall that DROPs bridge→LAN-interface FORWARD traffic (symptom: cloud OK, LAN KO) — to cover in the docs' troubleshooting section (B.12).
- **Accepted bridge limitation: no inbound LAN broadcast/multicast.** Broadcast, mDNS or SSDP packets emitted on the LAN do not cross the NAT bridge — verified on a real case: the Tuya local scan (`tuya.localScan.js`) listens for UDP broadcasts (ports 6666/6667/7000) and would not work in a bridge container (the core only gets away with it because it runs with `network=host`). The limitation holds **in both directions**: a broadcast emitted from the container does not cross the NAT to the LAN either (the TP-Link case: active discovery request, see B.16). Outbound LAN **unicast**, on the other hand, does traverse the NAT: reaching a known IP (obtained from a cloud, entered in config) or a cloud API works. **Mediated discovery** (the core, in host mode, captures and relays — full design in B.16) is the subject of phase 2 — to be documented honestly until then (B.12).

**Sub-containers (multi-container integrations, e.g. Frigate + Mosquitto).** An integration that needs other containers never gets the Docker socket nor a free-form creation API. The model is two-step:
- the **manifest declares** (`containers` field, C.1) everything that may run — images, volumes, limits, published ports, hardware access. It is the **authorization contract**: displayed on the install screen (and visible in the catalog), it is what the user approves;
- the **host API drives** (`/container` endpoints, C.3) the lifecycle — create/start/stop/restart, **only the declared entries**, at the time chosen by the integration.

We thus get the flexibility of an imperative API (preparing files before the first start, restarting after a config change, stopping an unused component) without losing transparency: nothing can run that was not shown at install time. Phase 2 lead: dynamic instances of a declared entry (e.g. one container per camera).

- **Startup**: each entry declares `start: "auto"` (default — the supervisor creates and starts the sub-container before the main one: zero code for the simple case) or `"manual"` (nothing starts until the integration calls `POST /container/:name/start` — the Mosquitto case: generate the password file in `/data` **before** the first start, to never run an unconfigured broker).
- **Desired state**: the supervisor remembers what should be running (`auto`, or started via the API and not stopped via the API). A container "supposed to run" that exits is restarted with the same backoff and increments the same `failure_count` as the main one (≥ 5 → `ERROR`, everything stops); a container stopped by the integration stays stopped. The global state machine remains driven by the main container (WS/heartbeat); the individual state of sub-containers is visible in the frontend's supervision block (B.8). Start/stop/restart requested by the integration do not increment the counter (deliberate gestures, not crashes).
- **Private network per integration**: bridge `gladys-int-<selector>` (icc **enabled** inside — Frigate must reach Mosquitto), created at install, removed at uninstall. DNS alias = each sub-container's `name`: the main container simply reaches `mqtt:1883` or `frigate:5000`. The main container is connected to **both** networks (private + `gladys-integrations`); sub-containers **never** join `gladys-integrations` — no token, no host API access, invisible to other integrations.
- **Published ports**: each declared port is published on a **host port chosen by Gladys** (a free port, allocated at first start then **persisted** — stable across recreations), never by the manifest: no collision possible between integrations or with a host service. The frontend shows an "Open <label>" link in the supervision block (Frigate's UI is one click away) — unless the port declares `browsable: false` (C.1), in which case the label and the assigned host port are shown as a plain badge: a WebSocket endpoint waiting for devices (the OCPP case) is not something a browser can open. The integration reads the assigned port via `GET /container`. Publishing a port = exposing a third-party interface on the LAN: stated on the install screen (B.14.8).
- **Hardware access: requested by the manifest, granted by the user.** The manifest requests **named access classes**, never paths: in v1 `coral-usb` (`/dev/bus/usb`), `coral-pcie` (`/dev/apex_*`), `gpu` (`/dev/dri`), `video` (`/dev/video*`). The user flow, entirely within the Gladys UI:
  1. **Detection**: `system.detectHardwareClasses()` (new, best effort: presence of the matching `/dev` paths — works with the standard Gladys install; otherwise the class is shown as "not detected") feeds the install screen;
  2. **Granular consent**: the install screen shows each requested class with its detection state ("Coral USB detected" / "not detected") and a **toggle per class** — pre-checked if detected, uncheckable; the user can refuse a present class or grant an absent one (hardware plugged in later). The choice is persisted in `t_service.granted_devices` (B.1);
  3. **Mounting** = the intersection **requested ∩ granted ∩ present**, resolved at every container creation — plugging in a Coral then recreating is enough;
  4. **Editable at any time**: a "Hardware" section of the supervision block (Configuration screen, admin) repeats the same toggles; a change recreates the affected sub-containers and notifies the integration over WS (`hardware-updated`, C.4) so it regenerates its config (e.g. Frigate: `edgetpu` detector if the Coral is granted and available, else `cpu`) and restarts what is needed.

  The integration therefore does not have to "detect" anything itself on the UI side: it reads the granted/available state via `GET /container` (C.3) and adapts. An arbitrary path (`/dev/sda`…) remains impossible by construction.
- **Atomic lifecycle**: install = pull of all images + creation of the private network (`auto` entries are created/started, `manual` ones wait for the API); stopping the integration = everything stops (main first); update = recreation of the whole set per the new manifest; **uninstall = everything goes** (containers, private network, ports freed, data folder, images — B.20). Sub-containers carry the same reconciliation labels (C.7): even after a Gladys crash mid-operation, the next boot destroys the orphans — no ghost container possible.
- **Data confined by construction**: each declared volume is mounted from `<basePath>/external-integrations/<selector>/containers/<name><path>` — the host path is **derived by the supervisor, never chosen by the manifest**: a sub-container cannot write outside its integration's folder. The main container, which mounts the whole `<selector>:/data`, sees these volumes under `/data/containers/<name>/...`: this is the **intended configuration channel** — generate config files at runtime (e.g. Frigate's `config.yml`, Mosquitto credentials: secrets never go through the manifest, which is public), then start or restart the sub-container via the API. Because `auto` entries are created **before** the main container, the supervisor also **precreates the volume bind sources** (`ensureSubContainerVolumes`, before every sub-container creation): Docker would otherwise create the nested folders `root:root` and the main container (uid 1000) could not write its configs under `/data/containers/...`. Each missing folder is created owned by uid/gid 1000; an existing folder is re-chowned **only when still owned by root** (a Docker-created one) — an image that owns its data with another uid (a Mosquitto-style broker) is never stomped. Best-effort, like `ensureDataFolder`.

### B.3 Integration auth: stateless JWT, outside `t_session`

`t_session` stays reserved for **user** sessions (it is used to see connections from an unknown browser) — an integration is tied to no user, the two notions are not mixed.

- **One integration JWT per container**: signed HS256 with the existing `jwtSecret` (same mechanics as `server/utils/accessToken.js`, new file `server/utils/integrationToken.js`), payload `{ service_id, token_version }`, `issuer: 'gladys'`, **`audience: 'integration'`** (a user access token can therefore never pass as an integration token, and vice versa), **without expiration** (no `exp` claim): revocation via `token_version` is the only end-of-life mechanism — an expiration would add a failure mode ("the integration dies after N months") with no security benefit.
- **Rotation/revocation via `t_service.token_version`**: the token embeds the current version; the middleware compares it with the column. On every **container recreation**, `token_version` is incremented and a new JWT injected as Env → all old tokens are immediately invalid, without storing any token anywhere (nothing to hash, nothing to revoke row by row). Cost: zero extra query, the middleware must load the `t_service` row anyway to build the tenant context. Uninstall = destroy of the row → the token dies with it.
- New middleware `server/api/middlewares/externalIntegrationAuthMiddleware.js`: verifies signature + audience + `type: 'external'` + `token_version`, loads the row → `req.externalIntegrationService`; new `externalIntegrationAuth: true` flag handled in `server/api/setupRoutes.js` (same mechanics as `alarmAuth`/`resetPasswordAuth`).
- **Tenant isolation (absolute rule)**: the JWT's `service_id` is authoritative, `external_id` forced to the `ext:<selector>:` prefix, ownership checked on every read, variables via `gladys.variable.*(key, service_id)`.
- The token is injected as Env, never displayed again; the "regenerate token" admin action = increment `token_version` + recreate the container.

### B.4 REST host API — `/api/integration/v1/`

Prefix outside the user-facing `/api/v1/`, versioned by URL. Controller `server/api/controllers/integrationHost.controller.js`, routes in `server/api/routes.js`. **Detailed contracts (request/response bodies) in C.2–C.3.**

**The host API allows neither device creation nor deletion.** The integration publishes its discovered devices; creation/edition/deletion remains a user gesture in the UI (via the standard `POST /api/v1/device`, as for internal integrations).

| Endpoint | Mapping |
|---|---|
| `POST /discovered_device` (batch, replaces the list) | stored in memory by the supervisor (`external_id`s forced to the `ext:<selector>:` prefix); frontend push `DISCOVERED_DEVICES_UPDATED`; the supervisor flags those already created in DB (match on `external_id`) and **silently upserts their `params` and their features' `supported_options`** (see C.3) |
| `GET /device` | **read only**: the integration's devices actually created by the user (`service_id` forced) — lets the integration know what to drive/poll at startup |
| `POST /state` (batch) | `EVENTS.DEVICE.NEW_STATE` (the native services' path); rate limit 300 states/min (see C.3) |
| `POST /camera/image` | `gladys.device.camera.setImage` — new image from one of the integration's cameras (≤ 150 KB, 12/min per device, see C.3) |
| `GET/POST /config` | `gladys.variable.getValue/setValue(key, service_id)` (config + secrets in core DB) |
| `POST /heartbeat`, `GET /status` | HTTP fallback + status at SDK boot |

**No logs endpoint**: the integration does not push its logs, it simply writes to stdout/stderr and Gladys reads them via the Docker API (existing `system.getContainerLogs(container_id)`, equivalent to `docker logs`). Much simpler, and it works in every language without an SDK.

Do **not** expose these routes through the Gladys Plus gateway (`setupGateway`).

### B.5 Integration WebSocket

Extend `server/api/websockets/index.js` (same WSS, new `case` in the switch): message `AUTHENTICATION.INTEGRATION_REQUEST { token }` → integration JWT validation (signature + audience + `token_version`, see B.3) → `gladys.externalIntegration.integrationConnected(service, ws)`. Heartbeat: `ws.ping()` every 20 s + `isAlive` flag on `pong` + application-level `HEARTBEAT` message (updates `last_heartbeat`); 2 missed pings → DEGRADED. Reconnection handled by the SDK (backoff), a reconnection replaces the previous entry.

**Full protocol (types and payloads) specified in C.4.** Downstream messages (core→integration):
- **specific commands** (one type per action, no generic type): `DEVICE_SET_VALUE`, `DEVICE_POLL` — each carries a `message_id` and expects a `COMMAND_RESULT` ack (see B.6);
- `SCAN_REQUEST`: (re)discovery request triggered from the UI's Discovery tab — the integration responds by republishing via `POST /discovered_device`;
- `DEVICE_CREATED` / `DEVICE_UPDATED` / `DEVICE_DELETED { device }`: relayed by the proxy service's `postCreate`/`postUpdate`/`postDelete` hooks — the core already calls them on the owning service on every user gesture (verified: `server/lib/device/device.notify.js`). The integration thus knows immediately which devices to track or drop, without polling.

### B.6 Command routing

No modification of `device.setValue.js` nor `device.notify.js`: `registerProxyService.js` places in the stateManager, under the integration's `t_service` name, a frozen object `{ device: { setValue, poll, getImage, postCreate, postUpdate, postDelete } }` — `setValue` sends `DEVICE_SET_VALUE`, `poll` sends `DEVICE_POLL` (called by the core scheduler for devices with a `poll_frequency`, as for internal services), `getImage` sends `CAMERA_GET_IMAGE` (called by `camera.getLiveImage` — live view, chat intent — 15 s timeout, the image comes back in `command-result.data`), the three hooks relay the lifecycle notifications (B.5). `sendCommand(type, payload)` → WS + ack (5 s timeout by default — `action.run` uses the action's declared `timeout_seconds`, see C.1; exceeded → throw, e.g. new `ExternalIntegrationUnavailableError` in `utils/coreErrors.js`); integration disconnected → immediate throw. **Exception for `poll`**: if the integration is not `RUNNING`/`DEGRADED` (deliberately stopped, broken), the scheduler-planned `poll` becomes a **silent no-op** — no throw and no log repeated every N seconds (log pollution for a state already known and displayed); `setValue`, however, always throws: a user actioning a device must see the error. Real state feedback via `POST /state` (document `has_feedback: true` for actionable features).

### B.7 Management API (admin)

`server/api/controllers/externalIntegration.controller.js`, operating on `t_service` rows of type `external` (no new table). **Detailed contracts in C.5.**

- **Admin**: `POST /api/v1/external_integration` with **three install modes** — `{ store_slug }` (from the store, the server resolves image + manifest from its index cache), `{ repo_url }` (**from a GitHub repo URL**, indexed or not: the server resolves the default branch via the GitHub API, downloads the raw `gladys-assistant-integration.json`, validates it with the same JSON Schema as the indexer, then follows the standard install path; `store_slug` is inferred = `owner/repo`), `{ docker_image, manifest }` (dev mode without a repo). Then `POST .../:selector/update` (pull + container recreation), `POST .../start|stop|restart`, `GET .../logs`, `DELETE` (removes **everything**: container, devices, config — see B.2).
- **Standard user**: `GET /api/v1/external_integration` (list + status, feeds the frontend's integration catalog, see B.8), `GET .../:selector` (detail: manifest, `config_schema`, status) and `GET /api/v1/external_integration/store` (store catalog from the server's index cache, filtered by Gladys version compatibility, with search + "installed" / "update available" flags; `POST .../store/refresh` to re-download the index on demand).
- **Discovery screen**: `GET /api/v1/external_integration/:selector/discovered_device` (the supervisor's in-memory list, with the "already created" flag) and `POST .../scan` (sends `SCAN_REQUEST` to the integration). Device creation then goes through the existing `POST /api/v1/device`, as for internal integrations. When that creation fails, the screen does **not** show a generic message: it maps the HTTP status to a precise explanation (validation, conflict on `external_id`, permissions, server unreachable…), lists the rejected fields returned by the API, and displays the raw technical detail to copy in a bug report. To make the field list actionable when a device publishes many features, `POST /api/v1/device` tags validation/conflict errors raised while saving a feature with an optional **structured** `context` (`{ type: "device_feature", name: "<feature name, its external_id as a fallback, or null>" }`), carried in the `properties[]` entries of a `422` and in the `error` object of a `409`. The key is absent when the thrower knew no context, and the API only ever **names** the entity — the wording around it belongs to the frontend, so it stays translated like the rest of the UI.
- **Configuration screen**: `GET/POST /api/v1/external_integration/:selector/config` — validates the payload against the manifest's `config_schema` (flat format specified in C.1), persists via `gladys.variable.setValue(key, service_id)` (`secret: true` fields are never returned in clear by the `GET`), then pushes `CONFIG_UPDATED` to the integration over WS so it reloads its config without a restart.

### B.8 Frontend: on par with internal integrations

No "separate" page in the Settings: an external integration presents itself and is used **exactly like an internal integration**, with just an "external" badge. A single type handled in phase 1: **"Devices"**-type integrations (the catalog's `device` category).

**In the integration catalog** (`front/src/routes/integration/index.js`): today the list comes from static JSON (`front/src/config/integrations/devices.json`). We merge in the external integrations from the **store** (`GET /api/v1/external_integration/store`, see B.9) — same cards (name, cover re-hosted by the indexer — `cover_url` — or placeholder), plus an **"external" badge**, the **Local / Cloud badges** derived from the manifest's `transports` (an integration that omits this optional field simply gets neither — the catalog reads the same for a community integration as for an internal one, which carries these badges from its static JSON), and for installed ones the real-time status badge (`STATUS_CHANGED`) and the "update available" flag. Two rules keep the badge row on a single line, the catalog being scanned rather than read: the **status badge only appears when the status is worth spotting** (`ERROR`, `DEGRADED`, `STOPPED`, `DISABLED`, `LOADING`, `UNKNOWN`) — `RUNNING` and `ENABLED` are the expected state of an installed integration and are rendered nowhere in the browse views of the catalog (the "Installed" view below is the exception: there the status is the reason the view was opened), the status remaining permanently displayed on the integration page's supervision block; and the **"update available" flag is an icon-only badge**, its label carried by `title` and `aria-label`, the full update section living on the integration page. The displayed list is the **union** of `GET /api/v1/external_integration` (installed — including those outside the index: `repo_url` install not yet crawled, dev mode) and of `GET .../store` (index), **deduplicated by `store_slug`**: an installed integration appears only once, with its status. Clicking a non-installed integration opens an install screen: description, "**Documentation**" link (markdown re-hosted by the indexer, `docs` from C.6, user language with `en` fallback), a clear warning (unaudited third-party code, full outbound network access), the list of any sub-containers (name, image, memory/CPU limits, published ports — the user sees what will run on their machine and what will be exposed on their network), the **Hardware** section (one row per requested class: detection state + grant toggle, see B.2), the declared authorization requests (network captures B.16, webhooks B.17, house coordinates if `location: true` — C.1), "Install" button (one click). These disclosures are shown on the **store** install screen, the path that has a manifest to display before installing. The "Install from GitHub" / dev-mode modal posts a repo URL or an image straight to the server, which only then resolves the manifest: nothing is disclosed there today, for any of the declared contracts. Showing them would mean a two-phase flow (resolve and preview the manifest, then install) — worth doing, out of scope of the endpoints that declare the contracts.

**Finding what is to be updated, without opening every integration.** The "update available" badge is on the card, and icon-only at that, so it is only seen by someone already looking at the right card — with a store meant to grow to hundreds of integrations, that is not a way to learn that something needs updating. The count of installed integrations whose `update_available` is true therefore lives in the **global frontend state** and is displayed twice: as a red counter next to **"Integrations" in the header** (visible from any page), and as a dedicated **"To update"** entry of the catalog menu, which filters the catalog down to those integrations (a cross-cutting view like "Favorites", not an integration type — route `/dashboard/integration/updates`). Both only appear when the count is non-zero; the menu entry additionally stays visible while it is the displayed view, so it does not vanish under the user who just updated the last one. The counter is **admin-only**: `update_available` is not part of the non-admin view of `GET /api/v1/external_integration` (see C.5), so a non-admin always counts zero. It is loaded at session check, refreshed by the catalog from the list it already downloads, immediately after an update from the supervision screen, and otherwise polled at the **same 30-minute cadence as the server-side index cache** (B.9) — the flag is recomputed on the server when the index is refreshed and never pushed, so a long-opened tab has nothing else to go on. No new API and no new WebSocket message: the counter is a reading of `GET /api/v1/external_integration`.

**Seeing what runs on this instance, without opening every integration.** The catalog is a browsing surface: it mixes the natives shipped with Gladys, the store integrations available for install and the ones actually installed here, and it deliberately hides the nominal statuses to keep the card rows scannable. Neither answers the operational question "what is installed on my instance, and is it up right now?" — a question that today means opening each community integration's supervision block one by one. A cross-cutting **"Installed"** view answers it in one screen: route `/dashboard/integration/installed`, a menu entry (like "Favorites" and "To update", a virtual view and not a browse category) carrying the **number of installed community integrations** in a neutral badge — an inventory, not something to fix. The view filters the catalog down to the community integrations installed on the instance (a native integration is shipped with Gladys and is never "installed on the instance", so it has no place in this inventory), and it is the one place where **every card wears its status badge**, nominal states included. It opens on a one-line **summary of the live states** ("3 Running · 1 Stopped · 1 Error"), on the same model as the per-device transport summary of the Devices tab, with an installed integration of unknown status counted as `UNKNOWN` so the breakdown always totals the number of cards. Menu entry and summary are computed over the whole catalog visible to the user, so they keep saying the same thing whatever category, facet or search is applied; the entry only appears once at least one community integration is installed, and stays visible while it is the displayed view so it does not vanish under the user who just uninstalled the last one. **No new API and no new status model**: the view is a reading of the same `GET /api/v1/external_integration` list the catalog already downloads, kept live by the same `STATUS_CHANGED` events (a container going down updates the badges and the summary without a reload). The role rules are unchanged — a non-admin only ever sees the installed communication integrations, so that is all their view (and their count) contains.

**Installing from outside the store — a mainstream journey, not a hidden "dev mode".** A **dedicated card at the end of the catalog** (Devices category), "Install from GitHub", opens a modal where the user simply pastes the **URL of a GitHub repo**; Gladys fetches and validates the repo's manifest, shows the same install screen (name, description, warning) and installs (`POST` with `repo_url`, see C.5). It is the link between the store and direct sharing: beta-testing an integration, a repo not yet crawled by the indexer, a private-circle integration. In the same modal, a discreet "Developer mode" link reveals the advanced Docker image + inline manifest form (to work without a repo). **Manifest errors are shown in full**: when the install is refused with a `422`, the modal displays, under the generic message, the exact list of validation errors returned by the server (`properties`, the errors joined with `" ; "` by `validateManifest` — e.g. `actions[1].depends_on: unknown field`), one line per error. Same treatment in developer mode when the inline manifest is not valid JSON: the local `JSON.parse` error message is displayed the same way, before the request is even sent. This screen is the developer's entry point (their own repo, their own manifest): a generic "the manifest is invalid" forces them to open the browser's network inspector to learn what to fix. **Double-instance warning**: at install (all modes — store, `repo_url`, dev), if an already-installed integration shares the same Docker image (comparison **without the tag**: a `:dev` next to a `:1.2.0`) or the same manifest `name`, the install screen warns: "another instance of this integration is already running — two instances may fight over the same cloud account or the same devices; advice: stop the existing instance during your tests". Installing remains possible — running a dev version next to prod is an **intended** use (the `ext-dev-*` selectors guarantee no technical collision); the potential conflict is a domain matter, the user decides knowingly. Note: like any install, the action remains restricted to the admin role — the catalog's Devices category is hidden from non-admins in the current frontend anyway — but the UX is designed for a non-technical user: paste a URL, click Install.

**A single generic page** `front/src/routes/integration/all/external-integration/` serves all external integrations, exactly on the model of the internal pages (`Zigbee2mqttPage`-like sidebar, dynamic routes in `front/src/components/app.jsx`), with the 3 screens:

| Screen | Route | Content |
|---|---|---|
| **Devices** | `/dashboard/integration/device/external/:selector` | The integration's already-created devices (same cards/editing as internal device pages, filtered by the integration's `t_service`); a **transport pill** per device when the `GLADYS_TRANSPORT` param is set (`local` / `cloud` / `unreachable`, translated tooltip) — if `GLADYS_TRANSPORT_DEGRADED`, the pill **keeps its transport color** with an **orange dot** overlaid and the tooltip shows the `message` (the device works, but not in nominal mode — see C.3) — + a **global summary at the top** ("12 local · 3 cloud · 1 unreachable · 1 degraded"), real-time via `device-transport-updated` |
| **Discovery** | `.../discover` | Discovered devices (name, features, "already created" badge), "Scan" button (`POST .../scan`), "Create" button per device (standard `POST /api/v1/device`), "**Update**" button when an already-created device is republished with a different structure (features — applies the new definition via the same `POST /api/v1/device`; `params` alone are upserted automatically, see C.3), real-time via `DISCOVERED_DEVICES_UPDATED` |
| **Configuration** | `.../config` | **Form generated from the manifest's JSON `config_schema`** (the RFC's declarative UI: text/number/boolean/select/secret/oauth2 fields in v1 — the `oauth2` field is a "Connect" button, see C.1 —, `section` fields render **primer blocks** that break up the form: title, text, https links with the target domain displayed (see C.1), no injected code — with the `{{gladys_host}}`/`{{port:<name>}}` placeholders substituted at render time, see C.1), saved via `POST .../config`. At the top of the screen, a permanent "**Documentation**" link (the same re-hosted markdown as at install, user language with `en` fallback): configuration time is when it is needed most (creating the manufacturer's developer account, obtaining credentials…). The generic page also handles the **OAuth callback route** (`.../oauth-callback?code&state`) which relays to the server (C.5) then closes the flow. Added to that: the **standard "Prefer local connection" toggle** if the manifest declares both `transports` (rendered and translated by the core, see C.1), the **Actions** section (one button per action declared in the manifest, mini-form if `fields`, result displayed under the button — see C.1) and the supervision block: container status **and application-level connection status** published by the integration (`connection_status` C.3 — badge + message, e.g. "token expired, please reconnect"), the **container start time** (`started_at`, "running since…"), the **"update available" banner — which names the version being offered** (`latest_version`, B.9) next to the installed one, the version number being what tells the admin what they are about to install; it falls back to the version-less wording only when `latest_version` is unknown —, start/stop/restart actions, logs modal, uninstall (admin); for multi-container integrations, each sub-container's state, a container selector in the logs modal, an "Open <label>" link per published port (e.g. Frigate's UI, `http://<gladys-host>:<assigned port>`), and the **Hardware** section (same toggles as at install, admin — changing recreates the affected sub-containers, see B.2) |

Code models: `front/src/routes/integration/all/zigbee2mqtt/` (3-tab device/discover/setup structure) and `front/src/routes/integration/all/mcp/` (API calls). i18n in **all** languages (`front/src/config/i18n/*.json`, `compare-translations` check) — config field labels come from the manifest (with optional multi-language keys), not from Gladys's i18n files.

### B.9 The store: an auto-generated decentralized index

**Principle: publishing asks nobody's permission.** The source of truth is distributed on GitHub; the index is just a public cache rebuilt by a robot.

**On the integration developer's side** — publishing =
1. a **public** GitHub repo with the topic **`gladys-assistant-integration`**;
2. a file **`gladys-assistant-integration.json`** at the root (the manifest: `manifest_version`, implicit `slug` = `owner/repo`, name, multi-language description, `version`, `docker_image` — any public registry, tag or digest —, compatible Gladys versions, `config_schema`, cover image URL);
3. **mandatory multi-language user documentation**: `docs/en.md` **and** `docs/fr.md` (the project's two languages; other languages welcome), structured per the **provided template** (B.11: Overview / Prerequisites / Configuration / Troubleshooting sections). The indexer checks the presence of both files and a minimum size (≥ 300 characters each) — absent or empty → **rejection** (`level: "error"` in `rejected.json`); fine-grained adherence to the sections stays conventional. The files are **re-hosted** on Pages like the covers (`docs` in the index, see C.6) and shown on the install screen;
4. publishing a new version = bumping `version` + `docker_image` in the manifest and pushing. That's it — no account to create, no PR to get approved.

The same manifest is duplicated in the Docker image (LABEL `io.gladysassistant.manifest`, the template does it automatically at build time): the **repo**'s file is authoritative for the store (it is the one the robot scrapes); the **LABEL** is only used for the "dev" install by image name, without a GitHub repo. When installing from the store, the index's version is the one recorded in `t_service.manifest`.

**The indexer** — new public repo `GladysAssistant/integration-store` (outside the monorepo):
- GitHub Action **scheduled hourly** (+ manually triggerable): GitHub search by topic → fetch of each repo's `gladys-assistant-integration.json` (raw.githubusercontent) → **validation by script only** (manifest JSON Schema, well-formed image reference, supported `manifest_version`, cover downloaded/validated/re-hosted see C.1, `docs/en.md` + `docs/fr.md` documentation present/re-hosted else rejection) → building of `index.json` enriched with GitHub metadata (stars, last-commit date — free ranking without centralized telemetry) → publication on **GitHub Pages** (static, CDN). `index.json`/`rejected.json` formats specified in C.6.
- Invalid manifests are listed in a public `rejected.json` with the reason → a dev diagnoses on their own why their integration does not appear, without opening a ticket.
- The validation code is public: the admission rules are verifiable by everyone, and anyone can regenerate the index (fork of the Action) — the store itself is forkable, hence no point of control.
- **No moderation in v1** (an owned decision): no blocklist, no manual removal. The defense is the sandbox (B.2) + the install-time warning. A blocklist could still be added later on the indexer side without touching the client.

**On the Gladys side** — `store/` subfolder of the supervisor (`store.getIndex.js`, `store.refreshIndex.js`, `store.checkForUpdates.js`):
- downloads `index.json` (default URL overridable by a variable — useful for tests and for pointing at an alternative index), **persistent local cache** (file or `t_variable`) refreshed every 30 min (the indexer rebuilds `index.json` hourly): the catalog remains browsable offline or if GitHub Pages is unavailable, and installed integrations never depend on the index to work;
- filters by Gladys version compatibility before exposing to the frontend;
- compares `index.version` vs `t_service.version` (linked by `store_slug`) → "update available" flag, the update is an explicit admin gesture (no auto-update in v1). When the manifest of the repo has already been read (integration absent from the index, or update forced by the admin, see below), the **highest** of the two known versions is the one compared — the index lags behind the repo by up to 1h30 and must never hide a version we already know about. That resolved version is **exposed next to the flag** as `latest_version` (`null` when unknown: dev install without `store_slug`, integration absent from both the index and the already-read repo manifests, non-semver version), so the frontend can name the version being offered instead of only announcing that one exists — "an update is available" without a number says nothing about what is about to be installed;
- for integrations installed by `repo_url` (see C.5) absent from the index, the refresh re-downloads the manifest straight from their repo — same update-detection mechanics, without depending on the crawl.

**Update = an explicit gesture, so no cache decides its outcome.** Detection is passive and lags by construction (the indexer rebuilds `index.json` hourly, the client caches it 30 min → up to 1h30 between a published release and the "update available" badge). The **"Force update"** button of the supervision screen is the answer to that latency, and therefore may not read the same caches: for a `store_slug` install it **re-downloads the index on the spot** *and* **reads the manifest of the repo** (`fetchManifestFromRepo`, the source the indexer mirrors). Without this, a release published minutes earlier resolves to the *previous* manifest, the same image tag is re-pulled and the button looks broken while behaving exactly as coded.

The two manifests form an **ordered list of candidates** — most recent version first, the repo winning ties, then **the running image as a last resort** — and the update applies **the first one whose image can actually be pulled**. The fallback is not decoration: bumping the version on the default branch and publishing the image are two distinct events, and between them (the release workflow is still building) the repo advertises a tag that does not exist yet. Failing the whole update there would be a regression — the button must at least still re-pull a known-good image, which is also how an admin unsticks a broken container. Same rule for a manifest refused by `validateManifest`: the index is unmoderated external data, a malformed entry is dropped with a log, never raised at the user. Only the manifest **actually applied** feeds `repoManifests`; a repo version that could not be pulled is **evicted** from it — cached, it would keep the badge on and send every later force update back to the same dead tag while ignoring the release that does work.

For a dev install (no `store_slug`): the installed tag is re-pulled — never the released image declared by the manifest — and the manifest re-read from the image labels. When that tag exists in no registry (an image built locally with `docker build`), the failed pull falls back on the image already present locally (`ensureImage`, B.2): rebuild, hit "Force update", the new local build runs with its refreshed manifest. This local fallback is **scoped to dev installs**: store updates keep the strict "can actually be pulled" rule above — the installed last-resort candidate almost always exists locally, and falling back there would turn every remote failure into a silent recreate-from-local "success" instead of the explicit `UNABLE_TO_PULL_IMAGE`. The frontend states the outcome — version updated, or already up to date with the image re-pulled and the container recreated — a silent success being indistinguishable from a dead button.

**Resilience, in short**: static GitHub Pages up front (no rate limit, CDN), local cache as the second layer, runtime fully decoupled from the store as the last resort. The worst-case scenario (GitHub entirely down) suspends the discovery of new integrations, never the operation of existing ones.

### B.10 JS SDK: dedicated repo `GladysAssistant/integration-sdk-js`

**Dedicated repo from phase 1** (not a monorepo folder): npm versioning independent from the Gladys release cadence, clean CI, and it is the dependency third-party devs install — they never have to touch the monorepo. It depends **only on the C.2–C.4 contracts** (no import of Gladys code).

- **npm package `@gladysassistant/integration-sdk`**: Node ≥ 20, a single runtime dependency (`ws`), TypeScript typings provided (`.d.ts`), CommonJS + ESM. **Full public API specified in C.8.**
- The repo contains **only the library** (+ its tests against a fake server, see B.13): the complete example integration lives in the template repo (B.11). The README keeps a minimal getting-started snippet and points to the template and the website docs (B.12).
- No logging helper: the integration logs to stdout/stderr, retrieved via `docker logs`.

### B.11 Integration template: dedicated repo `GladysAssistant/integration-template-js`

Public repo marked as a **GitHub "Template repository"** from its creation: "Use this template" + edit the manifest + tag the topic = being in the store. It is both the **official starting point** for a third-party dev and the **PoC** used in the e2e journey (Verification section) — it is published in the store exactly as a third-party dev would (topic + image on a public registry), which validates the "zero approval" path end to end.

**Content = a complete, working integration** (testable without hardware, covers the whole cycle including the 3 screens): publishes two discovered devices — an Open-Meteo temperature sensor (public API, no key) and a virtual switch. The user creates them from the Discovery screen; the integration then publishes the temperature every 10 min and responds to the switch's commands (receives `onSetValue`, republishes the state). Its manifest embeds a `config_schema` (latitude/longitude + refresh interval) to exercise the Configuration screen's generated form and `onConfigUpdated`.

Repo files:
- `index.js`: the demo integration, built on `@gladysassistant/integration-sdk` (~40 lines, see C.8); during the parallel development of the workstreams, dependency installed from the SDK's git repo, switched to the npm version before publication;
- `gladys-assistant-integration.json` at the root (manifest compliant with C.1, including the name/description bounds) + a compliant `cover.jpg` (800×534, ≤ 150 KB);
- `docs/en.md` + `docs/fr.md` pre-filled: this is **the official template for the store's mandatory documentation** (B.9) — Overview / Prerequisites / Configuration / Troubleshooting sections, to adapt;
- `Dockerfile`: `node:22-alpine`, `USER node`, compatible with a read-only rootfs (C.7), copies the manifest into the `io.gladysassistant.manifest` LABEL at build time;
- a ready-to-use GitHub Actions workflow: **multi-arch `linux/amd64` + `linux/arm64` build via buildx** (see B.14.7), push to GHCR on git tag — a third-party dev publishes without writing a line of CI;
- a short `README`: "publish your integration in 5 steps", pointing to the website's developer docs (B.12) for the details.

### B.12 Documentation: website `GladysAssistant/v4-website`

The public website (gladysassistant.com) must host the feature's documentation — a full workstream of its own, **in the website's two languages (fr + en)**, following the repo's existing structure and conventions (the agent in charge starts by auditing the docs tree). The content is a **transposition of sections B/C of this spec** (which remain the source of truth), not an invention. Two deliverables:

1. **User docs: "Internal and external integrations, what's the difference?"** — a page in the existing integrations docs: what an external integration is (developed by the community, run in an isolated container, **not audited by the Gladys team**), the meaning of the "external" badge and of the warning screen, what the sandbox guarantees (CPU/memory limits, no Docker access, hardware only if the user grants it class by class — toggles at install and in the Configuration screen) and what it does not guarantee (full outbound network access, web interfaces exposed on the LAN if declared), where to report a bug (the integration's GitHub repo, not the Gladys tracker), and the practical consequences: manual update from the catalog, uninstall = deletion of the devices and the config.
2. **Developer docs: "Developing an external integration"** — a dedicated section in two parts:
   - *Tutorial* (the happy path, from zero to the store): "Use this template" on `integration-template-js` → develop locally with the SDK outside Docker (dev JWT, see B.14.2) → test against your own Gladys → push the image (the provided workflow does it) → add the `gladys-assistant-integration` topic → the integration appears in every Gladys's catalog at the next indexing, with no approval;
   - *Reference*: the manifest field by field with its validation rules (C.1, including the 800×534 cover and the name/description bounds), the REST host API (C.2–C.3), the WebSocket protocol (C.4), the JS SDK API (C.8), the container contract (C.7: read-only rootfs, `/data` as the only volume, resource limits, environment variables), **sub-containers** (`containers` declaration = authorization, lifecycle via the `/container` API, private network, confined volumes, published ports, hardware classes including the Coral — requested by the manifest, granted by the user, adapt via `GET /container` and `hardware-updated` —, the "generate the config in `/data` then start/restart" pattern — with the complete Frigate + Mosquitto example), the **per-device transport status** (`GLADYS_TRANSPORT`, including the degraded state `GLADYS_TRANSPORT_DEGRADED`/`_MESSAGE`) and the standard local preference (`transports`/`GLADYS_PREFER_LOCAL`), the **OAuth2 flow** for cloud services (`oauth2` field, `onOAuthAuthorizeUrl`/`onOAuthCallback` handlers) and the **application-level connection status** (`connection_status`), network best practices (**LAN unicast and cloud work, guaranteed** — only inbound broadcast/mDNS does not pass in bridge mode, see B.2/B.16; troubleshooting: a host firewall that DROPs bridge→LAN FORWARD = "cloud OK, LAN KO"; only publish states that change, see the C.3 rate limit), the multi-arch requirement, the publish/update cycle (bump `version`), and self-service diagnosis via `rejected.json` (C.6).

### B.13 Tests (100% patch coverage required in CI)

- Supervisor: `server/test/lib/external-integration/` (one file per function), Docker mocked via `server/test/lib/system/DockerodeMock.test.js` to extend (createNetwork, getImage().inspect with Labels), or sinon fakes of `gladys.system.*` otherwise.
- Controllers: supertest; host API called with an integration JWT generated in the seed (not `authenticatedRequest`, which is a user token). **Mandatory tenant-isolation tests** (A's token ≠ B's devices, `external_id` prefix rejected, user access token refused on the host API — wrong audience).
- Middleware: 401 (token absent/invalid signature/wrong audience/stale `token_version`/non-external service). WS: auth OK/KO, command + ack + timeout (extend `server/test/websockets/`).
- Server-side store: mocked index fetch (nock or fake), local cache (hit/miss/expiration/index unavailable), version-compatibility filter, update detection, install with an unknown `store_slug` → 404, install by `repo_url` (mocked GitHub fetch: success, repo not found → 404, manifest absent/invalid → 422), and a route-collision test (`GET .../store` returns the catalog, not the `:selector` handler, see C.5).
- Sub-containers: validation of the `containers` field (bounds, unique names, `GLADYS_*` env forbidden, absolute volumes, unknown `devices` classes rejected, `ports` bounded), descriptors + private network on a Frigate + Mosquitto-like fixture (DockerodeMock), `start` auto vs manual, desired state (exited container "supposed to run" → restart with backoff; stopped via the API → left stopped), host-port assignment (free, persisted across recreations), hardware grants (intersection requested ∩ granted ∩ present, `granted_devices` outside the manifest → `422`, `POST .../:selector/hardware` → recreation + `hardware-updated` push, mocked detection present/absent, literal `hardware` route before `:selector`), `/container` endpoints (list with `granted`/`available`, start with `env` → recreation if diff, stop, restart, `404` on unknown name, **isolation: A's token does not drive B's containers**), complete uninstall (containers + private network + ports freed + data folder deleted), orphan reconciliation at boot.
- OAuth & application status: `oauth2` field validated in the schema, `authorize_url` relay (response via `command-result.data`, timeout, integration disconnected → `400`), `callback` relay (success; `success: false` → `422` with the message), `connection_status` (stored in memory, exposed in the detail, WS push `connection-status-updated`, message language fallback).
- Field feedback: **`params` upsert** on republication of an already-created device (modified params → updated in DB, name/features untouched, no `device-updated` echo), **actions** (`fields` validated → `422`, **per-action** timeout honored instead of the 5 s, `404` on an undeclared `key`, multi-language message), **silent no-op `poll`** when the integration is `STOPPED`/`ERROR` (zero logs, `setValue` still throws), new `multi_select`/`display: "radio"` types validated, `source: "devices"` (options populated with only the devices of the integration's `t_service`; manifest rejected if `source` unknown or `source` + `options` together), `section` (purely presentational: `required`/`default`/`placeholder` present or non-https `url` → manifest rejected; no write to `t_variable`, absent from the payload accepted by `POST .../config`), double-instance warning (same image without tag or same `name`), `started_at` exposed in the detail.
- Camera: `POST /camera/image` (image > 150 KB → `400`, rate limit 12/min per device → `429`, another integration's device → `404`, device without a camera feature → `400`, `saveStringState` called — never the states path), `camera.get-image` relay (image in `command-result.data`, **15 s** timeout honored, failure/timeout → `camera.getLiveImage` error).
- Transport: `GLADYS_TRANSPORT` param validated (`local|cloud|unreachable`, undefined `GLADYS_*` key → `400`), `POST /device/transport` (batch, param updated, WS push `device-transport-updated`, unknown external_id ignored; degraded state: `GLADYS_TRANSPORT_DEGRADED`/`GLADYS_TRANSPORT_MESSAGE` params set then **cleared** by an entry without `degraded`, `message` without `en` → `400`), `GLADYS_PREFER_LOCAL` toggle (rendered if `transports: ["local","cloud"]`, stored, pushed via `config-updated`, rejected for writing on the integration's `POST /config` → `400`).
- Indexer (repo `integration-store`, its own CI outside the monorepo): validation of valid/invalid manifests (including name/description bounds), cover validation (format/dimensions/weight, warning + placeholder if KO), **documentation validation** (`docs/en.md` + `docs/fr.md` present and ≥ 300 characters → else `error` rejection; re-hosting and `docs` URLs in the index), deterministic `index.json`/`rejected.json` generation on fixtures.
- SDK (repo `integration-sdk-js`, its own CI): tests against a local fake server (mocked C.3 endpoints + test WSS) — auth, resync on reconnection, auto ack (resolve/throw/absent), backoff, batch `publishState`, `externalId()`.
- Template (repo `integration-template-js`, its own CI): lint, validation of the repo's manifest against the canonical `manifest.schema.json` (the template must never itself be rejected by the indexer), passing Docker build.
- Website (repo `v4-website`): green site build, the new pages present in both languages (fr + en).

### B.14 Accepted risks (v1)

1. **Fully open network egress** (v1 choice): Docker does not filter by destination host, and we do not pretend to — **no `permissions` field in the manifest**: a declaration not technically enforced would be false security. The install screen clearly says the integration has full outbound network access. The dedicated bridge + `enable_icc=false` only isolate integrations **from each other**. Phase 3 lead: sidecar proxy or nftables — and reintroduction of a permissions field the day it is actually enforced.
2. **Without the Docker socket** (dev, exotic installs): `PlatformNotCompatible` already thrown by `system.*` → supervisor no-op + "unavailable" in the UI + documented SDK dev mode outside Docker (admin endpoint to generate a dev integration JWT).
3. **Secrets in Env**: the JWT is visible via `docker inspect` (which already assumes access to the socket = de facto root). Acceptable in v1: token scoped to a single integration and instantly invalidable via `token_version`.
4. **Backup/restore**: `container_id` stale after a restore → reconciliation by label at boot; the container's `/data` outside the DB backup (document: persist what matters via `/config`).
5. **No store moderation** (v1 choice): a proven malware stays listed as long as its author does not remove the topic. Real defenses: strict sandbox (B.2), warning displayed before install, visible GitHub metadata (stars, repo age). A blocklist on the indexer side can still be added later without touching the client.
6. **Image supply chain** (open registry + mutable tags): a manifest can reference anyone's image, and a tag can be rewritten after indexing. V1: accepted and documented (the template recommends the same repo's GHCR and digest pinning, without mandating them); hardening (mandatory digest, signing) in phase 3.
7. **CPU architectures**: a large share of the Gladys fleet runs on Raspberry Pi (arm64) — an amd64-only image fails there at pull or run time. V1: the **template builds multi-arch by default** (`docker buildx`, `linux/amd64` + `linux/arm64`, the provided workflow does it with no config); on the Gladys side, a pull/run failure due to an incompatible architecture → `ERROR` status with an **explicit message** in the UI ("image not available for your architecture"), not a raw Docker error — a rule that also applies to sub-container images. Indexer lead: check the platforms of the image's manifest list and display them in the catalog.
8. **Sub-containers: resources and exposed surface**: memory/CPU limits are declared by the dev (bounded by the C.1 schema, **displayed on the install screen**) — a Frigate-type integration can legitimately ask for 1 GB and more, it is up to the user to judge before installing. Volume disk space (`/data`, e.g. video recordings) is **not quota'd in v1** (documented; leads: quota, folder-size display in the supervision block). **A published port = a third-party interface exposed on the LAN** (with its own attack surface, potentially unauthenticated): declared in the manifest, displayed plainly at install, host port chosen by Gladys — it is the user who accepts that exposure, not Gladys that decides it. **`coral-usb` mounts all of `/dev/bus/usb`** (Docker's granularity), not just the Coral — stated honestly on the install screen. Guardrails: each class is **granted individually by the user** (toggles, revocable at any time — revocation recreates the container without the device), the classes are a curated list (v1: `coral-usb`, `coral-pcie`, `gpu`, `video`), extensible without breaking the schema; never a free-form `/dev` path.

### B.15 "Communication" type: moving Telegram & co out of the core (phase 2, shipped)

Goal: that Telegram, Nextcloud Talk, CallMeBot, Free Mobile — and tomorrow Matrix, Signal, WhatsApp… — become ordinary external integrations, and that the core stops knowing them by name. This design is **phase 2**; it is written now so the v1 contracts have nothing to break.

The type covers **two families** that must not be confused (field feedback from the Free Mobile port: presupposing bidirectionality blocked the case): bidirectional **chat channels** (Telegram — inbound + outbound, the user's authority) and send-only **notification channels** (Free Mobile, CallMeBot — no inbound possible). The manifest declares it: `messaging: { "receive": true|false }` (sending is always present); everything else — linking, endpoints, warning level — follows from it.

**Current state (verified in the code)** — three paths, of increasing asymmetry:
- **Inbound and replies: already generic.** A service emits `EVENTS.MESSAGE.NEW` with `{ source: '<service name>', source_user_id: '<chat id>', user_id, user, language, text, id, created_at }` (`telegram/lib/message.new.js`); the brain replies via `message.reply`, which does `service.getService(originalMessage.source).message.send(source_user_id, message)` (`message.reply.js:116`) — any stateManager service exposing `message.send` receives its replies without core modification.
- **Outbound (`sendToUser` and the `source: 'AI'` case of `reply`): hardcoded.** `message.sendToUser.js:37-65` enumerates by name telegram (`t_user.telegram_user_id` column), nextcloud-talk (per-user variable `NEXTCLOUD_TALK_TOKEN`) and callmebot — three ad hoc identity mechanisms. This is the block that forbids any new channel without touching the core.
- **Pure notification: yet another hardcoded name, elsewhere.** Free Mobile is not even a chat channel: service-level credentials (a single account per instance), no inbound, a single consumer — the scene action `ACTIONS.SMS.SEND` which hardcodes `getService('free-mobile')` (`scene.actions.js:638`). The generic `ACTIONS.MESSAGE.SEND` action, though, already goes through `message.sendToUser(action.user, …)`: the refactor loop below covers scenes **for free**.

**1. Core refactor (a prerequisite, beneficial even without external integrations)**: replace the hardcoded blocks with a generic loop — for each stateManager service exposing `message.sendToUser(user, message)`, call it; each service resolves its own per-user identity and no-ops if the user is not linked. Telegram/nextcloud-talk/callmebot implement this interface (their current logic moves from the core to their service), the `TOOL_CALL_EXTERNAL_SOURCES` list of `message.reply.js` becomes "any service exposing `message.sendToUser`", and the core no longer knows any name. The hardcoded `SMS.SEND` scene action becomes redundant with `MESSAGE.SEND` as soon as a per-user Free Mobile channel exists — deprecated in phase 3 along with the core service (in passing, the port lifts a current limitation: one Free Mobile account **per user** instead of one per instance — a visible model change, to document for existing users).

**2. On the external integration side** — a natural extension of the v1 contracts:
- **Manifest**: `type: "communication"` (the `type` field of C.1 is designed for this) + `messaging: { "receive": true|false }`; if `receive: false`, a **`contact_schema`** (same flat format as the `config_schema`, C.1 — e.g. Free Mobile: `username` + `access_token` as `secret`) describes the channel's **per-user** identity. No Devices/Discovery screens — the generic page only shows Configuration (it already branches by type), enriched with a "**My account**" block when a `contact_schema` is declared: each user (not only the admin) enters **their** values there, stored in `t_variable` scoped `(service_id, user_id)`. **Visible to every user, unlike a device integration**: an installed communication integration appears in the catalog of a non-admin user too (Communication category, never the store — installing stays an admin gesture), and its Configuration screen shows them only the per-user blocks ("My account" / account linking). The shared configuration of the integration, its actions, its webhooks, its hardware, supervision and logs remain admin-only — the same split as the native Telegram service, which non-admins have always seen so they could link their account.
- **Proxy service**: exposes `message.send(contactId, message)` (the reply path, already generic — only exists if `receive: true`) and `message.sendToUser(user, message)` (the refactor loop above, identity resolution by the supervisor); relay over WS `external-integration.message.send { message_id, contact, message: { text, file } }` with the standard `command-result` ack (the `<domain>.<action>` convention of C.4 was designed for this). **`text` is Markdown**: the brain and the AI produce it, and the core cannot convert it on the channel's behalf — it knows neither Telegram's HTML subset, nor Discord's native Markdown, nor the fact that an SMS channel displays nothing. It is therefore up to each communication integration to render Markdown into its channel's format (see C.4). The `contact` field carries the resolved identity: `{ "id": "<contact_id>" }` for a code-linked channel (`receive: true`), or the **target user's `contact_schema` values** for a send-only channel (e.g. `{ "username": "...", "access_token": "..." }`) — user without a configured identity → silent no-op, exactly the semantics of the `sendToUser` loop.
- **Inbound (`receive: true` only)**: `POST /api/integration/v1/message` `{ "contact_id": "...", "text": "...", "created_at"? }` — the supervisor resolves `contact_id → user` via the linking table, then emits `EVENTS.MESSAGE.NEW` with `source = <selector>`: brain, reply and history work as-is. Unknown contact → `404` (the integration can then reply in the channel "account not linked, code required"); `403` if the manifest declares `receive: false` (a notification channel never talks to the brain).
- **User↔channel identity, two modes depending on `receive`**:
  - `receive: true` — **link by code in the channel** (a generalization of the existing Telegram deep-link, `message.getCustomLink.js`): the user clicks "Link my account" on the integration's page → Gladys generates a short code in cache (15 min TTL, tied to the `user_id`) → the user sends this code to the bot in the external channel → the integration calls `POST /api/integration/v1/contact/link { code, contact_id, contact_name? }` → the supervisor validates and persists the link → `200 { user: { selector, first_name, language } }`. Going through the channel is the **proof of control of the external account** — indispensable given the authority conferred (point 3). `GET /contact` lists the linked contacts; revocation by the user from the integration's page (each user sees and unlinks **their** account).
  - `receive: false` — **entry in the Gladys UI**: no inbound, so linking by code is impossible by construction — and useless (no authority to protect). The identity comes from the "My account" block (`contact_schema`, above); revocation = clearing one's values.
  - Common storage: `t_variable` scoped `(service_id, user_id)` (the existing nextcloud-talk pattern — no migration).

**3. Specific risk, to be treated at the height of the danger — asymmetric by construction**: an inbound message carries the **authority of the linked user** (triggering scenes, opening doors via the brain…). Linking by code is therefore the critical consent: single-use code, short TTL, generated only by the user from the UI, revocable; and the install screen warns at **two levels depending on `messaging.receive`** — `true`: "this integration will be able to send **and receive** messages on your behalf" (high class, the trust model of the current Telegram bot — but with unaudited code, to spell out in black and white in the user docs B.12); `false`: "this integration will be able to send you messages" (low class — no inbound, therefore **never** the user's authority, the supervisor's `403` guarantees it server-side, not just manifest-side).

**What v1 must anticipate (and already does)**: extensible `type` in the manifest and the catalog filter; generic page branching by type; WS `<domain>.<action>` convention; proxy service extensible by capability (`device.*` today, `message.*` tomorrow); `(service_id, user_id)`-scoped variables available. The only v1 work: not closing these doors. Phase 3: deprecation of the core's communication services in favor of community-maintained external equivalents.

### B.16 Mediated network discovery (phase 2, shipped)

Problem (established in B.2): bridge containers **never** receive the LAN's broadcasts, mDNS or SSDP — only the core, running `network=host`, sees them. And the reverse is true too: a broadcast **emitted** from a bridge container does not cross the NAT to the LAN. Two concrete, symmetric validation cases: the **Tuya** local scan (`tuya.localScan.js`) is **passive** — listening for UDP broadcasts on ports 6666/6667/7000 then parsing/decrypting with the tuyapi lib; the **TP-Link** scan (Kasa protocol, surfaced by the integration's field port) is **active** — emitting an encrypted request as a UDP broadcast (port 9999, 20002 for recent devices) and collecting the responses, which come back as **unicast to the sender** (hence to whoever emitted: only the core can play that role). Design principle: **the core captures and emits (network position), the integration interprets and forges (protocol knowledge)** — the core never parses or crafts a payload.

**Declaration in the manifest** (same philosophy as `containers`/`devices`: requesting = showing the user) — optional `network_discovery` field, a list of **curated** captures:

```json
"network_discovery": [
  { "type": "udp-broadcast", "ports": [6666, 6667, 7000] },
  { "type": "udp-active-broadcast", "ports": [9999, 20002] },
  { "type": "mdns", "service": "_hue._tcp" }
]
```

V1 types for the field (extensible by schema version): `udp-broadcast` (passive listening on the declared ports, max 5 ports), `udp-active-broadcast` (request/response: emission of an integration-provided payload as a broadcast on the declared ports, max 5 ports, then collection of the unicast responses — the TP-Link case), `mdns` (browse of a declared service type), `ssdp` (M-SEARCH on a declared `st`). Displayed on the install screen ("this integration will be able to listen to UDP network announcements on ports 6666–6667", "will be able to emit a discovery request as a UDP broadcast on port 9999"); never arbitrary capture (no pcap, no undeclared port).

**Host API (phase 2)** — on-demand scan, synchronous and bounded:
- `POST /api/integration/v1/network_discovery/scan` `{ "type": "udp-broadcast", "timeout_seconds": 10 }` (1–30 s, `403` if the type/ports are not declared in the manifest) → `200` with the **raw** results: `udp-broadcast` → `[ { "source_ip", "source_port", "payload_base64" } ]`; `mdns` → `[ { "name", "host", "addresses", "port", "txt" } ]`; `ssdp` → raw headers per responder.
- **Active scan**: same endpoint, `{ "type": "udp-active-broadcast", "port": 9999, "payload_base64": "...", "timeout_seconds": 5 }` — the core emits the payload as a broadcast on the port (limited broadcast `255.255.255.255` + directed broadcast of each non-Docker interface), then collects the unicast responses during the timeout; return = same raw format as `udp-broadcast`. Guardrails specific to emission (the core sends a packet forged by a third party, the primitive must remain uninteresting to abuse): **broadcast only** (never unicast to a chosen target — no LAN sweep by proxy), port ∈ those declared in the manifest, `payload_base64` ≤ 512 decoded bytes, **1 scan / 10 s per integration** (`429` otherwise) — no targeting, no port scanning, no volume.
- The integration parses by itself (Tuya: `MessageParser` on the `payload_base64`s, exactly the current `localScan` code; TP-Link: forges the encrypted Kasa request, decrypts the responses — the crypto stays in the container), then reaches the devices in **unicast** (which crosses the NAT, already possible in v1) and publishes its `discovered_device`s.

On the core side: `server/lib/external-integration/networkDiscovery/` — sockets open only during a scan (cost bounded by the timeout), one concurrent scan per integration, reuses the `network=host` position (and the lan-manager know-how for a possible later `ip-scan` type).

**What v1 must anticipate (and already does)**: additive manifest field (a manifest with `network_discovery` is simply refused by a too-old Gladys via `gladys_version`), versioned host API, install screen already structured as approved "requests" (containers, hardware — the captures will slot in). In the meantime: external Tuya = cloud + local unicast poll (IPs obtained from the cloud), without LAN scan; external TP-Link = manual IP entry (made livable by the `params` upsert and the `source: "devices"` select actions, C.1/C.3) — documented honestly (B.2, B.12). Two out of two pilot ports stumbled on discovery (Tuya passively, TP-Link actively): B.16 is the **first phase 2 workstream**, and the active scan alone (a `dgram` socket that emits then collects) is detachable if we want to ship it fast.

A sibling design applies the same capture-and-relay principle to **Bluetooth LE advertisements** (BLE sensors decoded by an external integration, e.g. Theengs): `docs/specs/bluetooth-ble-sensors.md`. When its external contract ships (manifest `bluetooth` field, `/bluetooth/lease` host API, `bluetooth-advertisement` WS stream), this file must be updated in the same diff (C.1, C.3, C.4, B.8).

### B.17 Inbound webhooks via Gladys Plus (phase 2, shipped)

Problem: third-party services push their events by webhook (Netatmo: setpoint changes in ~2-3 s instead of the 2-min poll), but a local Gladys instance is not reachable from the Internet. The core has already solved this **for Netatmo** (PR #2627) via a Gladys Plus gateway route wired in 2021: `POST https://api.gladysgateway.com/v1/api/netatmo/:open_api_key` relays the raw body to the instance over the Plus WebSocket (`gladys-open-api` message). The external Netatmo port is blocked on it: the gateway → integration container path does not exist. We industrialize — **for all integrations, without the gateway knowing any of them**.

**Declaration in the manifest** — optional `webhooks` field (≤ 3), displayed at install ("will be able to receive events from the Internet via Gladys Plus"):

```json
"webhooks": [
  { "key": "events", "label": { "en": "Netatmo events" }, "mode": "fire_and_forget" },
  { "key": "callback", "label": { "en": "Subscription callback" }, "mode": "sync" }
]
```

Two modes, because both exist in the field: **`fire_and_forget`** (default) — the third party pushes and only expects an acknowledgment (the Netatmo class); **`sync`** — the caller waits for the **integration's response** (registration challenge/response à la Strava/Microsoft Graph, application-level returns).

**Cloud side (repo `GladysAssistant/gladys-gateway`, outside the ecosystem listed at the end of the spec — carried by the maintainer, the spec defines the contract)**: a generic route `GET|POST /v1/api/external-integration/:open_api_key/:selector/:webhook_key` that relays `{ selector, webhook_key, method, query, raw body, content_type }` (body ≤ 256 KB) under the single action `external-integration-webhook`, waits for the instance's ack with a **hard timeout** (10 s) and responds with whatever the ack contains; **timeout or unreachable instance → `200` empty body, always** — the durable fix for the Netatmo lesson (5 consecutive failures = webhook banned by the third party, observed for real; PR #2627 notes that the current gateway lets the request fail). The gateway relays, period: zero knowledge of integrations.

**Instance side**: an `external-integration-webhook` branch in `gateway.handleNewMessage.js` → the supervisor verifies selector + declared `webhook_key` (unknown → empty `200` ack, silent — no validity leak), then depending on the mode:
- `fire_and_forget`: **immediate** ack `{ status: 200 }`, asynchronous relay over the integration WS — `external-integration.webhook.received` `{ "webhook_key", "method", "query", "body", "content_type" }`, without `message_id` or ack; integration disconnected/stopped → lost without error (see doctrine below);
- `sync`: relay `external-integration.webhook.request` (same fields + `message_id`), standard 5 s ack expected; the integration's `command-result.data` — `{ "status": 200–499, "content_type", "body" }` (body ≤ 64 KB) — is returned as-is to the gateway, hence to the third party; timeout or stopped integration → empty `{ status: 200 }`.

**"Trigger, not data" doctrine** (field lesson from PR #2627, to transpose into the developer docs B.12): webhook events arrive duplicated, late, out of order (observed: a stale event delivered a minute after its successor), and their payloads are partial or misleading. A webhook is for **triggering a refresh** via the manufacturer's API, never for applying the payload as a state — which is also what makes `fire_and_forget` losses painless: polling remains the source of truth and catches everything up.

**Key and UI (standard block, rendered by the core — the `GLADYS_PREFER_LOCAL` pattern)**: the user creates their Open API key in Gladys Plus (Settings → Open API) and pastes it in a "**Gladys Plus webhooks**" block of the Configuration screen, displayed only if the manifest declares `webhooks` (Plus not linked → explanatory message instead). Stored under the reserved config key **`GLADYS_OPEN_API_KEY`** (secret, scoped to the `service_id`, rejected for writing on the integration's `POST /config` like any `GLADYS_*` key). The core builds the full URLs. Deliberately manual: the user already handles the URL on the manufacturer's side; automatic provisioning (a key minted per integration via the Plus API) is a later improvement that will not change the integration contract.

**Integration side**: `GET /api/integration/v1/webhook` → `{ "available": true|false, "webhooks": [ { "key", "mode", "url" } ] }` (URLs ready to register with the third party — the Netatmo pattern: `addwebhook` on every successful connection, best effort); event `external-integration.webhook-updated` when availability changes (Plus linked/unlinked, key changed). `available: false` (no Gladys Plus) → the integration degrades to poll-only. SDK: `getWebhooks()`, `onWebhook(key, cb)` — in `fire_and_forget` the callback's return is ignored; in `sync` the resolved value `{ status?, contentType?, body? }` goes into the `command-result`.

Security, stated honestly: the URL **is** the secret (unauthenticated payloads — anyone with the URL can post; authenticity verification — provider signature — belongs to the integration); the integration sees the Open API key (it is in the URL it registers with the third party) — a key scoped to the Open API relay, not to the Plus account, and revocable by the user in Gladys Plus; an integration's events are only routed to it (selector in the URL + declared `webhook_key`); sizes bounded in both directions.

### B.18 "Weather" type: generic weather providers (phase 2, shipped)

Goal: that weather providers — Météo France (the pilot port, PR #2626, initially written as an internal service), OpenWeather, Open-Meteo, tomorrow AccuWeather… — become ordinary external integrations, and that the core stops knowing any provider by name (community request, topic 10424). Two design requirements from the request: the dashboard widget stays **as generic as possible** (one rendering for every provider, no provider-specific UI in the core) and the API is **generic** too (a pivot weather format, never one provider's raw payload).

**State before this workstream (verified in the code at the time)** — one hardcoded name, one implicit pivot format:
- `weather.get.js` did `service.getService('openweather')` — the exact block that forbade any new provider without touching the core (the `message.sendToUser` situation before B.15). It is now the generic provider loop of point 1 below.
- The pivot format already existed de facto: the object built by `openweather/lib/formatResults.js` (current conditions + `hours` + `days`), consumed by the dashboard widget, the `GET .../weather` routes, the chat intent and the AI chat `weather_get` tool (the MCP tool that answers weather questions in the assistant, whatever the provider). It became the **contractual** pivot format, extended (point 3) so richer providers fit without provider-specific code.

**1. Core refactor (the B.15 loop, transposed)**: `weather.get` enumerates the stateManager and keeps every service exposing `weather.get(options)` — the interface `openweather` already implements, and the proxy service of any external "weather" integration (below). Weather is single-valued (one answer, not a fan-out like messages), so the policy is: candidates sorted by service name, tried **in order**, first success wins; a failing candidate (not configured, stopped integration, third-party API down, invalid payload) falls through to the next. Sorting is name-agnostic but has the right emergent property: `ext-*` selectors sort before `openweather`, so **installing an external weather provider takes precedence with zero configuration**, and stopping/uninstalling it falls back to `openweather`. Error surfacing: if every candidate threw "not configured" → `ServiceNotConfiguredError` (the frontend shows its "configure a weather service" call to action); otherwise the **first real failure** is rethrown (a provider exists but is broken — more actionable than "not configured"), with one translation: an external-integration transport/payload failure (disconnected, ack timeout, invalid payload) surfaces as the standard `REQUEST_TO_THIRD_PARTY_FAILED` error the weather widget already maps to its call to action — internal error codes never leak to the user as an opaque "unknown error". No candidate at all → `ServiceNotConfiguredError`. A per-instance provider preference (or per-widget) is a later improvement that will not change the integration contract.

**2. On the external integration side** — a natural extension of the v1 contracts:
- **Manifest**: `type: "weather"`. No type-specific manifest field in v1 of the type: the optional capabilities (alerts, extended fields) are simply optional fields of the returned payload. The install screen shows a dedicated information line ("this integration will be able to provide the weather displayed in Gladys").
- **Proxy service**: exposes `weather.get(options)`; relay over WS `external-integration.weather.get` `{ message_id, options: { latitude, longitude, language, units } }` with the standard `command-result` ack carrying `data.weather` (C.4). `units` is the requesting user's preference, `"metric"` or `"us"`: the integration must return values in that unit system (°C, m/s, hPa for metric; °F, mph for us). The ack deadline is **15 s** (a fresh third-party API call, the same exception to the 5 s rule as `camera.get-image`).
- **The payload is never trusted**: the supervisor **normalizes and bounds** the returned weather before it enters the core (`normalizeWeather`) — whitelist of fields (anything unknown is dropped), finite numbers, bounded strings, bounded arrays, dates parsed and validated; the pivot's `units` field is stamped by the core from the request (`metric` → `metric`, `us` → `imperial`, the two historical pivot values), never echoed from the integration. A payload without the required fields → the command fails like a timeout (and the provider loop falls through).
- **No device surface**: weather is a **dedicated provider API**, it has nothing to do with the device API (which controls appliances and tracks sensors). Like the communication type, the generic page only shows Configuration/Supervision/Logs — no Devices/Discovery screens, and a weather provider never goes through discovered devices or states. Alerting scenes ("trigger when the vigilance level raises") are the generic weather-alert scene trigger of the core (point 4 below), evaluated on the provider's normalized alerts — never a device sensor bent into that role.

**3. The pivot weather format** (what `weather.get` resolves with, whoever the provider is). It is a **generalization built by analyzing the market providers** — OpenWeather (One Call: current/hourly/daily + alerts), Météo France (forecast + probability + daily + vigilance, the PR #2626 pilot), Open-Meteo (current/hourly/daily variables) — cross-checked against the **Home Assistant weather entity model**, the broadest weather abstraction in the field (~40 providers behind one entity: condition + temperature, apparent temperature, dew point, humidity, pressure, wind speed/gust/bearing, visibility, cloud coverage, UV; forecasts daily/hourly with condition, temp/templow, precipitation + probability, and the same measures). Every field below exists in at least two major providers; everything optional is dropped when a provider lacks it.
- **Required**: `temperature` (number), `weather` (condition), `datetime` (date), `units` (stamped by the core, see above). Unit systems: metric = °C, m/s, hPa, mm, km; us/imperial = °F, mph, hPa, in, mi.
- **Current, optional**: `apparent_temperature` (feels-like — OW `feels_like`, MF `windchill`, HA), `humidity`, `pressure`, `dew_point`, `wind_speed`, `wind_direction` (degrees), `wind_gust`, `visibility`, `cloud_cover`, `uv_index`, `sunrise`, `sunset` (dates), `is_day` (strict boolean — see the condition enum). Percentages (`humidity`, `cloud_cover`, `precipitation_probability` below) are **0–100** — the widget appends `%` as-is — and are **clamped to [0, 100]** by `normalizeWeather` (never fractional 0–1 scales).
- **`hours`** (≤ 24 entries): `temperature`, `weather`, `datetime` required; optional `apparent_temperature`, `humidity`, `pressure`, `wind_speed`, `wind_direction`, `wind_gust`, `cloud_cover`, `precipitation` (mm), `precipitation_probability`, `uv_index`, `is_day`.
- **`days`** (≤ 8 entries): `temperature_min`, `temperature_max`, `datetime` required; optional `weather`, `humidity`, `wind_speed`, `wind_direction`, `wind_gust`, `precipitation` (mm over the day), `precipitation_probability`, `uv_index`, `sunrise`, `sunset`. `days` may or may not include the current day: consumers filter by calendar date (the widget keeps strictly future days) — a provider never has to lead with today.
- **`alerts`** (≤ 10 entries): the vigilance/alert need, generalized through **CAP** (Common Alerting Protocol — the standard Météo-France/MeteoAlarm and the NWS publish in; Home Assistant keeps alerts out of its weather entity precisely because no proprietary scale generalizes, CAP does): `severity` (`minor` | `moderate` | `severe` | `extreme` — MF vigilance maps yellow → moderate, orange → severe, red → extreme) and `event` (≤ 100 chars) required; `description` (≤ **5000** chars — CAP descriptions run long: NWS bulletins regularly exceed 2000 characters and the full MF vigilance bulletin runs up to ~4000; the widget folds it to 3 lines, expanded on click), `start`, `end` (dates) and `type` optional. `type` classifies the phenomenon so the core can translate, iconify and (later lead) filter scene triggers on it, where the free-text `event` cannot: `wind` | `rain` | `flood` | `thunderstorm` | `snow` | `heat` | `cold` | `avalanche` | `coastal` | `fog` — generalized from the MF vigilance phenomena (vent violent → wind, pluie-inondation → rain, orages → thunderstorm, inondation → flood, neige-verglas → snow, canicule → heat, grand froid → cold, avalanches → avalanche, vagues-submersion → coastal) cross-checked against the MeteoAlarm awareness types and the NWS event catalog; an invalid `type` is **dropped** (the alert is kept, rendered from `event` alone — optional metadata never rejects an alert). The widget renders a typed alert with a translated label and pictogram, falling back to the raw `event` text for untyped alerts.
- **Condition enum**: `clear` | `partly-cloudy` | `cloud` | `fog` | `drizzle` | `rain` | `pouring` | `sleet` | `hail` | `snow` | `thunderstorm` | `wind` | `night` | `unknown` — anything else is coerced to `unknown`. The doctrine: a condition value only earns its place when the core can render and speak it (widget icon set + chat answer templates exist per condition), and extending the enum is an **additive, compatible evolution** (an old Gladys coerces new values to `unknown`), done when the widget/brain learn to render the new value — never before. `partly-cloudy`, `pouring` and `hail` entered under exactly that rule (widget icons + brain answers shipped with them), closing the visible gap with the MF icon grid of the PR #2626 pilot (few clouds vs overcast, showers vs rain) and with Home Assistant's finer values, which now project as: sunny → clear, partlycloudy → partly-cloudy, cloudy → cloud, pouring → pouring, hail → hail, lightning/lightning-rainy → thunderstorm, snowy-rainy → sleet, clear-night → night (or clear + `is_day: false`), windy/windy-variant → wind, exceptional → unknown.
- **Day/night**: `night` as a *condition* erases the actual weather (a rainy night can only be "night"). The pivot instead carries an optional **`is_day`** strict boolean on the current conditions and each `hours` entry (the HA/OW/Open-Meteo day-night signal; MF encodes it in the `j`/`n` icon suffix): `weather` keeps the meteorology, `is_day` drives the day/night rendering variant. Absent → rendered as day. `night` stays accepted for compatibility but is **deprecated for providers**: send the real condition + `is_day: false`. Non-boolean `is_day` values are dropped, never coerced.

The core widget renders the base fields as today and the extensions **when present** (alert badges colored by severity, sunrise/sunset, UV index) — a provider without them loses nothing, a provider with them needs no custom UI; the remaining optional fields are contract-first (served by the API, rendered as the widget evolves). The widget configuration can also **pin a provider**: a select lists the available ones — `GET /api/v1/weather/provider`, the same duck-typed enumeration as the loop, in precedence order, openweather included, labeled by the manifest display name; open to every authenticated user since any user configures their own dashboard, and the payload carries nothing operational (service name and display label only). The choice travels as `?service=` on the house weather and image routes: the provider loop shrinks to that single name and a failure of the pinned provider **surfaces instead of silently falling back** (pinning is an explicit user choice; the automatic precedence stays the default for unpinned widgets). The internal `openweather` is labeled "internal (deprecated)" in that select and its catalog card carries the deprecated badge: the Phase 3 deprecation, made visible now that an external OpenWeather can replace it under the same name.

**4. The weather-alert scene trigger (core-owned — works with every provider, zero integration contract)**. The field need (the MF pilot again): "run a scene when the vigilance level raises". The trigger is fed by the **core**, not by a push channel: a scheduled job (`check-weather-alerts`, every 30 min) — **gated**: it runs only when at least one active scene carries a weather-alert trigger, so users without such scenes cost their provider zero extra API calls — pulls the weather of every house with coordinates through the normal provider loop, and **diffs the normalized alerts** against the previous poll. Diff identity: the alert `type` when present, the trimmed lowercased `event` text otherwise — one more reason `type` exists. Severity is ranked `minor < moderate < severe < extreme`; a new alert **or a severity increase** fires `weather.alert-raised`, a disappeared alert fires `weather.alert-ended`, a de-escalation that does not clear the alert fires nothing (the alert is still on — re-announcing it adds noise, its end will fire). The first poll after a core start is a **baseline**: no events (a restart during an ongoing storm must not re-fire every scene). Trigger configuration: house, optional phenomenon type filter (`any` by default), minimal severity (`minor` by default). Because the diff runs on **normalized pivot alerts**, the trigger works identically for every provider — OpenWeather One Call alerts included — and the integration has nothing to implement.

**5. The freshness nudge — "trigger, not data" (B.17 doctrine, transposed)**. 30 min is the floor without integration cooperation; a provider that *knows* something changed can do better, but never by pushing data: **`external-integration.weather.refresh`** (integration → core, empty payload, no `message_id`, no ack — fire-and-forget) means only "re-pull me now". The core then runs the exact same gated check as the scheduled job: the data re-enters through the audited pull path (`weather.get` → `normalizeWeather` → diff), the push channel carries **zero state**. Accepted from "weather" integrations only; rate-limited to 1 per minute per integration, silently dropped beyond (fire-and-forget has no error path, and a dropped nudge costs at most the 30-min floor). The checks are **serialized**: a nudge (or the scheduled job) landing while a check is still in flight is dropped — two overlapping runs would diff the same baseline and fire every transition twice. The MF integration polls vigilance upstream, nudges on change: the scene fires seconds later.

**6. Provider images (vigilance map, rain radar, satellite view)**. The pivot format is deliberately numeric/textual — images do not belong in a weather payload, but weather providers genuinely have them (MF vigilance map, Buienradar/DWD/MeteoSwiss rain radars). The generic channel keeps the trust boundary intact: the payload only ever declares **metadata** — optional `images` (≤ 3 entries): `key` (`^[a-z0-9][a-z0-9-]{0,31}$`) and optional multi-language `label` (values ≤ 50 chars) — and the bytes travel **on demand** over `external-integration.weather.get-image` `{ message_id, key }` → `command-result` `data.image` (raw base64, no data-URI prefix; 15 s ack, the camera exception). The core validates the **decoded bytes** (PNG or JPEG magic numbers only, ≤ 500 KB), caches them 10 min per (integration, key), and serves them to the frontend from its own origin (`GET /api/v1/house/:house_selector/weather/image/:key`, standard user auth) as a data URI — the browser **never loads a third-party URL** (no user-IP leak on every dashboard render, the same doctrine as the catalog cover re-hosting, C.1). The widget gains one "provider images" toggle and renders every declared image with its label; a provider without images loses nothing. The request path is **allowlisted end to end**: the core shape-checks the requested key against the declaration regex before consulting any provider, and the proxy only relays a key **declared in the last normalized payload** of that integration — an undeclared key 404s without a single byte sent to the integration, so an authenticated caller can neither probe the integration with arbitrary keys nor grow the 10-min cache past the declared set (≤ 3 entries per integration, the images cap). Provider images are **instance-global, not per-house**: neither the route (whose house selector only scopes authentication and 404) nor `weather.get-image` carries coordinates — the provider serves the images it knows (a national vigilance map, or the area of the last `weather.get` it answered). If a per-house need materializes, threading the house coordinates into the command is a purely additive extension.

**What v1 anticipated (and it held)**: extensible manifest `type`, catalog filter by type, WS `<domain>.<action>` convention, proxy service extensible by capability (`device.*`, `message.*`, now `weather.*`). Phase 3: deprecation of the core `openweather` service in favor of a community-maintained external equivalent (same path as the communication services in B.15).

### B.20 Docker image cleanup

Every integration image Gladys pulls used to stay on the disk forever: `update` pulled the new image and left the previous one, `uninstall` removed the container, the private network, the data folder and the `t_service` row but never the image. On a Raspberry Pi with a handful of integrations updated regularly, that is gigabytes of dead weight — the very asymmetry users noticed, since Gladys' own upgrade runs Watchtower with `--cleanup` and therefore leaves nothing behind.

**Why not a `prune`.** A manifest must declare an explicit tag (C.1) and integrations ship versioned ones, so the image superseded by an update keeps its tag: it is never *dangling*, and `docker image prune` does not see it. Only `prune -a` would, and Gladys usually shares its Docker daemon with the rest of the user's containers — deleting images it does not own is not an option. Gladys knows exactly which images it pulled and which it still needs, so cleanup is done by reference, not by sweeping.

**Two complementary mechanisms**, both best-effort: a cleanup failure is logged, never raised, and never turns a successful update or uninstall into a failed one.

- **Targeted removal**, on the lifecycle events that make an image unnecessary. `update` captures the images of the version being replaced (main + declared sub-containers) *before* rewriting the row, and removes them **once `start()` has gone through**. That is a deliberate bound, not a health guarantee: `start()` resolves on `LOADING`, so it buys the container being created and started, never the first WS auth — a release that starts and never authenticates still gets its predecessor collected, and rolling back then means re-pulling the old tag from the registry. What the ordering does guarantee is that a `start()` which *throws* (image missing, network gone, Docker down) skips the cleanup entirely. `uninstall` removes the integration's images **after** the `t_service` row is destroyed, so the in-use check no longer counts the integration being removed. An update that keeps a sub-container image, or a re-pull of the same tag (a `:dev` install), leaves the image in use and therefore untouched.
- **Nightly sweep** (`config/scheduler-jobs.js`, 3:30 AM → `EVENTS.EXTERNAL_INTEGRATION.CLEAN_IMAGES` → `cleanImages`), which is what gives an already-bloated install its disk back: targeted removal only keeps a fresh install clean. The sweep considers **only images carrying the `io.gladysassistant.manifest` label** — images built as Gladys integrations, never anything else on the machine. An image with several tags is a candidate through each of them (removing one reference only untags it); an untagged one — a rebuilt `:dev` install — by its id. Sub-container images (a Mosquitto broker, a Frigate) carry no such label and are deliberately out of the sweep's reach: they are third-party images the user may well run elsewhere, and they are already covered by targeted removal, where the manifest is what tells us they were ours.

**The sweep never collects a freshly pulled image.** `install` and `update` pull their images *before* writing the `t_service` row that declares them; a sweep landing in that window would see a brand new image as an orphan and delete it under the operation that just fetched it — and Docker's 409 is no help there, the container does not exist yet. `system.pull` therefore stamps every pull (before the download, so a slow pull on a Raspberry Pi is covered for its whole duration) and the sweep skips anything pulled less than an hour ago: far longer than the slowest install, and a genuine orphan is simply collected the next night. The stamp lands **even when the pull fails**, which is exactly what protects a locally built image (the dev-install fallback, B.2/B.9) during its install window — the pull is attempted, fails, and the local image is used; once the `t_service` row references it, the in-use guard below takes over like for any other image. The stamp is re-read **right before each deletion**, never once over the candidate list: removals are sequential, so an install starting after the sweep began — but before its image's turn came — is protected too, and that same re-read covers the in-use set going stale during the loop, since the install writes its `t_service` row after the pull the check sees. The protection is scoped to the sweep (`removeImages(..., { skipRecentlyPulled: true })`): update and uninstall name images they *know* are theirs to drop, and applying it there would leave the first image behind whenever an integration is updated twice within the hour.

**Two guards stand between a candidate and its deletion**, and both matter: `getImagesInUse` filters out every image still referenced by an installed integration — its own image or one its manifest declares — so a third-party image shared by two integrations survives the uninstall of one of them; and `removeImage` **never forces**, so Docker itself refuses (HTTP 409) to delete an image a container still references, running or stopped. HTTP 404 and 409 are both non-events for the caller, distinguished from a real failure by the boolean the call returns.

## C. Interface specification (v1 contracts)

General conventions, aligned with the existing code:
- **REST**: JSON exclusively; errors in the standard Gladys format `{ "status": <HTTP code>, "code": "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "BAD_REQUEST" | "UNPROCESSABLE_ENTITY" | ..., "message": "..." }` (produced by `errorMiddleware`).
- **WebSocket**: existing envelope `{ "type": "<namespace.kebab-case>", "payload": { ... } }` (`formatWebsocketMessage`).
- **Dates**: ISO 8601 UTC. **External identifiers**: every integration `external_id` is prefixed `ext:<selector>:` (the server rejects everything else).

### C.1 The `gladys-assistant-integration.json` manifest

Complete example (the PoC's):

```json
{
  "manifest_version": 1,
  "type": "device",
  "name": "Open-Meteo Demo",
  "description": {
    "en": "Weather sensor and virtual switch demo integration.",
    "fr": "Intégration démo : capteur météo et interrupteur virtuel."
  },
  "version": "1.2.0",
  "docker_image": "ghcr.io/john/gladys-open-meteo-demo:1.2.0",
  "gladys_version": ">=4.62.0",
  "cover_image": "https://raw.githubusercontent.com/john/gladys-open-meteo-demo/main/cover.jpg",
  "config_schema": [
    {
      "key": "intro",
      "type": "section",
      "label": { "en": "Getting started", "fr": "Pour commencer" },
      "description": { "en": "Create a developer account to get your API key.", "fr": "Créez un compte développeur pour obtenir votre clé d'API." },
      "links": [ { "url": "https://open-meteo.com/en/docs", "label": { "en": "Open-Meteo docs", "fr": "Doc Open-Meteo" } } ]
    },
    {
      "key": "latitude",
      "type": "number",
      "label": { "en": "Latitude", "fr": "Latitude" },
      "required": true,
      "default": 48.85,
      "min": -90,
      "max": 90
    },
    {
      "key": "api_key",
      "type": "secret",
      "label": { "en": "API key", "fr": "Clé d'API" },
      "required": false
    },
    {
      "key": "unit",
      "type": "select",
      "label": { "en": "Unit", "fr": "Unité" },
      "default": "celsius",
      "options": [
        { "value": "celsius", "label": { "en": "Celsius", "fr": "Celsius" } },
        { "value": "fahrenheit", "label": { "en": "Fahrenheit", "fr": "Fahrenheit" } }
      ]
    }
  ]
}
```

| Field | Type | Required | Validation rules (indexer **and** server) |
|---|---|---|---|
| `manifest_version` | integer | yes | `1`; rejected if higher than the supported version |
| `type` | string | yes | `"device"` \| `"communication"` (B.15) \| `"weather"` (B.18) |
| `name` | string | yes | 3–30 characters (displayed as the catalog card's title; internal integrations run 3–23) |
| `description` | object `{lang: string}` | yes | `en` key required, other languages optional; each value **10–100 characters** (displayed on the card; internal descriptions run 23–63, one short sentence) |
| `version` | string | yes | strict semver; must be bumped to trigger "update available" |
| `docker_image` | string | yes | valid image reference, public registry, tag **or digest** |
| `gladys_version` | string | yes | semver range (npm syntax); used by the compatibility filter |
| `cover_image` | string | no | `https` URL of a **JPEG or PNG** image, **exactly 800×534 px** (the single format of internal covers, 3:2 ratio), **≤ 150 KB** (internal covers run 13–85 KB). Validated then **re-hosted by the indexer** (see below) |
| `config_schema` | array | no | **flat** list of fields (see below) |
| `containers` | array | no | additional **sub-containers**, max 5 (see below) |
| `actions` | array | no | **on-demand actions** displayed on the Configuration screen, max 10 (see below) |
| `transports` | array | no | supported channels, subset of `["local", "cloud"]`; both present → standard "Prefer local connection" toggle (see below) |
| `categories` | array | no | browse categories of the integration catalog, 1..3 unique non-empty strings. Two-stage validation (see `integration-catalog-categories.md` §6.2): the shape rejects, the vocabulary filters — unknown keys are dropped with a warning, never a rejection. Declaring the field requires `gladys_version` ≥ the first release whose validator accepts it (older cores reject unknown manifest fields) |
| `location` | boolean | no | `true` = requests access to the coordinates of the houses configured in Gladys (`GET /house`, see C.3). The home location is sensitive personal data: the request is shown on the install screen, and an undeclared access gets a `403` — **enforced server-side**, same authorization-contract pattern as `network_discovery` |
| `network_wake` | boolean | no | `true` = requests permission to send Wake-on-LAN magic packets through the Gladys core (`POST /network/wake`, see C.3). The request is shown on the install screen and an undeclared access gets a `403`, enforced server-side. |

No `permissions` field in v1: outbound network access is open and the install screen says so — we do not specify what we cannot enforce (see B.14). The field may appear in a future `manifest_version` when a real restriction exists. What does exist are **targeted, enforceable authorization contracts** — `containers`, `network_discovery`, `webhooks`, `location`, `network_wake` — each declared in the manifest, shown to the user before install, and enforced server-side.

**Cover re-hosted by the indexer**: at each crawl, the indexer downloads the `cover_image`, validates it (JPEG/PNG magic bytes, 800×534, ≤ 150 KB) and publishes a copy on GitHub Pages; **that URL** is the one the index references (`cover_url`, see C.6). Three benefits: no dead link in the catalog, no user IP leak to a third-party server on every catalog display, and guaranteed weight/format. An absent or invalid cover does not reject the integration: it is indexed with a placeholder, and a warning (`level: "warning"`) is published in `rejected.json`.

**Language fallback** (all multi-language fields: the manifest's `description`, the `config_schema`'s `label`/`description`/`placeholder`/`options[].label`): the frontend displays the user's language if present, else `en` (required everywhere, hence always available).

**`config_schema`**: deliberately a flat list of fields, not full JSON Schema — the form rendering stays deterministic and unsurprising (the "declarative UI" principle). Fields per entry: `key` (unique, `[a-z0-9_]`), `type` (`string` | `number` | `boolean` | `select` | `multi_select` | `secret` | `oauth2` | `account_link` | `section`), `label` (multi-language, `en` required), `description` (multi-language, optional), `placeholder` (multi-language, optional — example text shown in the empty field, e.g. `48.85`), `required` (default `false`), `default`, `min`/`max` (number), `options` (select/multi_select: `[{ value, label }]`) **or** `source` (dynamic options provided by the core, see below — mutually exclusive with `options`), `display` (select: `"dropdown"` default or `"radio"` — radio buttons). Renderings: `boolean` = toggle/checkbox; `multi_select` = checkboxes, stored value = array of `value`s. Values are stored in `t_variable` scoped by `service_id`; `secret`s are **never returned to the frontend** (see C.5), but are provided to the integration.

**`section` — primer chapters** (field need from the Netatmo port: facing "Client ID", the user must know they first have to create an app on the manufacturer's developer platform — core integrations have that text in their JSX pages, the generated form did not): a **purely presentational** field, no stored value (`required`/`default`/`placeholder` present → manifest rejected; never any write to `t_variable`). Content: `label` (multi-language, `en` required — the chapter title), `description` (**plain** multi-language text, ≤ 1000 characters per language), `links` (optional, ≤ 5 entries `[{ "url", "label" }]` — `url` **https required**, multi-language `label`). Rendered by the core: visual separator + text + links opened in a new tab with the **target domain displayed** next to the label (unmoderated third-party content, same trust level as the re-hosted docs: the user sees where they are clicking). **No markdown, no HTML** — the declarative version of the need, zero interpreted rich content (the "declarative UI" principle). Since the `config_schema` is an ordered list, sections naturally structure large forms; and since action `fields` reuse this format, they are available there too. For long walkthroughs (screenshots…), the repo's mandatory documentation remains the right medium (B.9), permanently reachable from the Configuration screen (B.8).

**Placeholders resolved by the frontend in section texts** (field need from the OCPP port, forum topic 10477: the integration must show the user a URL pointing **at Gladys** — "configure your charge point to `ws://<gladys>:<port>`" — but the server cannot provide that address reliably: it does not know which LAN address the user reaches Gladys by (multiple interfaces, reverse proxy, VPN), while the **user's browser knows it by construction**): the `label` and `description` of `section` blocks may embed two tokens, substituted by the frontend at render time — **`{{gladys_host}}`** (the hostname of the address the browser currently uses to reach Gladys, i.e. `window.location.hostname`) and **`{{port:<name>}}`** (the host port assigned by Gladys to the declared sub-container port carrying that `name` — see the optional `name` field of `containers[].ports[]` below). Exact syntax, no spaces inside the braces. The mechanism stays **100% declarative** — plain-text tokens, no expression, no injected code. `{{gladys_host}}` works in every section the engine renders (`config_schema`, action `fields`, `contact_schema`) since the browser resolves it whatever the user's role; `{{port:<name>}}` is **refused by validation in `contact_schema`** — that per-user block is the one screen a non-admin reaches, and their reduced view deliberately carries no container state (C.5), so the token would resolve for an admin and stay raw for everyone else. Exposing assigned host ports in the reduced view to fix that would trade a documented privacy boundary for a cosmetic gain. Two validation/resolution rules: a `{{port:<name>}}` referencing a name declared nowhere in the manifest → **manifest rejected** (indexer and server, like any structural error — an unknown reference would sit unresolved on screen forever); a valid token whose port has **no assigned host port yet** (sub-container never started) is left **as-is** by the frontend — honest and debuggable, and it resolves the next time the screen is loaded after the allocation (the assignments come from the detail fetched when the screen opens; the real-time `status-changed` push carries the status only, so an allocation happening under an already-open screen is not picked up before a reload). Documented limitation (accepted): browsing through Gladys Plus or a reverse proxy, `{{gladys_host}}` resolves to the tunnel/proxy hostname, not to the instance's LAN address — for a device that must reach Gladys over the LAN, the integration's mandatory repo documentation is the place to say so.

**`source` — selects with dynamic options**: a `select`/`multi_select` field can replace its static `options` with `"source"`, a **reserved enum defined by the core** — never a URL or an expression: nothing arbitrary enters the rendering, extensible without breaking the schema. V1: a single value, **`"devices"`** — the frontend populates the options with the **integration's already-created devices** (label = device name, value = `external_id`), fetched via the standard endpoint for a service's devices and therefore filtered by the integration's `t_service` (zero leakage between integrations). It is the answer to the "act on a specific device" need without making the user copy an identifier: in an action (below), a `source: "devices"` select passes the chosen `external_id` to the integration like any field value. Manifest validation: `source` outside the enum, or `source` and `options` present together → rejection. **Value validation is dynamic too** (field feedback, forum: a `source: "devices"` select was unusable because the value was checked against the — necessarily absent — static `options`, so every value was refused): before validating a payload, the core resolves the valid values of the declared sources (`"devices"` → the `external_id`s of the integration's `t_service` devices, one query, skipped entirely when no field declares a `source`) and checks the value against **that** list. Applies identically to the four entry points sharing the validation engine: `POST .../config` from the front, `POST /config` from the integration, action `fields`, and the per-user `contact_schema`. A device belonging to another integration is refused like any unknown value (`422`), and when the integration has no device yet the error says so instead of listing an empty set.

**`oauth2` type** (cloud services with browser authorization — the Netatmo case, verified in `netatmo.retrieveTokens.js`: it is the frontend that carries the flow). Rendering: the **redirect URI to copy** into the provider's developer application, a "Connect" button (+ the connection state, see `connection_status` C.3), and an advanced option to use the instance address instead (only offered when the frontend is served over HTTPS). Flow, entirely relayed — **the Gladys server knows no provider**:
1. click on "Connect" → `POST .../:selector/oauth/authorize_url { key, redirect_uri }` (C.5), relayed to the integration over WS (`oauth.get-authorize-url`, C.4) — **it** builds the URL (client_id from its config, scopes, anti-CSRF `state` it generates and retains, **mandatory**: the frontend refuses an authorize URL without one);
2. the frontend wraps the `state` with the address to come back to (see below) and opens the URL (popup); the user consents at the provider, which redirects to `https://my.gladysassistant.com/redirect/oauth`, a static page hosted by Gladys that unwraps the state and bounces the browser to the frontend's **generic callback route** (`.../oauth-callback?code&state`);
3. the frontend relays `POST .../:selector/oauth/callback { key, code, state, redirect_uri }` (C.5) → WS `oauth.callback` → the integration verifies `state`, exchanges the code for the tokens, stores them in config **outside the schema** (`POST /config`) and updates its `connection_status`.

**Why the redirect page** (`front/src/utils/oauth.js`, page source in [`GladysAssistant/my.gladysassistant.com`](https://github.com/GladysAssistant/my.gladysassistant.com)): providers now require an HTTPS redirect URI — Spotify has enforced it since April 2025, accepting only `https://` plus the loopback literals `127.0.0.1` and `[::1]`. A Gladys reached at `http://192.168.1.50:1443` can never satisfy that. So `redirect_uri` is the **fixed HTTPS page** for every instance, and the address to come back to travels in the `state`, the only parameter a provider hands back untouched:

```js
state = base64url(JSON.stringify({ v: 1, origin, path, state: '<the integration state>' }));
```

The page only ever redirects to an HTTPS origin or to a plain-HTTP origin that can exist solely on the visitor's own network, always behind an explicit click. The integration sees none of this: it receives a `redirect_uri` and uses it as-is (**never hardcode it**), gets its own `state` back, and the same `redirect_uri` comes back byte for byte for the token exchange. One consequence worth knowing: a single URL now has to be declared at the provider, whether the user reaches Gladys locally or through Gladys Plus.

**What the redirect page does and does not see**, stated precisely because the user-facing wording depends on it: the provider redirect carries the authorization `code` in the query string of a request to a Gladys-operated host, so the static hosting in front of it does see that URL. Nothing runs server-side there, nothing is stored, and the page strips the query string from the address bar once read. The code alone is useless — the exchange needs the client secret, which never leaves the integration — and **tokens never transit through the frontend nor through the redirect page**. What must not be claimed is that no data ever touches Gladys-operated infrastructure. Users who prefer no third-party host at all have the instance-redirect option.

Refreshing tokens stays the integration's business (like `netatmo.refreshingTokens` today).

**`account_link` type** (providers that are **not** OAuth2 — field need from the Roborock port: Xiaomi Home is linked by a QR sign-in the user approves in the vendor app, and Xiaomi redirects to its own endpoint, never back to Gladys; the integration learns about the approval by long-polling the provider). Same intent as `oauth2` — link a provider account, hold no value, keep the credentials off-schema — and the same relay to obtain the URL, so an integration keeps a single handler. What differs is that **nothing ever comes back**: there is no `redirect_uri` to declare (`POST .../oauth/authorize_url` accepts the call without one, and rejects a missing one only for an `oauth2` field), **no anti-CSRF `state` is required** (there is no round trip to protect, and nothing for the integration to verify), and the callback route is never involved. Rendering: a "Connect" button and the connection state, **without** the redirect-URI block and without the instance-redirect option — showing either would describe a flow that does not happen. The URL is opened with `noreferrer` on top of `noopener`: the address of the instance has no business leaking to a provider that will never talk to it, and some of them (Xiaomi) reject a sign-in URL opened with a cross-site `Referer` outright.

The integration signals the outcome the only way it can: through its `connection_status` (C.3), which drives the badge live — the user has nothing to check by hand. Like `oauth2`, an `account_link` field is refused in a `contact_schema` (linking a provider account is integration-scoped, never per user) and refuses `default`, `placeholder` and any direct value.

**`containers`**: the sub-containers' **authorization contract** (B.2) — declares what may run; the lifecycle is then driven via the `/container` API (C.3), only within these bounds. Example (a Frigate integration):

```json
"containers": [
  {
    "name": "mqtt",
    "docker_image": "eclipse-mosquitto:2.0.18",
    "start": "manual",
    "volumes": ["/mosquitto/config", "/mosquitto/data"],
    "memory_mb": 128
  },
  {
    "name": "frigate",
    "docker_image": "ghcr.io/blakeblackshear/frigate:0.14.1",
    "start": "manual",
    "volumes": ["/config", "/media/frigate"],
    "read_only": false,
    "memory_mb": 1024,
    "shm_mb": 128,
    "ports": [{ "container_port": 5000, "name": "frigate_ui", "label": { "en": "Frigate UI", "fr": "Interface Frigate" } }],
    "devices": ["coral-usb"]
  }
]
```

Fields per entry (validated by the indexer **and** the server, all displayed on the install screen):
- `name` (required): `[a-z0-9-]{2,20}`, unique within the manifest — serves as the DNS alias on the private network, the container name suffix and the identifier in the `/container` API;
- `docker_image` (required): same rules as the main image (public registry, tag or digest, multi-arch recommended);
- `start`: `"auto"` (default: started by the supervisor before the main container) or `"manual"` (started by the integration via the API, see B.2);
- `env`: object `{ key: value }` of **static strings**; `GLADYS_*` keys forbidden; the manifest is public → **never a secret here** (credentials are generated at runtime and go through `/data` files or the `env` of `POST /container/:name/start`, see B.2/C.3);
- `volumes`: **absolute** paths inside the container, max 5 — each mounted from a subfolder derived from the integration's folder (C.7), the manifest never chooses a host path;
- `ports`: max 3 entries `{ container_port, protocol ("tcp" default), label (multi-language, en required), name (optional), browsable (default true) }` — the **host** port is chosen by Gladys (free, persisted), never declared (C.7); the `label` names the "Open" link in the UI; `browsable: false` for ports that do not serve a web UI (e.g. a WebSocket endpoint for devices, the OCPP case): the supervision screen shows the assigned host port without the "Open" link; the optional `name` (`[a-z0-9_]{2,20}`, **unique across the whole manifest**) makes the assigned host port referenceable by the `{{port:<name>}}` placeholder of the section texts (see above) — the two pair up on that same OCPP case: a non-browsable port whose number the user still has to read, spelled out inside a sentence;
- `devices`: **requested** hardware access classes, among `coral-usb` | `coral-pcie` | `gpu` | `video` (v1 list, extensible by schema version — never a free-form `/dev` path); requesting is not obtaining: each class is **granted or refused by the user** in the UI (B.2), the effective mount = requested ∩ granted ∩ present;
- `read_only`: default `true`; opt-out possible (some upstream images, e.g. Frigate, do not run on a read-only rootfs);
- `memory_mb`: 32–4096, default 256; `cpu`: 0.1–2, default 0.5; `shm_mb`: 64–512, default 64 (`/dev/shm`, useful for video processing);
- `command`: optional, array (override of the image's CMD).

**`actions`**: the generic "run this operation and show me the result" need without custom UI — connection test, identify, re-pairing, protocol version detection… Rendered as **buttons on the Configuration screen** (B.8). Example (the Tuya case: detecting the protocol version and data points of a device whose IP was entered by hand when the UDP scan did not find it — a long operation, ~15 s):

```json
"actions": [
  {
    "key": "detect_protocol",
    "label": { "en": "Detect protocol version", "fr": "Détecter la version de protocole" },
    "description": { "en": "Tries each protocol version against the device.", "fr": "Essaie chaque version de protocole sur l'appareil." },
    "timeout_seconds": 30,
    "fields": [
      { "key": "device", "type": "select", "source": "devices", "label": { "en": "Device", "fr": "Appareil" }, "required": true },
      { "key": "ip", "type": "string", "label": { "en": "Manual IP (optional)", "fr": "IP manuelle (optionnel)" }, "placeholder": { "en": "192.168.1.42" } }
    ]
  }
]
```

Rules: unique `key` `[a-z0-9_]`; multi-language `label` (`en` required), optional `description`; optional `fields` = **same format as the `config_schema`** (the mini-form is rendered by the same engine, validated the same); `timeout_seconds` 5–120, default 30 — this is the ack delay granted to `action.run` (C.4), **an exception to the 5 s rule**, because these operations can be long. Execution: button (± form) → `POST .../:selector/action/:key` (C.5) → WS relay → the result (`data.message`, string or multi-language) is displayed under the button, success or failure.

**Rendering of the result message — and of every free-form text an integration publishes** (an action's `data.message` and `description`, the `connection_status` `message`, the `config_schema` field and `section` descriptions, the manifest `description` on the install screen): the core displays them as **escaped plain text**, never as HTML or Markdown — the message comes from unaudited third-party code running in a container, injecting it as markup would be an XSS in Gladys' own admin UI. Consequence: **line breaks are the only formatting available to an integration**, and they are honored — these blocks are rendered with `white-space: pre-wrap` (the idiom already used for the container logs and the chat bubbles), so a `\n` in the message becomes a line break on screen. A long unbroken token wraps instead of overflowing the card, and an action result taller than the block scrolls inside it rather than pushing the page down (an action's message length is not bounded by the protocol). An integration wanting richer structure uses indentation, bullet characters or blank lines — the core will not interpret Markdown here; the `text` of `message.send` (C.4) is the deliberate exception, and there it is the *integration* that renders it for its own channel. Two surfaces are **deliberately excluded** and must stay so: the **catalog cards**, where the manifest `description` is a one-line tagline in a grid — honoring line breaks there would give neighboring cards uneven heights —, and the **degraded-transport tooltip** (C.3), a native `title` attribute which browsers already break on `\n` without any CSS.

Actions are **integration-scoped**: a single rendering place, the Configuration screen — no buttons injected by the manifest on device cards in v1 (the scoping's "consistent UI" requirement: where to render them, how many, on which cards has no good generic answer). The "act on a specific device" need goes through a `source: "devices"` field as in the example above; device-scoped actions (`scope: "device"`, a button on the device card) remain a **phase 2** lead if usage demands it.

**`transports`**: declares the channels the integration can use. If `["local", "cloud"]` (both), Gladys renders at the top of the Configuration screen a **standard toggle, translated by the core** — same wording for all integrations: "Prefer the local (LAN) connection when available" — stored under the reserved config key **`GLADYS_PREFER_LOCAL`** (boolean, default `true`). The integration receives it like any key (`GET /config`, `config-updated` event) but cannot write it (`GLADYS_*` key on the integration's `POST /config` → `400`: it is a user preference). The preference is a **wish**, not an order: the integration applies it when it can, and reflects reality per device via `GLADYS_TRANSPORT` (C.3) — standard preference + standard status, zero manufacturer semantics in the core.

### C.2 Host API: access conventions

- Base: `GLADYS_HOST_API_URL` (injected env, e.g. `http://172.18.0.1:80`) + the **`/api/integration/v1`** prefix.
- Auth: **`Authorization: Bearer <GLADYS_INTEGRATION_TOKEN>`** header (JWT injected as env, see B.3). Absent/invalid/wrong audience/stale `token_version` → `401 UNAUTHORIZED`.
- **No integration selector in the URLs**: identity comes from the JWT (`service_id` in the payload), each integration only sees its own perimeter. Putting the selector in the URL would be redundant — the server would have to verify it matches the token anyway — and would create a needless error surface (URL/token mismatch). It is the "the API talks to *the authenticated integration*" pattern, like a `/me`.

### C.3 Host API: endpoints

**`GET /api/integration/v1/status`** → `200`
```json
{ "gladys_version": "4.62.0", "service": { "id": "uuid", "selector": "ext-open-meteo-demo", "status": "RUNNING", "version": "1.2.0" } }
```

**`POST /api/integration/v1/heartbeat`** — body `{}` → `200 { "success": true }` (HTTP fallback of the WS heartbeat).

**`POST /api/integration/v1/connection_status`** — body `{ "connected": false, "message": { "en": "Token expired, please reconnect.", "fr": "Token expiré, reconnectez-vous." } }` (`message` optional, multi-language with `en` fallback) → `200 { "success": true }`. The integration's **application-level status** ("connected to Netatmo", "token expired"…), held in memory by the supervisor, exposed in the detail (C.5), displayed on the Configuration screen and pushed to the frontend (`connection-status-updated`, C.4). Distinct from the container state machine (B.2): a cloud integration can be `RUNNING` (healthy container, WS connected) and yet disconnected from its third-party service — without this channel, it would be silently broken. The `message` is rendered as escaped plain text with its line breaks preserved, like every free-form text published by an integration (see the actions section in C.1).

**`POST /api/integration/v1/discovered_device`** — publishes the **complete** list of discovered devices (replaces the previous one). Device object = standard Gladys format, without `service_id` or `selector` (forced server-side — a published `selector`, on the device or on a feature, is **dropped**):
```json
{
  "devices": [
    {
      "name": "Météo Paris",
      "external_id": "ext:open-meteo-demo:paris",
      "features": [
        {
          "name": "Température",
          "external_id": "ext:open-meteo-demo:paris:temperature",
          "category": "temperature-sensor",
          "type": "decimal",
          "unit": "celsius",
          "min": -50,
          "max": 60,
          "read_only": true,
          "has_feedback": false,
          "keep_history": true
        }
      ],
      "params": [{ "name": "CITY", "value": "paris" }]
    }
  ]
}
```
→ `200 { "success": true, "count": 1 }`. Rules: prefixed `external_id`s (device **and** features), `category`/`type`/`unit` within Gladys's standard lists (`DEVICE_FEATURE_CATEGORIES`/`TYPES`/`UNITS`), max 2000 devices (discovery is fleet-wide: a network integration publishes one entry per client on the network, ~1000 on a large setup), `400` otherwise. Optional device-level field **`poll_frequency`** (values from the existing `DEVICE_POLL_FREQUENCIES`: 1 s to 60 s) to receive `device.poll` from the core scheduler once the device is created. Optional feature-level field **`supported_options`** (`[{ value, label, sort_order }]`, integer or non-empty string values, a required non-empty `label`, no duplicate values — an integer and its string form count as duplicates —, `sort_order` defaulted to the array index — violations are `400`) declares, for an enum-like feature, the subset of values *this* device actually supports: the taxonomy defines the full generic value set and the integration narrows it per device, never the other way round (see `device-feature-categories.md`, rule 6). String values are only accepted on the `text`/`select` feature type (dynamic selects: installed TV apps, HDMI sources… — the state is the selected value, stored as a string, no history); a string option on any other feature is a `400`, enum-like features keep integer values. It travels untouched to the Discovery screen and then to `device.create`, which persists it; the frontend then offers only the declared options. Optional feature-level field **`step`** (finite number > 0, `400` otherwise), the resolution the **physical device** accepts for a setpoint — `0.5` for an air conditioner steppable by half a degree, which the dashboard's `+`/`-` buttons then honor. Absent or `null` means "nothing declared" and the UI keeps its per-category default: the step is the device's business, and no category default can be right for every unit of that category. On the **update** of an already-created feature, clearing a step that was declared before takes an explicit `step: null` — an absent key leaves the stored value untouched, as for every other optional column (`unit`, `min`, `max`): `instance.update()` only writes the keys it is given.

A feature may carry an optional **`supported_options`** array (`[{ "value": 1, "label": "Entrée", "sort_order": 0 }]`) — the labeled option list of enumerated features: camera presets and supported movements (`docs/specs/camera-ptz-control.md`), AC/fan modes… Validated at publish time (integer `value`s, unique, non-empty `label`s, `400` otherwise); the standard `POST /api/v1/device` then persists it in `t_device_feature_supported_option` when the user creates the device. On re-publish, the options of **already-created** devices are silently upserted like the `params` (they are the integration's technical data — e.g. a preset renamed on the camera): synced by feature `external_id` when the published feature carries a `supported_options` array, no user gesture, no device-updated echo back to the integration.

**Selector uniqueness is the core's job, `external_id` uniqueness is the integration's.** The `selector` of a device — and of a feature — is derived from its name at creation (`addSelector` hook) and the column is unique in DB: two devices sharing a name (a Spotify fleet where every device is named "MacBook Pro de …", a "Volume" feature on each speaker) used to make the second creation fail with a `409` that the user could not work around, the selector not being part of what the Discovery screen posts. Creation now resolves a **free** selector (`buildUniqueSelector`, `server/utils/addSelector.js`): the readable slug when it is available, then `-2`, `-3`… and random characters past twenty homonyms. Feature selectors are resolved one at a time within a device, so two features of the same batch cannot pick the same candidate. This is deliberately **not** delegated to the integration: the selector is unique across `t_device` as a whole, all integrations combined — a perimeter a container cannot see — and it is a core-owned, user-facing identifier (scenes, API, MQTT). The integration only guarantees the uniqueness of its `external_id`s, which it can (they are prefixed `ext:<selector>:`).

**Payload size**: the whole host API (`/api/integration/v1/*`) accepts a **20 MB** JSON body, against the 100 kB of the routes serving the frontend — the endpoints here are batch by construction and the device count, not the byte count, must be the binding limit. This endpoint in particular cannot be split: publishing **replaces** the previous list, so a second call would erase the first. A device with many features is heavy (a Shelly Pro 3EM exposes 24 features, ~8 kB serialized): under the frontend bound, discovery died around a dozen devices and the user simply saw nothing. Over the bound the core answers `413 PAYLOAD_TOO_LARGE` (never an opaque `500`), so the integration can say so instead of failing silently.

**Reserved `GLADYS_*` params**: `params` names prefixed `GLADYS_` are reserved for the semantics defined by this spec — any undefined `GLADYS_*` key → `400`. Defined in v1: **`GLADYS_TRANSPORT`** = `"local"` | `"cloud"` | `"unreachable"`, the device's **effective transport status**. It is the generic pattern of dual-channel integrations (Tuya cloud+LAN, Shelly, eWeLink/Sonoff, Somfy TaHoma, Netatmo cameras, Zendure local MQTT…): the transport can differ from one device to another and change over time, and without a visible indication the user cannot diagnose a slow or frozen device. The integration sets it at discovery and keeps it up to date (republication, or the dedicated `POST /device/transport` endpoint below); Gladys renders it as a **pill** on the devices (B.8). Purely declarative: **no routing semantics on the core side**, the cloud/local "kitchen" stays in the container.

Two more reserved keys cover the **degraded state** — the "it works, but not as intended" case, which the three transport values cannot express (field case: device detected by the local scan, but local sessions refused — rotated local key, another client holding the connection… — → falls back to cloud; the user sees a perfectly normal "cloud" pill and nothing invites them to investigate): **`GLADYS_TRANSPORT_DEGRADED`** (`"true"`, absent otherwise) and **`GLADYS_TRANSPORT_MESSAGE`** (multi-language object serialized as JSON, `en` required, ≤ 200 characters per language — the reason, e.g. "Local detected but sessions refused, falling back to cloud"). Degraded is deliberately **orthogonal to the transport** — not a 4th enum value: "which channel is used right now" and "is this the nominal state" are two pieces of information, and it is their combination ("cloud + degraded") that enables diagnosis.

**Republication of an already-created device** (same `external_id`): the `params` are the **integration's technical data** — the supervisor compares them with those in DB and **silently upserts** them (add/update by `name`): a LAN IP that changes under DHCP, a cloud→local switch after a scan, without deleting/recreating the device. The features' **`supported_options`** get the same treatment (matched by feature `external_id`, synced only when the published feature carries the array — e.g. a camera preset renamed on the camera, see `docs/specs/camera-ptz-control.md` A.3). The `name`, the room and the rest of the features remain untouched (the user's property), and there is **no `device-updated` echo** to the integration (it is its own publication — otherwise a loop). If the published **structure** differs (features added/modified), the Discovery screen offers "Update" (B.8): a user gesture, via the standard `POST /api/v1/device`.

**Energy tracking is derived by the core, never by the integration.** A device publishing a **cumulative energy index** (`ENERGY_INDEX_FEATURE_TYPES`: `energy-sensor`/`index`, `energy-sensor`/`energy`, `switch`/`energy`, the `teleinformation` indexes) gets its **30-minutes consumption** feature and its **cost** feature added by the supervisor when the Discovery screen reads the list (`getDiscoveredDevices`), through the very same `addEnergyFeatures` helper Zigbee2mqtt and Tasmota already use. External ids are deterministic (`<index external_id>_consumption` and `_cost`), the consumption feature hangs off the index (`energy_parent_id`) and the cost off the consumption, and the index itself is attached to the **main electric meter** configured in the energy settings when the user has not attached it elsewhere. The whole energy-monitoring pipeline (30-minutes deltas, cost per contract, dashboard widgets, weekly digest) is service-agnostic, so it then works with no extra code in the container: **an integration declares its meter index and nothing else** — publishing the derived features itself is not the contract and duplicates nothing (they are matched on their `external_id`).

Consequences of this derivation:

- the derived features are **the core's, not the integration's**: they carry no state published over `POST /state` (the core computes them), the integration is free to ignore them entirely, and — like every published feature — their `selector` is resolved at creation by `buildUniqueSelector`, not by the container;
- an already-created device whose derived features are missing (created before this behavior existed, or index added later) shows as **`structure_changed`** in the Discovery screen: the user's "Update" gesture adds them, through the standard `POST /api/v1/device`, with no intervention from the integration;
- on republication, the derived features already in DB are reinjected with their **DB identity** before the derivation, so an "Update" updates those rows instead of duplicating them — including those an integration derived **itself** before the core did (found back through their `energy_parent_id`, reinjected under the deterministic name, so the "Update" renames the existing rows and their history survives the migration). A derived feature is dropped when its index feature **disappeared** from the publication or **stopped being an index** (type changed), and an integration still publishing them itself is never reinjected twice;
- the params holding the **cursors of the 30-minutes pipeline** (`ENERGY_INDEX_LAST_PROCESSED*`, `ENERGY_PRODUCTION_INDEX_LAST_PROCESSED*`) are reinjected the same way: they are the core's, the integration knows nothing about them, and `POST /api/v1/device` deletes the params missing from its payload — without this, an "Update" would restart the pipeline from scratch (skipped or rebuilt windows);
- the published in-memory list stays untouched — the derivation works on a copy, `POST /discovered_device` still round-trips exactly what the integration sent.

**`POST /api/integration/v1/device/transport`** — body `{ "transports": [ { "device_external_id": "ext:tuya-demo:plug1", "transport": "cloud", "degraded": true, "message": { "en": "Local session refused, falling back to cloud", "fr": "Session locale refusée, bascule cloud" } } ] }` (batch ≤ 100; `degraded` default `false`, `message` optional and only honored if `degraded`) → `200 { "success": true }`. Updates the affected devices' `GLADYS_TRANSPORT*` params **without republishing the discovered list** (the lightweight path for hot switches: the cloud link drops → `unreachable`, the LAN comes back → `local`) — an entry without `degraded` **clears** the degraded params (explicit return to nominal, no ghost orange state) — and pushes `device-transport-updated` to the frontend (real-time pills). Value outside `local|cloud|unreachable`, or `message` without `en` → `400`; an unknown `device_external_id` is silently ignored.

**`GET /api/integration/v1/device`** → `200 [ <device> ]` — the integration's devices **actually created by the user** (full standard format: `id`, `selector`, `features` with their `selector`/`last_value`, `params`).

**`GET /api/integration/v1/house`** → `200 [ { "id", "name", "selector", "latitude", "longitude" } ]` — the houses configured in Gladys, sorted by name (field need from the vigieau port, and generic to every geo-dependent integration: weather, air quality, pollen… the location is entered once in the core instead of being re-asked in each integration's config). **Requires `location: true` in the manifest** (shown on the install screen), `403 FORBIDDEN` otherwise — the home location is sensitive personal data, so access follows the same server-side-enforced authorization contract as the network captures. `latitude`/`longitude` are `null` when the user has not located the house, and several houses may exist: the integration handles both cases. Only these five fields are returned — never the alarm mode, code or delay. Coordinates change rarely: fetching at startup (and at reconnection) is the nominal pattern, there is no dedicated update event in v1.

**A `type: "weather"` integration needs neither this endpoint nor `location: true`**: the coordinates reach it in the `options` of every `weather.get` (B.18). The two patterns split on **who owns the use case**. When the *core* owns it, the core knows which house it is asking about and passes the coordinates in the request — scoped to that call, nothing to pull. `GET /house` is for the other direction: an integration that owns its own geo-dependent logic (water restrictions, pollen, air quality…), polls a third party at its own pace and publishes devices and states through the generic path — there is no core→integration call to carry the coordinates, so it pulls them itself. Growing a core capability per domain would not scale; that is precisely what the generic device/state path avoids.

**Known limit — the declaration is re-read at each update.** The gate reads the **stored** manifest, and an update replaces it wholesale (`externalIntegration.update.js`): an integration installed without `location` that adds `location: true` in a later version gains access as soon as the admin updates it, with no second disclosure. This is the same behavior as `network_discovery` and `webhooks`, and it differs from the hardware classes, whose grant is persisted apart from the manifest in `t_service.granted_devices` and therefore survives updates. Making consent survive updates for the declarative contracts (re-prompting when a new authorization request appears) is a design decision that spans all of them at once, not just this endpoint — it is left out of scope here and stated openly rather than implied away.

**`POST /api/integration/v1/state`** — batch of states, mapped onto `EVENTS.DEVICE.NEW_STATE` (same fields as `device.newStateEvent`):
```json
{
  "states": [
    { "device_feature_external_id": "ext:open-meteo-demo:paris:temperature", "state": 21.5 },
    { "device_feature_external_id": "ext:open-meteo-demo:cam:text", "text": "hello" },
    { "device_feature_external_id": "ext:open-meteo-demo:paris:temperature", "state": 19.2, "created_at": "2026-07-12T10:00:00.000Z" }
  ]
}
```
→ `200 { "success": true }`. Numeric `state` **or** string `text`; optional `created_at` for a past state. Max 100 states/request; **rate limit: 300 states/minute per integration**, `429 TOO_MANY_REQUESTS` beyond (SQLite/DuckDB anti-spam). The threshold is sized for **state changes**, not full snapshots: an integration polling a large fleet (e.g. 50 Tuya devices × 6 features) must **deduplicate** and only publish what changed — a best practice to write in the developer docs (B.12). An unknown `device_feature_external_id` is silently ignored (standard `newStateEvent` behavior: the user has not created that device).

**`POST /api/integration/v1/camera/image`** — body `{ "device_external_id": "ext:tuya-demo:cam", "image": "image/jpg;base64,/9j/4AAQ..." }` → `200 { "success": true }`. Publishes a **camera's new image**: a device of the integration carrying a `camera`/`image` feature (`DEVICE_FEATURE_CATEGORIES.CAMERA` + `DEVICE_FEATURE_TYPES.CAMERA.IMAGE`, declared like any feature in `discovered_device`), mapped onto `gladys.device.camera.setImage` — same format as the internal camera services (`image/jpg;base64,<data>`, see `rtsp-camera/lib/getImage.js:95`), the dashboard's camera widget updates in real time. Limits: **≤ 150 KB** (the core's bound, `camera.setImage.js`), **12 images/minute per device** (one every 5 s — continuous video streaming is not in the v1 scope, see `camera.start-streaming` phase 2), `404` if the device does not belong to the integration, `400` if it has no camera feature. Images **never** go through `POST /state`: a dedicated `saveStringState` path, outside the state history and outside the states rate limit.

**`GET /api/integration/v1/config`** → `200 { "config": { "latitude": 48.85, "unit": "celsius", "api_key": "s3cr3t" } }` — all values, secrets included (it is the integration, not the frontend).

**`POST /api/integration/v1/config`** — body `{ "config": { "<key>": <value> } }`, partial merge → `200 { "success": true }`. Keys present in the `config_schema` are validated against it; keys outside the schema are the integration's **free internal storage** (pairing state, third-party tokens…), never displayed in the UI.

**Sub-container lifecycle** — all these routes only know the `containers[]` entries of **this** integration's manifest (the JWT sets the perimeter, as everywhere): `404 NOT_FOUND` for any other `:name`. No route allows creating an undeclared container. None of these deliberate gestures increments `failure_count`.

**`GET /api/integration/v1/container`** → `200`
```json
{
  "containers": [
    { "name": "mqtt", "status": "running", "desired": "running", "started_at": "2026-07-13T08:00:00.000Z", "ports": [] },
    { "name": "frigate", "status": "stopped", "desired": "stopped", "started_at": null,
      "ports": [{ "container_port": 5000, "protocol": "tcp", "host_port": 42115, "label": { "en": "Frigate UI" }, "name": "frigate_ui", "browsable": true }],
      "devices": [{ "class": "coral-usb", "granted": true, "available": true }] }
  ]
}
```
— the declared sub-containers, their Docker state, the desired state (B.2), the assigned host ports and, per requested hardware class, the granted/available state (this is how the integration knows what to put in its config — e.g. `edgetpu` vs `cpu` detector for Frigate); empty list if the integration declares none.

**`POST /api/integration/v1/container/:name/start`** — body `{}` or `{ "env": { "MQTT_PASSWORD": "..." } }` → `200 { "success": true }`. Creates the container if it does not exist yet, then starts it; it enters the "running" desired state (restarted by the supervisor if it crashes). The provided `env` is merged **on top of** the manifest's `env` (`GLADYS_*` keys forbidden → `400`) — it is the channel for values computed at runtime; if the `env` differs from the existing container's, the supervisor **recreates** it (destroy + create, the `/data` volumes persist) before starting it.

**`POST /api/integration/v1/container/:name/stop`** — body `{}` → `200 { "success": true }`. Stops the container and removes it from the desired state: the supervisor will not restart it.

**`POST /api/integration/v1/container/:name/restart`** — body `{}` → `200 { "success": true }`. Typical use: the integration has rewritten one of the sub-container's config files via `/data` (see B.2) and restarts it to apply.

**`POST /api/integration/v1/network/wake`** — body `{ "mac": "64:e4:d5:b4:12:66", "address": "255.255.255.255", "port": 9, "sourcePort": 0 }` → `200 { "success": true }`. Sends a standard Wake-on-LAN magic packet from the Gladys core network namespace. **Requires `network_wake: true` in the manifest** (shown on the install screen); otherwise the core returns `403 FORBIDDEN`.
* mac is required. Accepted formats: 64:e4:d5:b4:12:66, 64-e4-d5-b4-12-66, or 64E4D5B41266.
* address is optional and defaults to 255.255.255.255.
* port is optional and defaults to UDP destination port 9.
* sourcePort is optional and defaults to 0 (ephemeral UDP source port chosen by the operating system).
* The core always builds the standard fixed 102-byte Wake-on-LAN magic packet (6 × 0xFF followed by the target MAC repeated 16 times). The integration cannot provide an arbitrary UDP payload, so this endpoint is not a general UDP proxy.
* The emission rate is bounded to 1 wake per 2 seconds per integration (`429 RATE_LIMIT_EXCEEDED` otherwise) — enough for the usual "retry until the device wakes up" loop, not enough to flood from the core's network namespace.
* A successful send returns 200 { "success": true }. This confirms that the packet was emitted by Gladys, not that the target device actually woke up.

### C.4 Integration WebSocket: protocol

Connection: same host/port as the host API (`ws://<gateway>:<port>/`, same HTTP server). Not authenticated within 5 s → connection terminated (existing behavior).

| Direction | `type` | `payload` |
|---|---|---|
| integration → core | `authenticate.integration-request` | `{ "token": "<JWT>" }` — **mandatory first message** |
| core → integration | `authentication.connected` | `{}` (reused as-is; failure = close code `4000` `INVALID_ACCESS_TOKEN`) |
| core → integration | `external-integration.device.set-value` | `{ "message_id": "uuid", "device": { "external_id", "selector", "params" }, "device_feature": { "external_id", "category", "type" }, "value": 1 }` |
| core → integration | `external-integration.device.poll` | `{ "message_id": "uuid", "device": { "external_id", "selector", "params" } }` — reading request for a device with a `poll_frequency`; states come back via `POST /state` |
| core → integration | `external-integration.camera.get-image` | `{ "message_id": "uuid", "device": { "external_id", "selector", "params" } }` — request for a **fresh** image (dashboard live view, chat intent "show me the camera": `camera.getLiveImage` → the proxy service's `device.getImage`); respond via `command-result` with `data: { "image": "image/jpg;base64,..." }` (≤ 150 KB); ack expected within **15 s** (an ffmpeg capture is possible), not 5 s |
| integration → core | `external-integration.command-result` | `{ "message_id": "uuid", "success": true, "data": { ... } }` or `{ "message_id": "uuid", "success": false, "error": "..." }` — ack of **every** command carrying a `message_id`, expected within **5 s**, otherwise the command fails on the core side; `data` is **optional**, for commands expecting a response (e.g. `oauth.get-authorize-url`; tomorrow `camera.get-image`) |
| core → integration | `external-integration.scan-request` | `{}` — the integration responds by republishing `POST /discovered_device` |
| core → integration | `external-integration.device-created` / `.device-updated` / `.device-deleted` | `{ "device": <standard device> }` (relay of the `postCreate`/`postUpdate`/`postDelete` hooks) |
| core → integration | `external-integration.config-updated` | `{ "config": { ... } }` — complete new values (no need to re-fetch) |
| core → integration | `external-integration.hardware-updated` | `{ "containers": [ { "name", "devices": [{ "class", "granted", "available" }] } ] }` — the user changed the hardware grants (B.2); the affected sub-containers have been recreated, it is up to the integration to regenerate its configs and (re)start what is needed |
| core → integration | `external-integration.message.send` | `{ "message_id": "uuid", "contact": { ... }, "message": { "text": "...", "file": "image/jpg;base64,..." \| null } }` — a brain reply or a notification to deliver on the channel ("communication" type, B.15); `contact` carries the resolved identity (see B.15). **`text` is Markdown** — the brain and the AI produce it (`**27 °C**`, headings, lists, `code`) —, it is up to the integration to render it into its channel's format: HTML for Telegram, native Markdown for a channel that handles it, plain text otherwise. An integration delivering `text` as-is shows the syntax to the user |
| core → integration | `external-integration.weather.get` | `{ "message_id": "uuid", "options": { "latitude": 48.85, "longitude": 2.35, "language": "fr", "units": "metric" \| "us" } }` — the core asks a "weather" integration (B.18) for the weather; respond via `command-result` with `data: { "weather": <pivot format, B.18> }`, values in the requested unit system; ack expected within **15 s** (a third-party API call, same exception as `camera.get-image`); the payload is normalized and bounded by the core before use |
| core → integration | `external-integration.weather.get-image` | `{ "message_id": "uuid", "key": "vigilance-map" }` — the core asks for a provider image declared in the pivot's `images` (B.18 point 6); respond via `command-result` with `data: { "image": "<raw base64, no data-URI prefix>" }` — decoded bytes ≤ 500 KB, PNG or JPEG only (magic numbers checked by the core); ack within **15 s**; the core caches the validated image 10 min and only ever sends a `key` declared in the integration's last normalized weather payload (undeclared keys 404 core-side) |
| integration → core | `external-integration.weather.refresh` | `{}` — freshness nudge (B.18 point 5): "re-pull me now and re-evaluate the alert scene triggers"; no `message_id`, no ack, fire-and-forget; accepted from "weather" integrations only; rate-limited to 1/min per integration, silently dropped beyond |
| core → integration | `external-integration.oauth.get-authorize-url` | `{ "message_id": "uuid", "key": "netatmo_account", "redirect_uri": "https://..." }` — the user clicked "Connect" on an `oauth2` or an `account_link` field (C.1); respond via `command-result` with `data: { "authorize_url": "https://..." }`. `redirect_uri` is absent for an `account_link` field, which has none |
| core → integration | `external-integration.oauth.callback` | `{ "message_id": "uuid", "key": "netatmo_account", "code": "...", "state": "...", "redirect_uri": "https://..." }` — return from the provider; the integration verifies `state`, exchanges the tokens, stores them (`POST /config` outside the schema) and acks |
| core → integration | `external-integration.action.run` | `{ "message_id": "uuid", "key": "detect_protocol", "fields": { "ip": "192.168.1.42" } }` — the user clicked an action button (C.1); respond via `command-result` with `data: { "message": "..." }` (string or multi-language); the ack is expected within the action's **declared `timeout_seconds`** (not 5 s) |
| integration → core | `external-integration.heartbeat` | `{}` — application-level, optional if the WS lib answers protocol pings |

Command naming convention: **one specific type per action**, `external-integration.<domain>.<action>` — no generic type with an `action` field. Future commands (phase 2: `webhook.received`/`webhook.request` for the Gladys Plus webhooks (B.17), `camera.start-streaming` for continuous video streaming… depending on the integration types added) will follow this scheme, each with `message_id` + `command-result` ack (unless a documented exception, e.g. `webhook.received` deliberately without an ack, see B.17); an integration silently ignores a type it does not know.

Protocol reliability rules:
- **No queue**: core→integration messages (`device-created/updated/deleted`, `config-updated`, `scan-request`) emitted during a disconnection are **lost**. Contract: on every (re)connection, the integration redoes `GET /device` and `GET /config` to resynchronize its state — the SDK does it automatically.
- **No config echo**: `config-updated` is only pushed for changes coming from the frontend; a `POST /config` from the integration itself never triggers a `config-updated` back (otherwise a loop).
- **`command-result` with `success: false`**: treated on the core side exactly like a timeout — throw (`ExternalIntegrationUnavailableError` or the relayed error message), error visible in the device UI.
- **At most once, never re-emitted**: the core has **no retry mechanism** — each command is emitted once; timeout, `success: false` or disconnected integration → throw, the error surfaces to the user, who decides whether to redo their gesture. A lost ack can therefore never cause a core-initiated double execution, and integrations have **no `message_id` deduplication to implement** (an already-seen `message_id` may be ignored out of caution, but the protocol does not require it).

Health: the core sends a **protocol-level WebSocket ping** every 20 s; any standard WS lib answers it automatically (pong). 2 missed pongs or a closed socket → `DEGRADED` status. A reconnection replaces the previously registered connection.

Core → frontend messages (real-time UI, on the existing user WS): `external-integration.status-changed` `{ "selector", "status" }`, `external-integration.discovered-devices-updated` `{ "selector" }`, `external-integration.connection-status-updated` `{ "selector", "connected", "message" }` (see C.3) and `external-integration.device-transport-updated` `{ "selector", "transports": [ { "device_external_id", "transport", "degraded", "message" } ] }` (pills, see C.3).

### C.5 Management API (frontend ↔ server)

Routes `/api/v1/external_integration`, standard Gladys user auth; **admin** required for anything that modifies, and for everything that concerns the administration of an integration (store, hardware, configuration, discovery, supervision, logs). A **non-admin** user only has access to what they need to link **their own** account on a communication integration (B.15) — everything else answers `403`: the list and the detail **of the communication integrations only** (a `type: "device"` selector answers the same `404` as an unknown selector, so probing selectors reveals nothing), in their **reduced view** (`{ id, name, selector, status, store_slug, manifest }` — no resolved `docker_image`, no `containers`, no `webhooks`: the webhook URLs embed the Gladys Plus Open API key; the `manifest` stays whole, it is the public description published by the store, image reference included), plus the per-user contact routes.

⚠️ **Literal routes vs `:selector` collision**: routes are registered in Express in the declaration order of the `routes.js` object (`setupRoutes.js` iterates `Object.keys`). The literal routes `store`, `store/refresh` and `hardware` must therefore be declared **before** `:selector` — an existing precedent in the code: `get /api/v1/device/duckdb_migration_state` declared before `get /api/v1/device/:device_selector`. Double protection: integration selectors are prefixed `ext-` (B.1), so `store` or `hardware` can never be valid selectors; and a dedicated test verifies that `GET .../store` returns the catalog (not the detail handler), to break CI if someone reorders the routes.

| Method & route | Body → Response |
|---|---|
| `GET /api/v1/external_integration` | → `[ { "id", "name", "selector", "status", "version", "docker_image", "store_slug", "manifest", "update_available", "latest_version" } ]` (`latest_version`: the latest version known for the integration — B.9 —, `null` when unknown); **non-admin**: only the installed `type: "communication"` integrations, in their reduced view |
| `GET .../:selector` | → detail (same fields, + the main container's `"started_at"`, + `"connection_status": { "connected", "message" }` (C.3), + `"containers": [ { "name", "status", "desired", "started_at", "ports": [{ "container_port", "protocol", "host_port", "label", "name", "browsable" }], "devices": [{ "class", "granted", "available" }] } ]` for multi-container ones — the same state as `GET /container` (C.3), from which the frontend derives the "Open" links (`browsable: false` → host port displayed without link) and the `{{port:<name>}}` placeholder values (C.1)); **non-admin**: the reduced view on a communication integration, `404` on any other (indistinguishable from an unknown selector) |
| `GET /api/v1/external_integration/store` *(admin)* | → `{ "refreshed_at", "integrations": [ { "store_slug", "manifest": <manifest>, "github": { "stars", "pushed_at" }, "categories": ["climate"], "first_seen_at": "2026-08-01T00:00:00.000Z", "installed": false, "update_available": false, "compatible": true } ] }` (filtered by `gladys_version`). `categories` is the index-level value (C.6) filtered against the vocabulary the core knows — unknown keys are dropped, `[]` = uncategorized; `first_seen_at` is passed through, `null` when the index does not carry it |
| `POST .../store/refresh` *(admin)* | `{}` → index re-downloaded, same response as `GET .../store` |
| `GET /api/v1/external_integration/hardware` *(admin)* | → `{ "classes": [ { "class": "coral-usb", "detected": true }, { "class": "gpu", "detected": false }, ... ] }` — detection on the host (`system.detectHardwareClasses()`, see B.2); feeds the install screen's toggles |
| `POST /api/v1/external_integration` *(admin)* | `{ "store_slug": "john/gladys-open-meteo-demo" }` **or** `{ "repo_url": "https://github.com/john/gladys-open-meteo-demo" }` **or** `{ "docker_image": "...", "manifest": {...} }` (dev mode); + optional `"granted_devices": ["coral-usb"]` (the install screen's toggles; classes not requested by the manifest → `422`) → `201` detail; `repo_url`: `422` if the manifest is absent/invalid in the repo, `404` if the repo is not found |
| `POST .../:selector/start` / `stop` / `restart` / `update` *(admin)* | `{}` → `200` detail (up-to-date status) |
| `POST .../:selector/hardware` *(admin)* | `{ "granted_devices": ["coral-usb", "gpu"] }` (complete granted list, replaces the previous one; non-requested classes → `422`) → `200` detail — recreates the affected sub-containers + pushes `hardware-updated` to the integration (B.2) |
| `GET .../:selector/logs?lines=200&container=frigate` *(admin)* | → `{ "logs": "<raw stdout/stderr via docker logs>" }`; `container` optional (default: the main container), `404` if not declared |
| `GET .../:selector/discovered_device` *(admin)* | → `[ { ...discovered device, "created": false } ]` (flag = a device with this `external_id` already exists) |
| `POST .../:selector/scan` *(admin)* | `{}` → `200 { "success": true }` (relays `scan-request`; `400` if the integration is disconnected) |
| `GET .../:selector/config` *(admin)* | → `{ "config": { "latitude": 48.85, "api_key": null }, "configured_secrets": ["api_key"] }` — `secret`s are always `null`, the flag says whether they are set |
| `POST .../:selector/config` *(admin)* | `{ "config": {...} }` validated against the `config_schema` (`422` otherwise) → `200` + `config-updated` push to the integration; a `secret` set to `null` = unchanged |
| `POST .../:selector/oauth/authorize_url` *(admin)* | `{ "key", "redirect_uri" }` → `200 { "authorize_url": "https://..." }` — WS relay `oauth.get-authorize-url` (C.4, response via `command-result.data`); `redirect_uri` is required for an `oauth2` field and ignored for an `account_link` one; `400` if the field is neither of those types or if the integration is disconnected |
| `POST .../:selector/oauth/callback` *(admin)* | `{ "key", "code", "state", "redirect_uri" }` → `200 { "success": true }` — WS relay `oauth.callback`; a failure on the integration side (`success: false`) surfaces as `422` with its message |
| `POST .../:selector/action/:key` *(admin)* | `{ "fields": {...} }` validated against the action's `fields` (`422` otherwise) → `200 { "success": true, "message": ... }` — WS relay `action.run`, wait = the action's `timeout_seconds`; `success: false` → `422` with the message; `404` if `:key` is not declared; `400` if the integration is disconnected |
| `DELETE .../:selector` *(admin)* | → `200 { "success": true }` — removes **everything**: container, devices, config variables, `t_service` row (explicit confirmation in the UI) |

### C.6 Formats published by the indexer

**`index.json`** (GitHub Pages, consumed by every Gladys):
```json
{
  "index_format": 1,
  "generated_at": "2026-07-13T08:00:00.000Z",
  "integrations": [
    {
      "store_slug": "john/gladys-open-meteo-demo",
      "repo_url": "https://github.com/john/gladys-open-meteo-demo",
      "manifest": { "...": "full validated manifest (C.1)" },
      "cover_url": "https://<store-pages>/covers/john--gladys-open-meteo-demo.jpg",
      "docs": {
        "en": "https://<store-pages>/docs/john--gladys-open-meteo-demo/en.md",
        "fr": "https://<store-pages>/docs/john--gladys-open-meteo-demo/fr.md"
      },
      "github": { "stars": 12, "pushed_at": "2026-07-10T12:00:00.000Z", "owner_avatar_url": "https://..." },
      "categories": ["environment"],
      "first_seen_at": "2026-08-01T00:00:00.000Z"
    }
  ]
}
```

Two entry-level fields feed the catalog navigation (`integration-catalog-categories.md`): **`categories`** — the manifest's `categories` when present and valid, else the entry of the fallback mapping file maintained in this repo (keyed by `store_slug`), else `[]` (uncategorized, author-facing warning in `rejected.json`) — and **`first_seen_at`** — first indexing date of the `store_slug`, persisted across rebuilds and seeded on backfill from the repo `created_at`, else the first commit date, else the `generated_at` of the oldest index containing the slug (never `github.pushed_at`). Cores that predate these fields ignore them: their `getCatalog` projection copies an explicit list of entry fields.

**`rejected.json`** (public self-service diagnosis; `level: "error"` = not indexed, `level: "warning"` = indexed with degradation, e.g. cover replaced by a placeholder):
```json
[
  { "store_slug": "jane/my-integration", "level": "error", "reason": "manifest.version: must be valid semver", "checked_at": "2026-07-13T08:00:00.000Z" },
  { "store_slug": "bob/gladys-foo", "level": "warning", "reason": "cover_image: expected 800x534, got 1200x800 — placeholder used", "checked_at": "2026-07-13T08:00:00.000Z" }
]
```

### C.7 The integration container: Docker descriptor and environment

Complete `createContainer` descriptor (generated by `buildContainerDescriptor.js`, same format as the internal services' descriptors, e.g. `server/services/zigbee2mqtt/docker/*.json`):

```json
{
  "name": "gladys-ext-john-gladys-open-meteo-demo",
  "Image": "ghcr.io/john/gladys-open-meteo-demo:1.2.0",
  "Labels": {
    "io.gladysassistant.external-integration": "ext-john-gladys-open-meteo-demo"
  },
  "Env": [
    "GLADYS_HOST_API_URL=http://172.30.0.1:80",
    "GLADYS_INTEGRATION_TOKEN=<JWT>",
    "GLADYS_INTEGRATION_SELECTOR=ext-john-gladys-open-meteo-demo",
    "TZ=Europe/Paris"
  ],
  "HostConfig": {
    "NetworkMode": "gladys-integrations",
    "RestartPolicy": { "Name": "no" },
    "ReadonlyRootfs": true,
    "CapDrop": ["ALL"],
    "SecurityOpt": ["no-new-privileges"],
    "Memory": 268435456,
    "MemorySwap": 268435456,
    "NanoCpus": 500000000,
    "PidsLimit": 100,
    "Binds": ["/var/lib/gladysassistant/external-integrations/ext-john-gladys-open-meteo-demo:/data"],
    "Tmpfs": { "/tmp": "rw,noexec,nosuid,size=64m" },
    "LogConfig": { "Type": "json-file", "Config": { "max-size": "10m", "max-file": "2" } }
  },
  "AttachStdin": false,
  "AttachStdout": false,
  "AttachStderr": false,
  "Tty": false
}
```

Field-by-field justification:

| Field | Value | Why |
|---|---|---|
| `name` | `gladys-<selector>` | findable/debuggable in `docker ps`; uniqueness guaranteed by the selector |
| `Labels` | selector as the value | **reconciliation key** at boot and after backup/restore (B.2); also lets us find orphan containers of uninstalled integrations |
| `NetworkMode` | `gladys-integrations` | dedicated bridge, `enable_icc=false` (B.2 networking) |
| `RestartPolicy` | `no` | it is the **supervisor** that restarts (backoff + state machine); a Docker `always` policy would bypass it |
| `ReadonlyRootfs` | `true` | only `/data` and `/tmp` are writable |
| `CapDrop` | `ALL` | no Linux capabilities |
| `SecurityOpt` | `no-new-privileges` | no escalation via setuid binaries |
| `Memory`/`MemorySwap` | 256 MB (same values) | swap = memory ⇒ **no swap**; OOM kill → supervised restart |
| `NanoCpus` | `500000000` (0.5 CPU) | an integration cannot starve Gladys on a Raspberry Pi; **omitted** when the Docker `/info` API reports `CpuCfsQuota: false` or `CpuCfsPeriod: false` (e.g. Synology DSM kernels without the CFS scheduler), otherwise the daemon rejects the creation — and every later start, since Docker re-validates the stored `HostConfig` at start — with an HTTP 400. Two recovery paths when the detection is wrong or the kernel lost CFS support after the container was created (NAS update): the creation retries once without the limit (remembering the lack of support for later descriptors), and a container rejected at start is **recreated without the limit** — supervised fallback of `start` for the main container, dedicated recreate in `startSubContainer` for sub-containers (see the sub-container Limits row) |
| `PidsLimit` | 100 | anti fork-bomb |
| `Binds` | a single one: `<basePath>/external-integrations/<selector>:/data` | the integration's local persistence; survives container recreations, removed at uninstall; **precreated and handed to uid/gid 1000 by the supervisor** before every creation (non-recursive, best-effort — see B.2): Docker would create a missing source `root:root`, unwritable for `USER node` |
| `Tmpfs /tmp` | `noexec,nosuid,64m` | scratch in RAM, no execution of dropped binaries |
| `LogConfig` | json-file 10 MB × 2 | bounds the disk (logs are read via `docker logs`, see B.2); same values as Gladys's `docker run` |
| `User` | *(not forced)* | the image chooses its user; the template sets `USER node` — forcing an arbitrary uid would break legitimate images; the `/data` ownership convention (uid/gid 1000, see `Binds`) follows that template convention, an image running as another non-root uid must manage `/data` permissions itself |

**What is never granted, to any container**: no `Privileged`, no mounting of the Docker socket (additional containers go through the `containers` declaration + the `/container` API), no `NetworkMode: host`. The **main** container additionally has neither published ports nor devices (empty `ExposedPorts`/`PortBindings`/`Devices` — its inbound channel is the outbound WS): ports and hardware only exist on **sub-containers**, only as declared in the manifest and approved at install.

**Sub-containers: descriptor.** Each `containers[]` entry of the manifest (C.1) produces a container `gladys-<selector>-<name>` with the **same lockdown** as the main one (`CapDrop ALL`, `no-new-privileges`, `RestartPolicy no`, `PidsLimit 100`, bounded `LogConfig`, `/tmp` tmpfs), with these differences:

| Aspect | Sub-container |
|---|---|
| Network | **only** the private bridge `gladys-int-<selector>` (icc enabled, DNS alias = `name`); never `gladys-integrations` → no host API access |
| Env | the manifest's static `env`, overridden by the `env` of `POST /container/:name/start` (C.3), + `TZ`; **no** `GLADYS_*` variable (no token — a sub-container has no Gladys identity) |
| Volumes | each `volumes[]` entry → bind `<basePath>/external-integrations/<selector>/containers/<name><path>` — host path **derived by the supervisor**, never provided by the manifest; the main container sees them under its `/data/containers/<name>/...`; bind sources **precreated by the supervisor** (created folders owned by uid/gid 1000, root-owned existing folders repaired, other uids preserved — see B.2) |
| Ports | `PortBindings` only for the declared `ports[]` — host port **chosen by Gladys** (free at first start, then persisted), bound to `0.0.0.0` (LAN access assumed and displayed at install, see B.14.8) |
| Devices | `Devices` = intersection **requested (manifest) ∩ granted (`granted_devices`, UI toggles) ∩ present (detection)** — classes resolved by the supervisor: `coral-usb` → `/dev/bus/usb`, `coral-pcie` → `/dev/apex_*`, `gpu` → `/dev/dri`, `video` → `/dev/video*`; recomputed at every container creation |
| Rootfs | `ReadonlyRootfs` per the manifest's `read_only` (default `true`) |
| Limits | `Memory`/`MemorySwap` = `memory_mb` (default 256), `NanoCpus` = `cpu` (default 0.5, omitted like on the main container when the kernel has no CFS scheduler; an existing sub-container whose stored CPU limit is rejected at start is recreated without it, after marking the support as absent), `ShmSize` = `shm_mb` (default 64) — manifest values, displayed at install |
| Labels | `io.gladysassistant.external-integration: <selector>` (same reconciliation key as the main one — a single filter catches the whole group) + `io.gladysassistant.container: <name>` |

The private network `gladys-int-<selector>` is created at install and carries the same label — uninstall and boot-time reconciliation remove containers **and** network through the same filter.

**Injected environment variables** (complete contract — nothing else is passed):

| Variable | Example | Role |
|---|---|---|
| `GLADYS_HOST_API_URL` | `http://172.30.0.1:80` | base of the host API (C.2), no trailing slash; the WS URL derives from it (`http→ws`, same host/port). **Nominal value: `http://172.30.0.1:80`** — bridge gateway pinned via IPAM + `SERVER_PORT` (80 on the standard install). Degraded cases: subnet taken → auto-assigned gateway read via `inspectNetwork`; Gladys in bridge mode → DNS alias `http://gladys:<port>` (B.2 networking). **The integration must always read the variable**, never hardcode the URL — the variable is the contract, its value is only predictable for debugging |
| `GLADYS_INTEGRATION_TOKEN` | JWT | REST auth (`Authorization: Bearer`) and WS auth (`authenticate.integration-request`); regenerated on **every recreation** of the container (`token_version++`, B.3) |
| `GLADYS_INTEGRATION_SELECTOR` | `ext-john-gladys-open-meteo-demo` | the integration's selector, to build the `external_id`s (`ext:<selector>:...`) |
| `TZ` | `Europe/Paris` | timezone configured in Gladys (system variable `TIMEZONE`), for consistent logs and crons |

Container recreation (update, token regeneration, descriptor change) = destroy + create with the same `Binds`: `/data` is the container's only persistent memory, everything else is disposable by design.

### C.8 JS SDK: public API of `@gladysassistant/integration-sdk`

Complete example (the demo fits in ~40 lines):

```js
const { GladysIntegration } = require('@gladysassistant/integration-sdk');

// All options are read from the container's env vars (C.7) by default;
// they can be overridden for development outside Docker.
const gladys = new GladysIntegration();

gladys.onScanRequest(async () => {
  await gladys.publishDiscoveredDevices([
    {
      name: 'Virtual switch',
      external_id: gladys.externalId('switch'),
      features: [
        {
          name: 'On/Off',
          external_id: gladys.externalId('switch:binary'),
          category: 'switch',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true,
          keep_history: true
        }
      ]
    }
  ]);
});

gladys.onSetValue(async (device, feature, value) => {
  // resolving = ack success:true; throwing = ack success:false + message
  await gladys.publishState(feature.external_id, value);
});

gladys.onConfigUpdated(async (config) => {
  console.log('New config', config); // stdout → docker logs
});

await gladys.connect(); // resolves once authenticated
```

**Constructor** — `new GladysIntegration(options?)`: `hostApiUrl` (default `GLADYS_HOST_API_URL`), `token` (default `GLADYS_INTEGRATION_TOKEN`), `selector` (default `GLADYS_INTEGRATION_SELECTOR`). Throws immediately if a value is missing (neither option nor env var).

**Methods** (all return Promises; HTTP errors are thrown as `GladysApiError { status, code, message }`):

| Method | Contract |
|---|---|
| `connect()` | opens the WS, authenticates (`authenticate.integration-request`), **resynchronizes** (`GET /device` + `GET /config`, see C.4 reliability), then resolves. Automatic reconnection for life with backoff `min(1s·2^n, 60s)`; each reconnection redoes auth + resync |
| `disconnect()` | closes cleanly (no more reconnection) |
| `externalId(suffix)` | helper → `` `ext:${selector}:${suffix}` `` (the only documented way to build an `external_id`) |
| `publishDiscoveredDevices(devices)` | `POST /discovered_device` (complete list, replaces the previous one — max 2000 devices, 20 MB body, see C.3) |
| `getDevices()` | `GET /device` → devices created by the user; also updates `gladys.devices` |
| `getHouses()` | `GET /house` → houses with their coordinates (requires `location: true` in the manifest, see C.1/C.3; `latitude`/`longitude` nullable, several houses possible) |
| `publishState(featureExternalId, value)` | `POST /state` — `value` number, or `{ text }`, or `{ state, created_at }` for a past state |
| `publishStates(states)` | batch `POST /state` (max 100, see C.3) |
| `publishCameraImage(deviceExternalId, imageBase64)` | `POST /camera/image` — a camera's new image (format `image/jpg;base64,...`, ≤ 150 KB, see C.3) |
| `publishTransports(transports)` | batch `POST /device/transport` — `[{ external_id, transport: 'local' \| 'cloud' \| 'unreachable', degraded?, message? }]` (pills + degraded state, see C.3); the user preference arrives in `gladys.config.GLADYS_PREFER_LOCAL` |
| `getConfig()` / `setConfig(partialConfig)` | `GET` / `POST /config`; `getConfig` also updates `gladys.config` |
| `getStatus()` | `GET /status` |
| `setConnectionStatus(connected, message?)` | `POST /connection_status` — application-level status displayed in the UI (C.3); optional multi-language `message` |
| `getContainers()` | `GET /container` → declared sub-containers, state, desired state, assigned host ports (C.3) |
| `startContainer(name, { env }?)` | `POST /container/:name/start` — typically after generating its config files in `/data` (the Mosquitto pattern, see B.2); optional `env` for values computed at runtime |
| `stopContainer(name)` | `POST /container/:name/stop` — the supervisor will not restart it |
| `restartContainer(name)` | `POST /container/:name/restart` — after rewriting its config via `/data` (the Frigate pattern, see B.2) |

**Handlers** (registered before `connect()`; **automatic ack** for commands: the handler resolves → `command-result success:true` — and if the resolved value is not `undefined`, it goes into `data` (C.4) —, it throws → `success:false` with `error.message`, handler absent → `success:false "not implemented"`):

| Handler | Callback signature |
|---|---|
| `onSetValue(cb)` | `(device, deviceFeature, value) => Promise` |
| `onPoll(cb)` | `(device) => Promise` (respond by publishing the states via `publishState`) |
| `onGetImage(cb)` | `(device) => Promise<string>` — capture and resolve a fresh image (`image/jpg;base64,...`); it goes into `data.image` (C.4, 15 s delay) |
| `onScanRequest(cb)` | `() => Promise` (respond via `publishDiscoveredDevices`) |
| `onDeviceCreated(cb)` / `onDeviceUpdated(cb)` / `onDeviceDeleted(cb)` | `(device) => Promise` |
| `onConfigUpdated(cb)` | `(config) => Promise` (complete values, see C.4) |
| `onHardwareUpdated(cb)` | `(containers) => Promise` — the hardware grants changed (C.4): regenerate the affected configs then `startContainer`/`restartContainer` |
| `onOAuthAuthorizeUrl(cb)` | `(key, redirectUri) => Promise<string>` — build the authorization URL (client_id from the config, scopes, `state` generated and retained); the resolved string goes into `data.authorize_url` |
| `onOAuthCallback(cb)` | `(key, { code, state, redirectUri }) => Promise` — verify `state`, exchange the tokens, store them via `setConfig` (keys outside the schema), then `setConnectionStatus(true)` |
| `onAction(key, cb)` | `(fields) => Promise<string \| object>` — handler of a declared action (C.1), registered by `key`; the resolved value goes into `data.message` (the ack delay is the action's `timeout_seconds`) |
| `onWeatherGet(cb)` | `(options) => Promise<object>` — "weather" type only (B.18): `options = { latitude, longitude, language, units }`; resolve the pivot weather format (values in the requested unit system), it goes into `data.weather` (C.4, 15 s delay) |
| `onWeatherGetImage(cb)` | `(key) => Promise<string>` — "weather" type only (B.18 point 6): resolve the raw base64 (no data-URI prefix) of the declared image (PNG/JPEG, ≤ 500 KB decoded); it goes into `data.image` (C.4, 15 s delay) |
| `requestWeatherRefresh()` | fire-and-forget freshness nudge (C.4, B.18 point 5): asks the core to re-pull the weather now and re-evaluate the alert scene triggers; rate-limited core-side (1/min, silently dropped) |

**Local state held by the SDK** (refreshed on every (re)connection and by the `device-created/updated/deleted` and `config-updated` events): `gladys.devices` (array), `gladys.config` (object), `gladys.connected` (boolean). Observable lifecycle: `gladys.on('connected')`, `gladys.on('disconnected')` (the class extends `EventEmitter`) — useful to suspend a poll while Gladys is unreachable.

**Behavior guarantees**: answers protocol-level WS pings (native to the `ws` lib); logs nothing by default (stdout belongs to the integration) except with `DEBUG=gladys-integration-sdk`; no state persisted to disk by the SDK (everything resynchronizes, `/data` stays in the integration's hands); an unknown message type is silently ignored (forward compatibility, see C.4).

## Repo ecosystem

The section C contracts decouple five repos; the `manifest.schema.json` has a **canonical owner: `GladysAssistant/integration-store`** (published on Pages next to the index), the monorepo embeds a vendored copy.

| Repo | Role | Sections |
|---|---|---|
| `GladysAssistant/Gladys` (monorepo) | Supervisor, host API, WS, server-side store, frontend — **and this spec** | B.1–B.9, B.13, C.2–C.5, C.7 |
| `GladysAssistant/integration-store` | Indexer (GitHub Action) + `index.json` on Pages; canonical manifest schema | B.9, C.1, C.6 |
| `GladysAssistant/integration-sdk-js` | npm package `@gladysassistant/integration-sdk` — depends only on the C contracts, no monorepo import | B.10, C.8 |
| `GladysAssistant/integration-template-js` | Official template repository + PoC of the e2e journey (published in the store as a third-party dev would) | B.11, C.1, C.7 |
| `GladysAssistant/v4-website` | Public documentation fr + en (transposition of sections B/C — the spec remains the source of truth) | B.12 |

## Verification

1. `cd server && npm test` (100% patch coverage), `npm run compare-translations` on the frontend side, lint of both workspaces.
2. **Manual e2e journey** (environment with the Docker socket): publish the `integration-template-js` template repo (B.11) as a third-party dev would (`gladys-assistant-integration` topic + `gladys-assistant-integration.json` at the root + multi-arch image pushed to a public registry) → wait for/trigger the indexing → the demo appears in the Gladys catalog with the "external" badge, **with no approval whatsoever** → one-click install (warning screen) → the card appears in the list with the "external" badge, status `Starting → Running` in real time → Configuration screen: latitude/longitude form generated from the `config_schema`, save → the integration receives `CONFIG_UPDATED` → the demo devices appear in the Discovery screen → creation from the UI → the integration receives `DEVICE_CREATED` and publishes its states, devices visible in the Devices screen and the dashboard → actuate the virtual switch (command received in the container logs, state republished) → `docker kill` of the container → `Degraded` status then auto restart → force 5 crashes → `Broken` status with visible logs and a restart button → bump `version` in the template repo's manifest → after re-indexing, "update available" badge → one-click update (new container, old JWT invalidated) → clean uninstall (container removed, `t_service` row destroyed, old JWT refused).
3. Manual isolation test: call the host API with one integration's token on another's devices → 403/404; with a user access token → 401 (wrong audience); with a token of an old `token_version` after container recreation → 401.
4. **Unicast LAN access test** (B.2 guarantee, vital for Tuya/Shelly & co): from an installed integration's container, reach a LAN IP in unicast (e.g. `wget -qO- http://<router-ip>` or a TCP connection to a device) → OK through the bridge NAT; redo the test with ufw enabled to document the FORWARD troubleshooting in the docs (B.12).
5. **Manual multi-container test**: install (dev mode) a manifest declaring an `mqtt` sub-container (`eclipse-mosquitto` image, `start: "manual"`, one published port) and a hardware class (`gpu`) → the install screen lists the sub-container, its port, its limits, and the Hardware row with the detection state + toggle (leave it unchecked: `GET /container` shows `granted: false`, nothing is mounted; enable it later from the Configuration screen's Hardware section → sub-container recreated, the integration receives `hardware-updated`) → after install, private network `gladys-int-<selector>` created, `mqtt` **not started yet** → the main container writes the password file via `/data/containers/mqtt/` then `POST /container/mqtt/start` → broker started, reachable at `mqtt:1883` via DNS, assigned host port visible in `GET /container` and clickable in the supervision block → `docker kill` of the sub-container → restarted by the supervisor (desired state, backoff, `failure_count`) → `POST /container/mqtt/stop` → stays stopped (no auto restart) → uninstall → `docker ps -a` and `docker network ls` clean, port freed, data folder deleted.
