> Part of the [external integrations living spec](README.md) — the layout, the editing rules and the cross-repo map are there.

# A. Overall architecture

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

## Deliverable phases

| Phase | Content | Observable deliverable |
|---|---|---|
| **1** *(shipped)* | Host API + WS, supervisor, auth, admin API, **decentralized store** (indexer + catalog + 1-click install + updates), frontend on par with internal integrations: entry in the catalog ("external" badge) + generic 3-screen page Devices / Discovery / Configuration (form generated from the `config_schema`), Node SDK (dedicated repo), template/PoC (dedicated repo), **public documentation on the website** (internal vs external + developer guide). "Dev" install by Docker image kept. | Any dev tags their repo → their integration appears in the catalog of every Gladys with no approval whatsoever → a user installs it in one click, its discovered devices are created from the UI, actionable, configurable via the generated form; the integration survives a kill (auto restart), goes "Broken" with logs after repeated failures. |
| **2** | Mediated network discovery *(shipped)* (passive listening **and active scan** broadcast/mDNS/SSDP by the core — full design in B.16), inbound webhooks via Gladys Plus *(shipped)* (generic gateway → integration relay, full design in B.17), advanced config widgets, device-scoped actions (`scope: "device"`, button on the device card — in v1 the `source: "devices"` select covers the need, see C.1), integration types other than "Devices" — first the "communication" type to move Telegram & co out of the core *(shipped, full design in B.15)*, then the "weather" type *(shipped, full design in B.18)*. | An integration detects its hardware without manual config; a messaging channel installs from the store; a weather provider (Météo France…) installs from the store and feeds the dashboard weather widget and the assistant. |
| **3** | Ecosystem: community SDKs in other languages, store ranking/stats, supply-chain hardening (digest pinning, image signing?). | Self-sufficient ecosystem, with no maintainer intervention. |
