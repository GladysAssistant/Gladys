> Part of the [external integrations living spec](README.md) — the section index, the editing rules and the cross-repo map are there.

# C.1 The `gladys-assistant-integration.json` manifest

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
