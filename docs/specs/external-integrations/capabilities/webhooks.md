> Part of the [external integrations living spec](../README.md) — the layout, the editing rules and the cross-repo map are there.

# B.17 Inbound webhooks via Gladys Plus (phase 2, shipped)

Problem: third-party services push their events by webhook (Netatmo: setpoint changes in ~2-3 s instead of the 2-min poll), but a local Gladys instance is not reachable from the Internet. The core has already solved this **for Netatmo** (PR #2627) via a Gladys Plus gateway route wired in 2021: `POST https://api.gladysgateway.com/v1/api/netatmo/:open_api_key` relays the raw body to the instance over the Plus WebSocket (`gladys-open-api` message). The external Netatmo port is blocked on it: the gateway → integration container path does not exist. We industrialize — **for all integrations, without the gateway knowing any of them**.

**Declaration in the manifest** — optional `webhooks` field (≤ 3), displayed at install ("will be able to receive events from the Internet via Gladys Plus"):

```json
"webhooks": [
  { "key": "events", "label": { "en": "Netatmo events" }, "mode": "fire_and_forget" },
  { "key": "callback", "label": { "en": "Subscription callback" }, "mode": "sync" }
]
```

Two modes, because both exist in the field: **`fire_and_forget`** (default) — the third party pushes and only expects an acknowledgment (the Netatmo class); **`sync`** — the caller waits for the **integration's response** (registration challenge/response à la Strava/Microsoft Graph, application-level returns).

**Cloud side (repo `GladysAssistant/gladys-gateway`, outside the ecosystem listed in the spec's `../README.md` — carried by the maintainer, the spec defines the contract)**: a generic route `GET|POST /v1/api/external-integration/:open_api_key/:selector/:webhook_key` that relays `{ selector, webhook_key, method, query, raw body, content_type }` (body ≤ 256 KB) under the single action `external-integration-webhook`, waits for the instance's ack with a **hard timeout** (10 s) and responds with whatever the ack contains; **timeout or unreachable instance → `200` empty body, always** — the durable fix for the Netatmo lesson (5 consecutive failures = webhook banned by the third party, observed for real; PR #2627 notes that the current gateway lets the request fail). The gateway relays, period: zero knowledge of integrations.

**Instance side**: an `external-integration-webhook` branch in `gateway.handleNewMessage.js` → the supervisor verifies selector + declared `webhook_key` (unknown → empty `200` ack, silent — no validity leak), then depending on the mode:
- `fire_and_forget`: **immediate** ack `{ status: 200 }`, asynchronous relay over the integration WS — `external-integration.webhook.received` `{ "webhook_key", "method", "query", "body", "content_type" }`, without `message_id` or ack; integration disconnected/stopped → lost without error (see doctrine below);
- `sync`: relay `external-integration.webhook.request` (same fields + `message_id`), standard 5 s ack expected; the integration's `command-result.data` — `{ "status": 200–499, "content_type", "body" }` (body ≤ 64 KB) — is returned as-is to the gateway, hence to the third party; timeout or stopped integration → empty `{ status: 200 }`.

**"Trigger, not data" doctrine** (field lesson from PR #2627, to transpose into the developer docs B.12): webhook events arrive duplicated, late, out of order (observed: a stale event delivered a minute after its successor), and their payloads are partial or misleading. A webhook is for **triggering a refresh** via the manufacturer's API, never for applying the payload as a state — which is also what makes `fire_and_forget` losses painless: polling remains the source of truth and catches everything up.

**Key and UI (standard block, rendered by the core — the `GLADYS_PREFER_LOCAL` pattern)**: the user creates their Open API key in Gladys Plus (Settings → Open API) and pastes it in a "**Gladys Plus webhooks**" block of the Configuration screen, displayed only if the manifest declares `webhooks` (Plus not linked → explanatory message instead). Stored under the reserved config key **`GLADYS_OPEN_API_KEY`** (secret, scoped to the `service_id`, rejected for writing on the integration's `POST /config` like any `GLADYS_*` key). The core builds the full URLs. Deliberately manual: the user already handles the URL on the manufacturer's side; automatic provisioning (a key minted per integration via the Plus API) is a later improvement that will not change the integration contract.

**Integration side**: `GET /api/integration/v1/webhook` → `{ "available": true|false, "webhooks": [ { "key", "mode", "url" } ] }` (URLs ready to register with the third party — the Netatmo pattern: `addwebhook` on every successful connection, best effort); event `external-integration.webhook-updated` when availability changes (Plus linked/unlinked, key changed). `available: false` (no Gladys Plus) → the integration degrades to poll-only. SDK: `getWebhooks()`, `onWebhook(key, cb)` — in `fire_and_forget` the callback's return is ignored; in `sync` the resolved value `{ status?, contentType?, body? }` goes into the `command-result`.

Security, stated honestly: the URL **is** the secret (unauthenticated payloads — anyone with the URL can post; authenticity verification — provider signature — belongs to the integration); the integration sees the Open API key (it is in the URL it registers with the third party) — a key scoped to the Open API relay, not to the Plus account, and revocable by the user in Gladys Plus; an integration's events are only routed to it (selector in the URL + declared `webhook_key`); sizes bounded in both directions.
