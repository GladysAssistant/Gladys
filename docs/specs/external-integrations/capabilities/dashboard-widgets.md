> Part of the [external integrations living spec](../README.md) — the layout, the editing rules and the cross-repo map are there.

# Dashboard widgets declared by integrations (phase 2, design)

Goal: that an integration — external first, through the SDK — can put its own data on the dashboard **without a dedicated box type in the core**, by describing *what* to show in a declarative JSON vocabulary that the core renders. Community request, [topic 10641](https://community.gladysassistant.com/t/permettre-aux-integrations-de-declarer-leurs-propres-widgets-de-dashboard-schema-json/10641), opened by the maintainer: solar production tracking, the state of a robot vacuum, an EV charging plan, upcoming cinema releases — the data of an integration is often exactly where it makes the most sense to look at it, and today that place does not exist.

**The pilot case, and why this spec exists**: PR #3061 ("Sorties Cinéma" widget, [topic 10757](https://community.gladysassistant.com/t/widget-sortie-cinema/10757)) was technically clean and was closed on scope: it added a core lib, a native TMDB service, a box type, a scene trigger, a scheduled job, two API routes, a new external-integration *type* with its manifest field and a pivot format to keep compatible for life — one full core surface for one domain that is not Gladys' mission. Accepting it would have set the precedent of **one integration type per domain** (recipes, transport schedules, sport results, stock prices…), which is exactly the bottleneck the external-integration system was built to remove. With this capability, the poster grid becomes a `card-list` component declared by an external TMDB integration, and the UGC/Pathé/CGR integrations the author had prepared reuse it as-is: zero cinema code in the core, and the same mechanism serves the solar panel, the vacuum and the car. A large part of what that PR wrote — payload normalization and bounding, the provider relay, the widget, the tests — transposes almost directly.

**Related requests, and what this spec does with them**: [topic 10760](https://community.gladysassistant.com/t/integrations-externes-ecrans-personnalises/10760) asks for custom *pages* in the integration section (debug views, multi-step wizards, a charging history table) — the dashboard widget is the first, bounded step of that road and the "history table" case is directly covered by `status` and `card-list`; the multi-step wizard is not, and stays out of scope (see the end of this file). [Topic 9629](https://community.gladysassistant.com/t/creer-ses-propres-widgets-gladys/9629) ("create my own widgets?") is the same need from the user side: the answer is now "an integration can".

## Design principles (decided with the maintainer, topic 10641 and PR #3061)

1. **The integration describes *what*, Gladys decides *how*.** No HTML, no iframe, no script, no CSS, no free colors or sizes — a philosophy choice, not a v1 shortcut. By staying declarative, the core guarantees for every widget, third-party ones included: visual consistency (the Horizon glass theme composes on every widget exactly as on core ones), dark mode, mobile/tablet responsiveness, translations, performance, and non-regression when the interface evolves. It is the iOS/Android widget model: purely declarative, and nobody finds that ecosystem poor. It is also RFC requirement (3): *consistent UI, no code injected by integrations* (`../README.md`).
2. **The content is produced at runtime, the widget is declared in the manifest.** This is the one structural decision of this spec and it deserves its rationale. Two models were on the table: a *static layout in the manifest* bound to data through path expressions (`"value": "$.production.today"`), or a *content tree produced by the integration on demand*, in the core vocabulary. The static model needs a binding language, and a binding language never stays small: paths, then conditionals (show the "docked" row only when docked), then formatting, then arithmetic — a template engine to specify, validate and maintain forever, on both the indexer and the core. The runtime model needs none of that: an integration that wants a different layout while the vacuum is cleaning simply returns a different tree, and the core stays what it should be, **a validator and a renderer**. It is precisely how iOS (a timeline of entries, each carrying its view) and Android (`RemoteViews` built at runtime) do it. What the manifest still declares is the widget's *identity* — key, label, icon, per-instance settings — which is what the store indexer can validate at publish time, what the catalog and the install screen can show, and what the dashboard editor needs to list the widget even when the integration is stopped. The content vocabulary is itself a published JSON schema, so an AI (or the SDK in dev mode) can validate a payload before sending it — the "validatable JSON" benefit of the request holds in both models.
3. **The payload is never trusted** (B.18 doctrine): the core normalizes and bounds every content tree before it enters the frontend — a whitelist of component types and fields, bounded strings and arrays, finite numbers, validated dates, `https` links, images served from Gladys' own origin — and renders every text as escaped plain text (C.1, "rendering of every free-form text an integration publishes").
4. **Trigger, not data** (B.17 doctrine, transposed as in B.18): data enters the core through one audited pull path; the integration can only nudge "re-pull me now". The push channel carries zero state.
5. **Orthogonal to the integration `type`** — a `device` integration (the vacuum), a `weather` integration (a provider wanting a richer forecast panel) or a `communication` one can all declare widgets. The technical type keeps driving screens and host-API surface (`integration-catalog-categories.md` §2.2); widgets add a capability, never a type. An integration whose sole purpose is a widget (the TMDB case) declares `type: "device"` — the generic type — and simply never publishes a device; its Devices/Discovery screens stay empty (a lighter presentation for device-less integrations is a separate, later adjustment of B.8, not a new type).
6. **Vocabulary earns its place** (the B.18 condition-enum doctrine): a component type enters the vocabulary only when the core renders it well in both themes and both densities, and the vocabulary only ever grows **additively** — an old Gladys drops the components it does not know and renders the rest, an integration states the minimum core it needs through `gladys_version`. Nothing is ever renamed or removed.

## 1. Manifest: the `widgets` field

Optional, **max 5** entries, validated by the indexer **and** the server (`validateManifest`, mirrored in the canonical `manifest.schema.json` — a new manifest field lands in the JS validator, the vendored schema and this file in the same diff). Displayed on the install screen as a dedicated disclosure line ("this integration provides dashboard widgets: Upcoming releases, …"), like the other declared contracts.

```json
"widgets": [
  {
    "key": "upcoming_releases",
    "label": { "en": "Upcoming releases", "fr": "Prochaines sorties" },
    "description": { "en": "Movies coming to theaters in your region.", "fr": "Les films bientôt en salle dans votre région." },
    "icon": "film",
    "settings": [
      {
        "key": "period_days",
        "type": "select",
        "label": { "en": "Period", "fr": "Période" },
        "default": "30",
        "options": [
          { "value": "15", "label": { "en": "15 days", "fr": "15 jours" } },
          { "value": "30", "label": { "en": "1 month", "fr": "1 mois" } },
          { "value": "60", "label": { "en": "2 months", "fr": "2 mois" } }
        ]
      },
      { "key": "region", "type": "string", "label": { "en": "Country code", "fr": "Code pays" }, "placeholder": { "en": "FR" } }
    ],
    "action_timeout_seconds": 30
  }
]
```

| Field | Rules |
|---|---|
| `key` | required, `^[a-z0-9_]{2,32}$`, unique within the manifest — the identifier in the dashboard box, the API and the WS messages |
| `label` | required, multi-language (`en` required), each value 3–30 characters — the picker tile's name and the default card title |
| `description` | optional, multi-language, each value ≤ 100 characters — shown under the tile in the picker and on the install screen |
| `icon` | optional, `^[a-z0-9-]{1,40}$`, the name of a Feather icon (the set the picker already uses, `fe-<name>`); an unknown name renders the generic widget icon, never an error — a cosmetic field never rejects a manifest |
| `settings` | optional, ≤ 10 fields, **the `config_schema` grammar** (C.1) rendered and validated by the same engine, with three restrictions: types limited to `string` \| `number` \| `boolean` \| `select` \| `multi_select` \| `section` — `secret`, `oauth2` and `account_link` are **rejected** (settings live in the dashboard's JSON, readable by every user of a public dashboard: nothing sensitive belongs there, and linking an account is integration-scoped, not per widget); `{{port:<name>}}` placeholders are **rejected** (the editor is reachable by non-admins, whose reduced view carries no container state — the exact reason they are refused in `contact_schema`, C.1; `{{gladys_host}}` stays allowed); `source: "devices"` is **allowed** and is the intended way to bind a widget instance to one of the integration's devices ("which vacuum does this widget show") — the user picks a device by name, the integration receives its `external_id` |
| `action_timeout_seconds` | optional, integer 5–120, default 30 — the ack delay granted to `widget.action` (section 6), the same exception to the 5 s rule as manifest `actions` |

Any structural error rejects the manifest (indexer and server), like every other field. Declaring `widgets` requires `gladys_version` ≥ the first release whose validator accepts it — older cores reject unknown manifest fields (the `categories` note, C.1).

## 2. Dashboard side: the `external-widget` box

One new core box type serves every integration widget: `DASHBOARD_BOX_TYPE.EXTERNAL_WIDGET = 'external-widget'`. Box config, additive fields on the shared Joi box schema of `server/models/dashboard.js`:

```json
{ "type": "external-widget", "integration": "ext-tmdb", "widget": "upcoming_releases", "name": "Cinéma", "settings": { "period_days": "30", "region": "FR" } }
```

- `integration` (required): the `t_service` selector of the installed integration; `widget` (required): the declared `key` (same regex); `name` (optional, ≤ 40): the card title, defaulting to the widget's localized `label`; `settings` (optional): an object of `key → value` for the declared `settings`, **bounded in size** (≤ 20 keys, ≤ 4 KB serialized) but **not validated against the manifest by the dashboard model** — the box schema is static and manifest-independent, and a manifest can change under a saved box on every integration update, so a stale setting has to degrade at render time whatever happens at save time. The validation that must exist is therefore the render-time one (section 3: `422` → the widget's "check the widget settings" state); the editor validates for UX with the same engine (required fields, bounds), and the core applies the declared `default`s to missing keys before validating, exactly like the config form.
- **Not a device-referencing field** in the sense of `device-migration.md` B.3: a `source: "devices"` setting holds an external integration's `external_id` (always a *destination*-side device of a migration, never a source), so B.3 and `device.migrate` are unchanged.
- **Uninstall does not rewrite dashboards** (consistent with device deletion today): the box stays and renders the "integration not installed" state with a hint to remove it; reinstalling the same integration (same selector) brings the widget back untouched.

**Picker.** The searchable tile grid of the editor (`SelectBoxType`, `dashboard-flexible-layout-and-widgets.md` A.3) lists, after the core tiles, **one tile per widget of every installed integration** — localized label, declared icon, the integration's name as a caption, searchable like the others. The list comes from a new endpoint, **`GET /api/v1/external_integration/widget`**, open to every authenticated user (dashboards are per-user, and the non-admin reduced view of `GET /api/v1/external_integration` deliberately hides device integrations — C.5): it returns, for each widget of each installed integration, `{ integration_selector, integration_name, integration_status, key, label, description, icon, settings }` — declaration only, nothing operational, the same reasoning as `GET /api/v1/weather/provider` (B.18). A literal route declared before `:selector`, like `store` and `hardware`.

**Edit form.** Title + the `settings` form rendered by the shared `config_schema` engine (`ConfigSchemaForm`, moved from the integration page into a shared component — one engine, one look, one set of tests), `source: "devices"` options loaded from the standard `GET /api/v1/service/:selector/device` (authenticated, not admin — devices are visible to every user). If the integration is not `RUNNING`, the form shows its status and stays editable (the box can be prepared while the integration restarts). A widget whose `settings` are empty shows only the title field.

## 3. The data path: pull, normalize, cache, nudge

**Route (front → core)**: `GET /api/v1/external_integration/:selector/widget/:key/content?settings=<url-encoded JSON>`, standard user auth, any authenticated user. The core:

1. resolves the integration (`404` unknown selector or key not declared in its manifest);
2. **validates the settings** against the declared `settings` schema with the shared validation engine — defaults applied to missing keys, `source: "devices"` resolved dynamically against the integration's own devices (the C.1 dynamic-value rule), unknown key or invalid value → `422` naming the key;
3. looks up the **content cache** by `(service.id, key, canonical JSON of the validated settings)`; a hit is returned as-is;
4. on a miss, sends **`external-integration.widget.get`** `{ message_id, key, settings, language, units }` — `language` is the requesting user's language, `units` their preference (`metric` \| `us`, as in `weather.get`) — with a **15 s** ack deadline (the same exception to the 5 s rule as `camera.get-image` and `weather.get`: a widget typically calls a third-party API). Concurrent requests for the same cache key while a command is in flight **share that command** (coalescing: ten open tablets never mean ten commands);
5. runs the ack's `data.content` through **`normalizeWidgetContent`** (section 4), stores the result with its TTL, returns it.

**Errors**, translated so no internal code ever reaches the user as an opaque "unknown error": integration not connected, ack timeout, `success: false`, invalid payload → `400 REQUEST_TO_THIRD_PARTY_FAILED` (the standard code the weather widget already maps to its call to action), with the integration's own `error` string, when present, bounded to 200 characters and returned alongside — displayed as escaped plain text under the generic message ("API key invalid" is more actionable than "unavailable"). The frontend never fetches while it knows the integration is not `RUNNING` (section 7): the stopped state is a status, not a failed request.

**Cache.** The content carries its own freshness, `ttl_seconds` (integer, clamped to **10–3600**, default 60 when absent) — the reload policy of an iOS timeline entry, chosen by the one who knows how fast the data moves (cinema releases: an hour; a vacuum: 30 s). The cache is in memory (`this.cache`, the same store as the weather images), **≤ 50 entries per integration** in LRU order, and is dropped in full for an integration when it stops, restarts, updates or is uninstalled. The response carries `expires_at`; the frontend refreshes on expiry, so a widget with `ttl_seconds: 300` self-refreshes every 5 min with one command whatever the number of open dashboards.

**The freshness nudge** — `external-integration.widget.refresh` `{ key }` (integration → core, no `message_id`, no ack, fire-and-forget) means only "re-pull me now": the core drops the cached contents of `(service, key)` and broadcasts **`external-integration.widget-updated`** `{ selector, key }` on the user WebSocket; every open instance of that widget refetches (coalesced). Rate-limited to **1 per 10 s per `(integration, key)`**, silently dropped beyond (fire-and-forget has no error path, and a dropped nudge costs at most one TTL). The vacuum integration nudges on every state change: the tile updates within a second, and the data still came in through the audited pull path.

## 4. The content vocabulary

What `widget.get` resolves with — `data.content`:

```json
{
  "version": 1,
  "ttl_seconds": 1800,
  "components": [
    { "type": "text", "variant": "caption", "text": { "en": "Next 30 days · France", "fr": "30 prochains jours · France" } },
    {
      "type": "card-list",
      "display": "grid",
      "items": [
        {
          "title": "L'Odyssée",
          "date": "2026-10-07",
          "image": "poster-20637522",
          "badge": { "text": { "en": "New", "fr": "Nouveau" }, "color": "info" },
          "description": "Après la mort de son père, …",
          "links": [
            { "url": "https://www.youtube.com/watch?v=…", "label": { "en": "Trailer", "fr": "Bande-annonce" } },
            { "url": "https://www.themoviedb.org/movie/20637522", "label": "TMDB" }
          ]
        }
      ]
    }
  ]
}
```

**Envelope**: `version` (integer, optional, default `1`; a version **higher than the core supports** is refused as a whole — the widget renders "this widget needs a newer Gladys", honest and debuggable — while version 1 stays forward-compatible by the drop rules below, so a bump will only ever happen for a breaking change, which this doctrine is designed to avoid), `ttl_seconds` (section 3), `components` (array, **≤ 30** entries; an empty array renders the translated empty state — a widget with nothing to show is a valid state, not an error). A raw `content` above **256 KB** is treated as an invalid payload.

**Normalization rules** (`normalizeWidgetContent`, the `normalizeWeather` pattern): whitelist per component type — **unknown fields are dropped**; a component of **unknown `type` is dropped** with a warning log (forward compatibility: a newer integration on an older core renders partially rather than not at all); a component **missing a required field is dropped**, never the whole content (optional metadata never rejects, and one bad item never blanks a widget); the same applies item by item inside `items`, `series` and `links`. Numbers must be finite; strings are trimmed and truncated to their bound; every text field accepts a plain string **or** a multi-language object (`en` required for the fallback, C.1 language rule); `date` fields are ISO 8601 strings parsed by the core, formatted in the **user's locale and timezone** at render time, dropped when invalid (the integration sends raw values, the core formats — same for numbers, whose digits and separators follow the account language); `url` fields are `https` only, ≤ 2048 characters, opened in a new tab with `noopener noreferrer` and the **target domain displayed** next to the label (the C.1 section-links rule: unmoderated third-party content, the user sees where they click); `icon` is a Feather icon name (`^[a-z0-9-]{1,40}$`, unknown → no icon); `color` is a **semantic enum** — `neutral` \| `primary` \| `success` \| `warning` \| `danger` \| `info` — mapped by the core to theme colors in both modes, never a hex value.

**Components (v1)** — every text bound is in characters, per language value:

| `type` | Fields | Renders as |
|---|---|---|
| `text` | `text` (required, ≤ 1000), `variant` (`heading` \| `body` \| `caption`, default `body`) | escaped plain text with line breaks honored (`white-space: pre-wrap`, C.1); `heading` is a section title inside the card, `caption` the muted small style |
| `value` | `value` (required: number, or string ≤ 40), `label` (≤ 40), `unit` (≤ 10), `icon`, `color` | a **tile** — the visual family of the temperature tile and the chips. **Consecutive tiles flow as a wrapping row automatically**: three `value`s in a row become a stats banner, the core decides the wrapping (see Alternatives: no layout container) |
| `gauge` | `value` (required, number), `min`, `max` (required, finite, `min < max`), `label` (≤ 40), `unit` (≤ 10), `color` | the radial gauge of the gauge box (no per-widget thresholds: `color` is the whole styling); flows with tiles |
| `status` | `items` (required, 1–20 of `{ label (required, ≤ 40), value (required: number or string ≤ 80), icon, color }`) | a list of label / value rows with a colored dot — the "list of states" of the request (vacuum: state, battery, area cleaned; charging: plan, kWh, cost) |
| `chart` | `series` (required, 1–4 of `{ name (≤ 40), points (required, 1–300 of { t: ISO date, v: number }) }`), `chart_type` (`line` \| `area` \| `bar` \| `stepline`, default `line`), `title` (≤ 60), `unit` (≤ 10) | the ApexCharts rendering shared with the chart box, series colors from the chart box's default palette in order — **zero styling** from the integration. Inline series carry data the core has no history of (a production forecast, a charging plan); history of the integration's own device features is section 7 |
| `card-list` | `display` (`grid` \| `list`, default `list`), `items` (required, 1–30 of `{ title (required, ≤ 100), subtitle (≤ 100), date (ISO), image (image key, section 5), badge ({ text ≤ 20, color }), description (≤ 2000), links (≤ 3 of { url, label ≤ 40 }) }`) | `grid`: a responsive poster grid (image, title, date) — the cinema case; `list`: rows (image thumbnail, title, subtitle/date, badge). Tapping an item with a `description` or `links` opens the core's **detail panel** (title, date, description as pre-wrap plain text, links with their domain): "synopsis, trailer, TMDB link" with no widget-specific code |
| `image` | `key` (required, image key), `alt` (≤ 100), `fit` (`cover` \| `contain`, default `cover`) | a full-width image served through the core (section 5) — a vigilance map, a solar layout, a robot's cleaning map |
| `button` | section 6 (phase 2) | |

Bounds recap: the size of a widget is capped by construction (30 components × the per-component caps × the 256 KB envelope), and the whole normalized content is what the frontend receives — nothing outside the whitelist ever reaches the browser.

**Versioning of the vocabulary** ("versionner le schéma", topic 10641): the vocabulary is published as **`widget-content.schema.json`** next to `manifest.schema.json` (canonical owner `GladysAssistant/integration-store`, vendored copy in the monorepo, the core's `normalizeWidgetContent` being the enforcement that mirrors it — the manifest pattern). Evolutions are **additive only**: a new component type, a new optional field, a new enum value — each shipped when the core renders it, never before, and each harmless to an older core (dropped) and to an older integration (absent). The envelope `version` exists for the breaking change the doctrine intends never to make.

## 5. Images

Images never come from a third-party URL loaded by the browser: the user's IP would reach the third party on every dashboard render (the catalog cover doctrine, C.1, and the exact objection raised on PR #3061 — posters loaded from `image.tmdb.org`). And the core does not fetch third-party URLs on the integration's behalf either: the core sits on the host network while the integration is sandboxed, so an integration-supplied URL fetched by the core is a request into the LAN from a container that should not have that reach — a server-side request forgery by construction. So the **integration serves the bytes on demand**, the B.18 point 6 mechanism generalized:

- the content only ever declares **keys** (`image` fields: `^[a-z0-9][a-z0-9-]{0,63}$`); the bytes travel over **`external-integration.widget.get-image`** `{ message_id, image_key }` → `command-result` `data.image` (raw base64, no data-URI prefix; **15 s** ack), and the core validates the **decoded bytes**: PNG, JPEG or WebP by magic numbers (WebP joins the weather set because it is the format every poster CDN serves, and the dashboard assets already accept it), **≤ 300 KB**;
- **image keys are integration-scoped**, not widget-scoped: two widgets of one integration showing the same poster share one key, one download, one cache entry. The allowlist is the union of the keys declared in the integration's currently cached contents: a key declared nowhere `404`s **without a single byte sent to the integration**; the route shape-checks the key against the regex before consulting anything;
- served to the frontend from Gladys' own origin — **`GET /api/v1/external_integration/:selector/widget/image/:image_key`** (standard user auth, the `content-type;base64,data` shape of the weather image route), cached **1 h** per `(integration, image_key)`, ≤ 100 entries per integration in LRU order (30 posters and a few maps fit; beyond, the oldest are re-pulled);
- **at most 4 image commands in flight per integration**, the others queued core-side, and concurrent requests for one key share one command — a grid of 30 posters opened on three tablets costs 30 commands once an hour, never 90 at once; the integration keeps its own download cache and answers from it.

## 6. Actions: the `button` component (phase 2)

The command side of the request ("boutons"): start the vacuum, launch a charge, open the trailer. Three kinds, exactly one per button; **consecutive buttons flow as a wrapping row** like the quick-actions pills.

| Kind | Fields | Tap does |
|---|---|---|
| widget action | `action` `{ key (required, ^[a-z0-9_]{2,32}$, unique within the content), params (optional object, ≤ 1 KB), confirm (boolean, default false) }` | `POST /api/v1/external_integration/:selector/widget/:key/action/:action_key` `{ settings }` → the core finds the content of that `(integration, widget, settings)` (re-pulling it when nothing is cached), relays **`external-integration.widget.action`** `{ message_id, key, action_key, params, settings }` with the declared `action_timeout_seconds`, and shows the optional `data.message` (string or multi-language, ≤ 200 characters) as a toast. The `params` sent are **the ones declared in the last normalized content**, never taken from the request: an action key absent from that content `404`s without reaching the integration (the image-allowlist rule). `confirm: true` makes the frontend ask before sending (`danger` style suggested). After a successful action the core drops the cached contents of `(service, key)` and broadcasts `widget-updated`: the tile reflects the new state without the integration having to nudge. Rate limit **30 actions per minute per integration** → `429` |
| device feature | `device_feature` `{ external_id (required), value (required, number) }` | the core resolves the feature **within the tenant** (a feature of a device of this integration's `t_service`, not `read_only`, value within `min`/`max`; anything else drops the button) and returns its selector; the frontend sends the standard `POST /api/v1/device_feature/:selector/value` — the quick-actions path, which comes back to the integration as `device.set-value`. Active state (tint when `last_value` equals `value`) and live updates for free |
| link | `link` `{ url (required, https), label }` | opens in a new tab, domain displayed (section 4 `url` rule) |

Common fields: `label` (required, ≤ 30), `icon`, `style` (`primary` \| `secondary` \| `danger`, default `secondary`). A dashboard is editable by any authenticated user and can hang on a public wall panel: a widget action carries exactly what the *integration author* declared, no user input — the same trust level as the `actions` manifest buttons, extended to the dashboard because the vacuum's "start" belongs on the wall, not on the admin's configuration screen. The acting user's identity is **not** sent in v1 (lead: a `user` block, additive).

## 7. Live device bindings (phase 2)

"Comment le widget récupère ses données : features d'appareils existantes ?" — yes, for the integration's own devices, and with zero data transfer: `value` and `gauge` accept **`device_feature`** (`external_id`) instead of an inline `value`, `chart` accepts **`device_features`** (1–4 `external_id`s) plus `interval` (the chart box's interval enum) instead of inline `series`. The core resolves each reference **within the tenant** (a feature of one of this integration's devices, else the component is dropped with a warning — a widget never displays another integration's or the core's data, the user has core widgets for that) and returns the feature selector; the frontend then reuses the exact paths of the chips bar and the chart box: one `GET /api/v1/device?device_feature_selectors=` batch, live `DEVICE.NEW_STATE` updates, `GET /api/v1/device_feature/aggregated_states` for the history, the feature's real unit converted to the user's preferences, the category icon by default. The solar widget shows today's production as a live tile and its 24 h curve from the history the core already keeps, and the integration's `widget.get` answer for that part is a handful of references.

## 8. Management API (front → core)

All standard user auth, every authenticated user (the dashboard's audience), `404` for an unknown integration, widget or undeclared key:

| Route | Section |
|---|---|
| `GET /api/v1/external_integration/widget` | 2 — declared widgets of every installed integration (literal route before `:selector`) |
| `GET /api/v1/external_integration/:selector/widget/:key/content?settings=` | 3 |
| `GET /api/v1/external_integration/:selector/widget/image/:image_key` | 5 |
| `POST /api/v1/external_integration/:selector/widget/:key/action/:action_key` | 6 (phase 2) |

No new host API endpoint: the nudge travels over the integration WebSocket like `weather.refresh`.

## 9. Integration WebSocket messages

Following the C.4 convention (`external-integration.<domain>.<action>`, one type per action, `message_id` + `command-result` ack unless documented):

| Direction | `type` | `payload` |
|---|---|---|
| core → integration | `external-integration.widget.get` | `{ message_id, key, settings, language, units }` → `command-result` `data.content` (section 4); ack within **15 s** |
| core → integration | `external-integration.widget.get-image` | `{ message_id, image_key }` → `command-result` `data.image` (raw base64; PNG/JPEG/WebP ≤ 300 KB decoded); ack within **15 s** |
| core → integration | `external-integration.widget.action` | `{ message_id, key, action_key, params, settings }` → `command-result` with optional `data.message`; ack within the widget's `action_timeout_seconds` (phase 2) |
| integration → core | `external-integration.widget.refresh` | `{ key }` — freshness nudge, no `message_id`, no ack; accepted only for a `key` declared in the manifest; rate-limited 1 per 10 s per `(integration, key)`, silently dropped beyond |
| core → frontend (user WS) | `external-integration.widget-updated` | `{ selector, key }` — open instances refetch |

Constants: `WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_GET` / `WIDGET_GET_IMAGE` / `WIDGET_ACTION` / `WIDGET_REFRESH` / `WIDGET_UPDATED`; `WIDGET_GET_TIMEOUT_MS = 15 s` in `server/lib/external-integration/constants.js`. An integration on an older SDK ignores the new types silently (C.4 forward compatibility).

## 10. SDK (`@gladysassistant/integration-sdk`, C.8)

| Surface | Contract |
|---|---|
| `onWidgetGet(key, cb)` | `({ settings, language, units }) => Promise<content>` — registered **by widget key** like `onAction`; the resolved content goes into `data.content` (15 s) |
| `onWidgetGetImage(cb)` | `(imageKey) => Promise<string>` — resolve the raw base64 of a declared image key (PNG/JPEG/WebP, ≤ 300 KB decoded); integration-scoped, one handler |
| `onWidgetAction(key, cb)` | `(actionKey, params, { settings }) => Promise<string \| { message } \| undefined>` — phase 2; the resolved message goes into `data.message` |
| `requestWidgetRefresh(key)` | fire-and-forget nudge (section 3); rate-limited core-side |

Dev mode: with `DEBUG=gladys-integration-sdk`, the SDK validates every content it returns against the vendored `widget-content.schema.json` and logs the violations — the integration developer sees "`items[3].title` is required" in their logs instead of a silently dropped card. The official template (B.11) ships a **demo widget** (a `status` list + a `value` tile fed by the demo virtual switch) so the e2e journey of the framework (`../verification.md`) covers it.

## 11. Frontend rendering

- **One component**, `front/src/components/boxs/external-widget/`, renders every integration widget: a standard card (title = box `name` or the widget label), natural height, no stretch flag, the Horizon glass variant composed on `.glass-theme` like every widget. Inside, the normalized `components` in order, with the two auto-flow rules (tiles, buttons) and no other layout logic.
- **States**, each translated by the core in every language: *loading* skeleton; **not installed** (the selector is absent from the widget list → "this integration is no longer installed", hint to remove the box); **stopped** (integration status ≠ `RUNNING`, live via `STATUS_CHANGED` → the status badge and, for an admin, a link to the integration page — RFC requirement (2), no zombie state: a stopped integration is visible on the dashboard as stopped, never as a spinner); **unavailable** (`400 REQUEST_TO_THIRD_PARTY_FAILED` → "data unavailable", retry button, the integration's bounded message underneath); **check settings** (`422` → "edit this widget", the failing key named); **needs a newer Gladys** (unsupported content `version`); **empty** (zero components).
- **Refresh**: on mount, on `expires_at`, on `widget-updated` for its `(selector, key)`, on `websocket.connected`, and on `STATUS_CHANGED` back to `RUNNING`; every fetch coalesced core-side.
- **Text**: every integration string through the language fallback (`getLocalizedText`) and rendered as escaped plain text with `white-space: pre-wrap` (C.1) — no Markdown, no HTML, anywhere in a widget; a long token wraps, a long description scrolls inside the detail panel. Dates and numbers formatted by the core in the user's locale.
- **Editor**: the edit form of section 2; the picker tile carries `data-cy="box-type-external-widget-<selector>-<key>"` for Cypress.
- i18n in **all** languages (`front/src/config/i18n/*.json`, `compare-translations`): `dashboard.boxTitle.external-widget` and the state strings; everything else comes from the manifest and the content.

## 12. Security and accepted risks

- **No code path from the integration to the browser**: the vocabulary is a closed whitelist, every text is escaped, links are `https` with their domain shown, images are validated bytes served from Gladys' origin, colors and icons are enums. The XSS surface of a third-party widget is that of a device name.
- **Tenant isolation holds**: device references resolve only inside the integration's `t_service`; an integration cannot display, chart or actuate anything it does not own.
- **Everything user-triggered is bounded**: content pulls coalesced and cached, images capped in size, count and concurrency, actions rate-limited and allowlisted from the integration's own content, nudges rate-limited. A misbehaving widget costs its integration's own commands, never the core's stability — a slow or crashed integration yields "unavailable" tiles, RFC requirement (1).
- **Accepted (v1)**: a widget is content chosen by an unaudited third-party author and shown to every user who adds it (the trust level of the manifest description and of the connection-status message, already accepted); a `params` object is opaque to the core and echoed as declared (bounded, never user-supplied); the acting user is anonymous to the integration (lead, section 6); the in-memory caches are lost on restart (a cold dashboard costs one pull per widget, like today's weather widget).

## 13. Tests (100% patch coverage, B.13)

- **Manifest** (`validateManifest`): `widgets` bounds (0 and 6 entries, key regex, duplicate keys, label/description lengths, icon regex), `settings` restrictions (`secret`/`oauth2`/`account_link` → rejected, `{{port:}}` → rejected, `{{gladys_host}}` accepted, `source: "devices"` accepted, ≤ 10 fields), `action_timeout_seconds` bounds; the vendored `manifest.schema.json` updated in the same diff.
- **`normalizeWidgetContent`**, one file per component: required fields (component dropped, siblings kept), every string bound (truncation), multi-language fallback, unknown component type dropped with a warning, unknown field dropped, invalid/non-finite numbers, invalid dates dropped, `http` link dropped, `color`/`icon`/`variant`/`chart_type`/`display` enums, per-array caps (`items` 30/20, `series` 4 × 300, `links` 3, `components` 30), `ttl_seconds` clamping and default, `version` > 1 refused, 256 KB envelope, empty `components` accepted.
- **Cache and nudge**: hit/miss/TTL expiry, LRU at 50, coalescing of concurrent misses (one command), invalidation on nudge / stop / restart / update / uninstall, nudge for an undeclared key ignored, rate limit 1 per 10 s per `(integration, key)`, `widget-updated` broadcast.
- **Controllers** (supertest): widget list for a non-admin (widgets of a `device` integration visible, nothing operational, stopped integration listed with its status); content route — `404` unknown selector/key, `422` on a bad setting naming the key, defaults applied, `source: "devices"` resolved against the integration's devices only, not connected / timeout / `success: false` / invalid payload → `400 REQUEST_TO_THIRD_PARTY_FAILED` with the bounded `error` message, `language`/`units` from the requesting user; image route — regex shape check before any lookup, undeclared key → `404` and **no command sent**, magic numbers (PNG/JPEG/WebP accepted, GIF/SVG refused), > 300 KB refused, 1 h cache, LRU at 100, concurrency cap of 4 with queueing; **isolation**: A's widget cannot reference B's feature (component dropped), A's image key never reaches B.
- **Phase 2**: actions (allowlist from the last content, `params` echoed from the content not the request, timeout honored, rate limit `429`, cache invalidation + broadcast after success, `404` on an undeclared action), device bindings (tenant check, `read_only` button dropped, value out of `min`/`max` dropped, selectors returned).
- **Dashboard model**: `external-widget` box accepted, `integration`/`widget` required, `settings` size bound, unknown box key still rejected.
- **Frontend**: Cypress journey with a stubbed widget list and content — the tile appears in the picker, the settings form renders, the widget renders each component type, each state (stopped, unavailable, check settings, empty) from stubbed responses.
- **Ecosystem repos** (their own CI): SDK handlers and dev-mode schema validation; indexer fixtures for valid/invalid `widgets`; template demo widget accepted by the indexer.

## 14. Verification (manual e2e, environment with the Docker socket)

Dev-install the template with its demo widget → the install screen lists the widget → as a **non-admin** user, open a dashboard editor: the widget tile appears after the core tiles, searchable → add it, set its settings (`source: "devices"` shows only the integration's devices) → the card renders (tile + status list) → toggle the demo switch from the integration container: the tile updates (nudge → `widget-updated` → refetch) → stop the integration: the card shows "stopped" live, restart: content is back → declare an unknown component type in the demo content: the widget renders the rest, the server logs one warning → publish an image key and request the image route with an undeclared key: `404`, no command in the container logs → uninstall: the card shows "not installed", the dashboard is otherwise intact → reinstall: the widget is back with its settings.

## Phases

1. **Foundation + read-only vocabulary**: manifest `widgets`, the `external-widget` box, picker and editor, the pull/normalize/cache/nudge path, the components `text`, `value`, `gauge`, `status`, `chart` (inline series), `card-list`, `image`, the widget list / content / image routes, the WS messages, the SDK handlers, the template demo widget, the vendored `widget-content.schema.json`, the website developer page (B.12). Deliverable: the TMDB integration of PR #3061 rewritten as an external integration renders its poster grid with detail panels from the store, and the UGC/Pathé/CGR integrations reuse the same widget shape; a solar or vacuum integration shows tiles and a status list refreshed on nudge.
2. **Interaction and live data**: the `button` component (widget actions, device-feature commands, links), `device_feature`/`device_features` bindings on `value`, `gauge` and `chart`. Deliverable: the vacuum starts from the wall tablet and its battery is a live tile; the solar widget charts the core's own history.
3. **Leads** (each its own capability file when it comes): a generic **integration event scene trigger** (the "new release" trigger of PR #3061, generalized: `external-integration.event` with declared event keys — the same mechanism serves "vacuum stuck" and "charge complete"); **chip-sized widgets** (`size: "chip"` in the declaration, rendered in the chips bar); the acting `user` in `widget.action`; custom integration *pages* (topic 10760) reusing the same vocabulary outside the dashboard; AI-assisted dashboard composition on top of the published schema.

Each phase is a separate PR (or PR series) that updates this file in the same diff.

## Alternatives considered

- **Custom HTML / iframe / JS widgets**: rejected, the RFC's requirement (3) and the founding choice of topic 10641 — the core could guarantee none of theme, dark mode, responsiveness, translations or security.
- **One integration type per domain** (`movies`, then recipes, transport, sports…): rejected on PR #3061 — each type is a core surface (lib, pivot, widget, trigger, spec) maintained forever for one domain.
- **Static layout in the manifest + data-binding expressions**: rejected (principle 2) — a template language to specify and maintain on two repos, for less expressiveness than a runtime tree. The manifest keeps what is static by nature: identity and settings.
- **Push (`POST /widget/content`) instead of pull**: rejected — per-instance settings make a pushed payload ambiguous, memory would hold every variant, and the "trigger, not data" doctrine already gave the weather type sub-second freshness with a stateless nudge.
- **Core-side fetch of third-party image URLs**: rejected — an SSRF into the host network from a sandboxed container, and the core would carry the bytes anyway; the integration serves them on demand (B.18 point 6, generalized).
- **Layout containers (`row`, `columns`, nesting)**: rejected in v1 — auto-flow of tile-sized components and of buttons covers the stats banner and the button row with zero layout language; the dashboard spec rejected user-composed nestable stacks for the same reason, and an integration-composed one would have to look good in every theme and width just the same. A single-level `row` remains an additive lead if a real layout need cannot be auto-flowed.
- **Free colors, sizes, fonts**: rejected — semantic `color` enum only; "beautiful by default" is the core's job.
- **Widget data bent into device features** (a "movie" sensor): rejected, the B.18 doctrine — a device feature is a controllable or measurable thing, not a transport for structured content.
- **Validating `settings` at dashboard save time**: rejected (section 2) — the render-time validation must exist anyway, and coupling `t_dashboard` writes to a manifest lookup buys nothing it does not already provide.

## Out of scope

- Multi-step wizards and stateful custom screens in the integration section (topic 10760): a different surface with a different interaction model; the vocabulary here may be reused there later, the widget spec does not attempt it.
- Per-user widgets (content depending on who looks): a widget instance is per dashboard, and the acting user is not transmitted in v1.
- Widgets from **internal** services: the mechanism is designed for the external contract; an internal service keeps writing a core box (it can change the core), and nothing prevents a later internal adapter exposing the same `widget.get` interface on the stateManager, exactly as `weather.get` is duck-typed today.
- Rich text of any kind (Markdown, HTML) inside a widget — line breaks are the formatting (C.1).
- Any change to the chips / quick-actions / house-view boxes: an integration widget is its own card; putting integration data in a chip is the phase 3 lead above.
