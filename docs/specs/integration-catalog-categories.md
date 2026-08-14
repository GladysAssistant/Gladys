# Integration catalog categories & filters

> **Status: proposal (RFC), non-normative.** Nothing in this document is implemented yet, and nothing in it overrides an existing contract: where it touches the manifest, the store index or the management API, `docs/specs/external-integrations.md` (§C.1, §C.5, §C.6) remains the source of truth until Phase A (§8) updates it in the same diff that ships the change. It formalizes a redesign of the integration catalog's navigation (the categories in the left menu of the Integrations page) and proposes facet filters, based on two converging pieces of user feedback and on the actual content of the catalog. Once accepted and implemented, this document becomes a living spec under the usual rule: any PR that changes the catalog's categorization behavior or one of the contracts below modifies this file in the same diff.

Related community topic: [Intégrations : revoir découpage des catégories + mettre des filtres (topic 10419)](https://community.gladysassistant.com/t/integrations-revoir-decoupage-des-categories-mettre-des-filtres/10419).

## 1. Problem

Two independent pieces of feedback point at the same structural problem:

1. **The "Devices" category is read as "my devices".** A user reported (email, 2026-08) opening *Integrations → Devices* and being confused to find a list of integrations instead of the devices of their installation. The label is a trap: an entry named "Devices" in a sidebar is a strong affordance for a device inventory, and since Gladys has no global device list, this entry is the most plausible candidate in the whole UI. The confusion is structural, not a user error.
2. **The categories don't segment the catalog anymore** (topic 10419): discovering new integrations means scrolling through everything; users ask for filters (native/community, local/cloud, Gladys Plus) and for domain-oriented categories (cameras, energy, vacuums…).

The numbers confirm it. As of 2026-08 the catalog contains **81 integrations**: 36 native and 45 community (external) integrations from the store — the community side is now the majority and grows without any core release. Their distribution over the current categories:

| Current category | Native | Community | Total |
|---|---|---|---|
| `device` | 25 | 37 | **62** |
| `communication` | 9 | 5 | 14 |
| `weather` | 1 | 3 | 4 |
| `calendar` | 1 | 0 | 1 |

A category holding ~77% of the catalog segments nothing, and the store index makes it worse: the front forces every store entry that is not `communication`/`weather` into `device` (`front/src/routes/integration/index.js`), so each new community integration falls into the catch-all by default.

The manifest field also shows that `type` cannot be repaired into a browsing taxonomy: community integrations such as *Pollens*, *VigiEau*, *Indice UV* or *Prix carburants* are typed `device` — not because they are devices, but because they **create devices** (sensors) in Gladys and therefore need the Devices/Discovery/Configuration screens. Authors correctly use `type` as a technical mechanism (which screens, which host-API surface), not as a domain. This spec keeps it that way.

## 2. Design principles

1. **Two orthogonal axes, never mixed again.**
   - *Browse categories* describe the **domain of use** (heating, cameras, energy…). They live in the sidebar. This is the axis users browse when they explore what they could connect.
   - *Facets* describe **technical attributes** (native/community, local/cloud, Gladys Plus, update available). Any integration of any category can carry any of them; they are cumulative filters (chips), never sidebar entries.
2. **`type` stays a technical key.** It keeps driving routing (`/dashboard/integration/{type}/{key}`), the screen set (device screens vs configuration-only), the host-API surface, and the non-admin visibility rules (`HIDDEN_CATEGORIES_FOR_NON_ADMIN_USERS` remains expressed on `type`). Browse categories are **display metadata**, decoupled from URLs and behavior — this is what makes the whole redesign low-risk and free of any data migration.
3. **The vocabulary is derived from the actual catalog, and the store is first-class.** Since the community side is the majority and grows permission-lessly, the taxonomy must be assignable from third-party manifests, with a validated controlled vocabulary and a fallback so the existing store is categorized from day one without waiting for 45 authors to republish.
4. **Multi-membership.** One integration can belong to several categories (Shelly is lighting *and* energy; Netatmo is climate *and* security *and* environment; Freebox is network *and* security *and* multimedia). A single-membership taxonomy would be wrong on day one.
5. **No category named "Devices".** Whatever the final vocabulary, no sidebar entry may reuse a word that names a core Gladys object (device, scene, dashboard…): that word reads as "list of my X", not as a catalog section.

## 3. Controlled vocabulary

Twelve category keys. Keys are stable English identifiers (they appear in manifests, in the store index and in URLs); labels are core-owned i18n (`integration.root.menu.<key>`), so community manifests never carry display labels. Icons are Feather names (`fe fe-*`), given as suggestions.

| Key | Icon | Label (en / fr) | Definition — what the integration connects |
|---|---|---|---|
| `climate` | `thermometer` | Heating & cooling / Chauffage & climatisation | Heaters, boilers, AC, thermostats, HVAC zones |
| `lighting` | `zap` | Lighting, plugs & covers / Éclairage, prises & volets | Lights, smart plugs, wall switches, relays, and covers: shutters, blinds, awnings, garage doors |
| `energy` | `battery-charging` | Energy / Énergie | Meters (electricity, gas), solar & batteries, EV charging, consumption tracking |
| `security` | `shield` | Cameras & security / Caméras & sécurité | Cameras, doorbells, locks, alarm-related sensors |
| `multimedia` | `speaker` | Multimedia / Multimédia | Speakers, TVs, streaming, casting, media remotes |
| `appliances` | `coffee` | Appliances & garden / Électroménager & jardin | Vacuums, kitchen & laundry appliances, mowers, watering |
| `environment` | `cloud` | Weather & environment / Météo & environnement | Weather providers, air quality, pollens, UV, drought, open-data daily-life feeds |
| `protocols` | `radio` | Protocols & hubs / Protocoles & passerelles | Bridges and hubs that bring a whole ecosystem of third-party devices in at once: Zigbee, Z-Wave, Matter, MQTT, Bluetooth, vendor hubs. Narrow exception to the "no mechanism" rule below |
| `network` | `wifi` | Network & presence / Réseau & présence | LAN equipment & monitoring, presence detection, printers, home-network tools |
| `notifications` | `message-square` | Messaging & notifications / Messages & notifications | Messaging channels and notification providers |
| `assistants` | `mic` | Voice assistants & AI / Assistants vocaux & IA | Voice-assistant bridges (Alexa, Google Home, HomeKit) and AI providers |
| `services` | `calendar` | Services / Services | Productivity & personal services (calendars…) — currently below the sidebar threshold, see §5 |

The current `weather` type is absorbed by `environment` as a browse category (the `weather` *type* remains, unchanged, as the technical contract for weather providers).

### Vocabulary governance

Mirroring the rules of `device-feature-categories.md`:

- **A category describes a domain of use, never a brand, a protocol name used as marketing, or a mechanism.** Litmus test: would a user who does not know the brand look for it under this word?
- **`protocols` is the single, narrow exception** to the rule above, because "which hub do I need to talk to my Zigbee/Z-Wave/Matter devices?" *is* how users shop for that shelf — the protocol name is the domain here, not the implementation detail. To keep the exception from leaking, it is gated by three assignment rules:
  1. `protocols` is reserved for integrations **whose purpose is to bring in third-party devices the integration does not own** (Zigbee2mqtt, Z-Wave JS UI, Matter, MQTT, SmartThings, vendor hubs). An integration that talks a protocol to reach *its own* products is not `protocols` — it belongs to its domain (Philips Hue speaks Zigbee and is `lighting`).
  2. When such a bridge has a dominant domain of its own, it declares that domain **in addition** to `protocols` (Broadlink → `protocols`, `multimedia`).
  3. Transport or radio alone never justifies `protocols`. A presence sensor that happens to use Bluetooth is `network` (presence), not `protocols` — see the Bluetooth Presence row in §7. No other category may claim a comparable exception; adding one requires amending this paragraph.
- **Adding a key** requires ≥3 concrete candidate integrations (the same threshold that gates sidebar visibility, §5) and is done by a PR that modifies, in the same diff: this spec, the core enum (validation + i18n labels), and the canonical schema in `GladysAssistant/integration-store`. Renaming or removing a key follows the same path plus a redirect entry (§5).
- **An integration declares 1 to 3 categories.** More than 3 means the assignment is lazy, not the vocabulary too narrow.

## 4. Facets and sorting

Facets are cumulative filter chips displayed above the grid, combinable with the category, the search field and each other. All facet state is carried in the URL query string (same rationale and mechanics as `catalog-url.js`: back/"back to integrations" restores the exact view).

| Facet | Values | Data source | Status |
|---|---|---|---|
| Origin | Native / Community | `external` flag, already computed by the front | Data already available |
| Transport | Local / Cloud | `local`/`cloud` fields (native JSONs) and `manifest.transports`, normalized as below | Data already available, **quality gap**: several store manifests have no `transports` (SMTP, CallMeBot, MELCloud, Roborock…), and several native entries declare neither `local` nor `cloud` (OwnTracks…). Entries without the data match neither chip; a completion pass on existing manifests is listed in §8 |
| Gladys Plus | Requires Gladys Plus | `gladysPlus` field (native JSONs) | Native only today; extending it to the manifest is an open question (§9) |
| Updates | Update available | existing `updateAvailable` | Already shipped as the conditional "Updates" sidebar entry; unchanged |

**Transport normalization.** The two sources have different shapes — native JSONs carry two independent booleans (`"local": true`, `"cloud": true`), manifests carry an array (`"transports": ["local", "cloud"]`, 1..2 unique values from that enum, per §C.1 of `external-integrations.md`). The front normalizes both into the same set before filtering, so that equivalent integrations always produce the same facet result:

| Source shape | Normalized set | Local chip | Cloud chip |
|---|---|---|---|
| native `local: true` only / manifest `["local"]` | `{local}` | matches | — |
| native `cloud: true` only / manifest `["cloud"]` | `{cloud}` | — | matches |
| native both booleans true / manifest `["local", "cloud"]` | `{local, cloud}` | matches | matches |
| native neither key present / manifest without `transports` | `{}` (unspecified) | — | — |

Rules: only `true` sets a transport (`false` and a missing key are both "not declared"); an integration supporting both transports matches **both** chips, so selecting Local and Cloud together is a union, not an empty intersection; values outside the `local`/`cloud` enum are ignored, never rendered as a chip. `{}` is the honest state for the quality gap noted above — it is never guessed from the integration `type` — which is why the completion pass on existing manifests is part of Phase B.

**Sorting.** The current A→Z / Z→A selector gains a **"Newest first"** option, answering the original need of topic 10419 (discovering what is new without rescrolling the whole catalog). This requires the store index to expose a per-entry `first_seen_at` (§6.3): the indexer already rebuilds hourly, it only needs to persist the first date it saw each `store_slug`. A "New" badge on cards first seen less than 30 days ago is a cheap complement.

Ordering rules, so that the sort is stable across catalog refreshes:

- **Normalization**: `first_seen_at` is a UTC ISO-8601 timestamp, compared as an instant (never as a raw string across mixed offsets).
- **Missing values sort last**, after every dated entry, in both directions of the selector — an unknown date is not "very old", it is unknown, and burying it is better than claiming a rank the data does not support.
- **Deterministic tie-breaker**: equal timestamps (and the whole undated block, notably every native integration) fall back to the current A→Z rule on the display name, then on the stable identifier (§7) to break exact name duplicates.

Two consequences worth deciding in Phase A rather than discovering later:

- **Backfill.** If the indexer only starts persisting `first_seen_at` at Phase A, all 45 existing community integrations receive the same timestamp and both "Newest first" and the "New" badge are noise for 30 days — exactly when the feature is supposed to answer topic 10419. The seed is therefore computed once, in this order: the GitHub repo `created_at`, else the date of the repo's first commit, else the `generated_at` of the oldest index that contains the `store_slug`. The C.6 `github.pushed_at` is explicitly **not** usable: a documentation commit would reshuffle the catalog.
- **Native integrations** have no `first_seen_at` and therefore sit in the undated block, which means a core integration shipped in a recent 4.x release never surfaces under "Newest first". Giving the native JSONs a `released_at` (or deriving it from the Gladys version that introduced the entry) is what would keep the sort honest across both origins — see §9.5.

## 5. Frontend behavior

- **Sidebar** = `All`, `Favorites`, conditional `Updates` (unchanged), then the categories of §3 in the table's fixed order (stable, not count-ordered).
- **Visibility threshold**: a category appears in the sidebar only when it contains **≥3 integrations** visible to the current user (counted after the role filter — same generalization as today's per-type hiding for non-admins). Below-threshold categories (today: `services`) stay routable by URL and their integrations remain reachable through `All`, search and favorites. This is the same pattern as the conditional `Updates` entry, and it lets the vocabulary contain forward-looking keys without cluttering the menu.
- **Category views** move to `/dashboard/integration/{categoryKey}`. Legacy paths redirect, and a legacy bucket that is *split* across several new shelves goes to the catalog root rather than to one of them — redirecting to a single shelf would silently hide the other half from anyone arriving with a bookmark or an old "back to integrations" link:
  - `device` → catalog root (mixed legacy bucket, split across nearly every new category);
  - `communication` → catalog root: the type holds Telegram, Nextcloud Talk, Free Mobile and CallMeBot (→ `notifications`) **but also** Alexa, Google Home, HomeKit, Artificial Intelligence and MCP (→ `assistants`, §7). Sending it to `notifications` would hide those five. A short "this section was split" landing on the root, prefiltered on the two shelves, is an acceptable variant;
  - `calendar` → `services` and `weather` → `environment` (1:1, no split, no loss);
  - `music`, `health` and `navigation` → catalog root. These three routes are still declared in `front/src/components/app.jsx` although no integration carries the type: they are already absent from the sidebar, but the paths resolve to an empty grid today. Phase B maps them like any other legacy path instead of leaving them dead.
- Category keys are reserved words: they must never collide with `favorites`, `updates`, nor with any legacy type path listed above.
- **Integration page URLs are unchanged** (`/dashboard/integration/{type}/{key}`): `type` is technical (§2.2), so no external doc link, bookmark or "back to integrations" flow breaks.
- **Uncategorized integrations** (store entries with no declared or fallback categories) appear under `All` and in search only — visible, but not promoted. The indexer warns their author (§6.3); better shelf placement is the author's incentive to declare.
- A card can appear under several categories (multi-membership); the counts shown anywhere are per-view and may sum to more than the catalog size, which is fine.

## 6. Data contracts

### 6.1 Native catalog (`front/src/config/integrations/*.json`)

Each entry gains a `categories` array (1..3 keys from §3). The four per-type JSON files remain as they are (they encode `type`, still needed); `config/integrations/index.js` additionally exposes the category → integrations mapping used by the sidebar. Labels come from `integration.root.menu.<key>` in the i18n files.

### 6.2 Manifest (`gladys-assistant-integration.json`)

New **optional** field:

```json
"categories": ["climate", "energy"]
```

Validation runs in **two ordered stages**, and the distinction matters: a strict `enum` on the items would reject a manifest published with a newer vocabulary before any filtering could happen, which is the opposite of the forward compatibility this field needs.

1. **Shape — rejecting.** `categories` must be an array of 1 to 3 unique, non-empty strings. Anything else (not an array, empty array, more than 3 items, duplicates, non-string items) is a **validation error**: the manifest is malformed and is rejected exactly like any other bad field. This stage is expressible in JSON Schema (`type`, `minItems`, `maxItems`, `uniqueItems`, `items.type: string`) and is what `manifest.schema.json` carries — deliberately **without** an `enum` on the items.
2. **Vocabulary — filtering.** Each item is then matched against the §3 enum *in code* (`externalIntegration.validateManifest.js`): unknown keys are **dropped with a warning**, known keys are kept. An integration is never rejected because it declares a category the instance has not heard of.

If every declared key is unknown, the result is `[]` — the integration is treated as uncategorized (§5: visible under `All` and search, not promoted), **not** as a validation error. The store index applies the same fallback chain as any other uncategorized entry (§6.3).

The core and the canonical schema owned by `GladysAssistant/integration-store` implement both stages identically and are kept in lockstep, as today. The only permitted asymmetry: the store indexer, which always knows the current vocabulary, surfaces the stage-2 drop as an author-facing warning, while an instance running an older core drops silently.

**Compatibility sharp edge**: the core validates manifests with a strict field allowlist (`additionalProperties: false`) — an older Gladys **rejects** a manifest carrying an unknown *top-level* field at install/update time. Therefore the rule, enforced by the indexer as a validation error: *a manifest declaring `categories` must set `gladys_version` to at least the first release whose validator accepts the field*. This turns a cryptic install failure on old instances into the standard, well-understood "requires Gladys ≥ X" gate.

### 6.3 Store index (`index.json`)

The indexer computes and exposes, per entry:

- `categories`: the manifest's `categories` if present and valid, otherwise the entry from a **fallback mapping file** maintained in the `GladysAssistant/integration-store` repo (one-time seed for the 45 existing integrations — proposed content in §7 — amendable by simple PR, including by the integration's author), otherwise `[]` (uncategorized, with a validation warning surfaced to the author).
- `first_seen_at`: first indexing date of the `store_slug`, persisted across hourly rebuilds (powers "Newest first", §4).

Placing the data at the **index level** is what makes the whole redesign work without republishing: the front must read the index entry's `categories` (manifest value, else fallback mapping, else `[]`), never `manifest.categories` alone — reading the manifest field alone would leave the 45 existing community integrations uncategorized until each author ships a new release.

Two implementation consequences for Phase A, from the current code:

- `store.getCatalog.js` copies an explicit list of *top-level* index fields and passes `manifest` through as a whole object. Old cores therefore ignore new top-level fields — but so do new ones until the projection is extended: Phase A **must add `categories` and `first_seen_at` to that allowlist**, otherwise the front never sees them.
- `manifest.categories` travels inside the pass-through `manifest` object and is never stripped by the projection. That is harmless on the catalog JSON (it is only read, never re-validated there). The real compatibility edge is the install/update path, where `additionalProperties: false` makes an old core reject the manifest outright — which §6.2 already handles with the `gladys_version` rule.

**Compatibility matrix.** "Backward compatible" is only true field by field, so it is worth being explicit:

| | Old core (validator without `categories`) | New core |
|---|---|---|
| Manifest **without** `categories` | Unchanged: installs, no categories, index fallback still applies for browsing | Installs; categories come from the fallback mapping, else `[]` |
| Manifest **with** `categories` | **Install/update fails** (unknown top-level field) — which is why the indexer requires a `gladys_version` gate (§6.2), turning it into a "requires Gladys ≥ X" catalog filter rather than a runtime error | Installs; manifest categories win over the fallback mapping |
| Index entry with `categories` / `first_seen_at` | Ignored by the `getCatalog` projection: browsing and installing are unaffected | Read, once the projection is extended (above) |

So: **browsing is backward compatible in both directions, installing a `categories`-declaring manifest is not** — it is gated, by design, on `gladys_version`. Install flows themselves are unchanged in code; what changes is which instances see the integration as compatible. The fallback file is expected to shrink over time as authors adopt the manifest field, which always wins over it.

Because §6.2 and §6.3 alter the manifest and the indexer formats, whose source of truth is `docs/specs/external-integrations.md` (§C.1, §C.5 payload, §C.6), **Phase A updates that spec in the same diff**. Until then this RFC stays non-normative and the two documents cannot drift.

### 6.4 What does not change

`type` (values, semantics, screens, host-API surface, non-admin hiding), the device-feature taxonomy (`device-feature-categories.md`), install flows, and every integration-page URL.

## 7. Proposed assignment of the current catalog

Full assignment of the 81 integrations (native + community store as of 2026-08). Native/community duplicates (Philips Hue, Tuya, Telegram…) are expected — they are migrations in progress — and naturally receive the same categories. Resulting distribution (multi-membership, so the sum exceeds 81):

`climate` 13 · `lighting` 13 · `environment` 11 · `protocols` 11 · `notifications` 9 · `energy` 8 · `multimedia` 8 · `network` 7 · `security` 7 · `assistants` 5 · `appliances` 4 · `services` 1

Every category except `services` clears the sidebar threshold, versus today's 62/14/4/1 split — and the heaviest clusters of the real catalog (heating & cooling, lighting & covers) finally get shelves, which no current category even hints at.

**Identifiers, not display names.** The table below is human-readable documentation; the machine-readable artefacts it seeds are keyed by **immutable identifiers only**:

- community entries → `store_slug` (the store index key, §6.3), never the manifest `name`;
- native entries → the integration `key` of `front/src/config/integrations/*.json` (§6.1).

This is not a formality: six display names appear twice in the catalog, once native and once community — *CallMeBot*, *MELCloud*, *Netatmo*, *Philips Hue*, *Telegram* and *Tuya* — and a name-keyed fallback mapping would collide on all six (and break on any author renaming their integration). Here the Origin column disambiguates them; in the fallback mapping file of `GladysAssistant/integration-store`, which only ever covers community entries, the `store_slug` does. Phase A transcribes the community rows below into that file by slug, and the native rows into the `categories` field of the native JSONs by key.

| Integration | Origin | `type` (unchanged) | Proposed `categories` |
|---|---|---|---|
| Airplay | native | `device` | `multimedia` |
| Airzone Cloud | community | `device` | `climate` |
| Amazon Alexa | native | `communication` | `assistants` |
| Apple HomeKit | native | `communication` | `assistants` |
| Apple TV | community | `device` | `multimedia` |
| Artificial Intelligence | native | `communication` | `assistants` |
| Bluetooth Presence | native | `device` | `network`, `protocols` |
| Broadlink | native | `device` | `protocols`, `multimedia` |
| CalDAV | native | `calendar` | `services` |
| CallMeBot | community | `communication` | `notifications` |
| CallMeBot | native | `communication` | `notifications` |
| Cameras | native | `device` | `security` |
| Charger Station | community | `device` | `energy` |
| Daikin Cloud | community | `device` | `climate` |
| De Dietrich | community | `device` | `climate` |
| Enedis | native | `device` | `energy` |
| Energy Monitoring | native | `device` | `energy` |
| Enki | community | `device` | `lighting` |
| eWeLink | native | `device` | `lighting` |
| Free Mobile | native | `communication` | `notifications` |
| Free Mobile SMS | community | `communication` | `notifications` |
| Freebox | community | `device` | `network`, `security`, `multimedia` |
| GARDENA smart system | community | `device` | `appliances` |
| Google Cast | native | `device` | `multimedia` |
| Google Home | native | `communication` | `assistants` |
| GRDF Gazpar | community | `device` | `energy` |
| Home Connect | community | `device` | `appliances` |
| Immich Slideshow | community | `device` | `multimedia` |
| Indice UV | community | `device` | `environment` |
| IPP Printers | community | `device` | `network` |
| LAN Manager | native | `device` | `network` |
| Matter | native | `device` | `protocols` |
| Matterbridge | native | `device` | `protocols` |
| MCP | native | `communication` | `assistants` |
| MELCloud | community | `device` | `climate` |
| MELCloud | native | `device` | `climate` |
| MELCloud Home | community | `device` | `climate` |
| Meross | community | `device` | `lighting` |
| MQTT Virtual Devices | native | `device` | `protocols` |
| MyNeomitis (Axenco) | community | `device` | `climate` |
| Météo Bénélux | community | `weather` | `environment` |
| Météo France | community | `weather` | `environment` |
| Netatmo | community | `device` | `climate`, `security`, `environment` |
| Netatmo | native | `device` | `climate`, `security`, `environment` |
| Nextcloud Talk | native | `communication` | `notifications` |
| Node-RED | native | `device` | `protocols` |
| ntfy | community | `communication` | `notifications` |
| Nuki | native | `device` | `security` |
| OpenWeather | community | `weather` | `environment` |
| OpenWeather API | native | `weather` | `environment` |
| Overkiz | community | `device` | `protocols`, `lighting`, `climate` |
| OwnTracks | native | `device` | `network` |
| Philips Hue | community | `device` | `lighting` |
| Philips Hue | native | `device` | `lighting` |
| Pollens | community | `device` | `environment` |
| Prix carburants | community | `device` | `energy`, `environment` |
| Qualité de l'air | community | `device` | `environment` |
| Reolink | community | `device` | `security` |
| Roborock | community | `device` | `appliances` |
| Saunier Duval | community | `device` | `climate` |
| Shelly | community | `device` | `lighting`, `energy` |
| SmartThings | community | `device` | `protocols`, `lighting` |
| SMTP | community | `communication` | `notifications` |
| Sonos | native | `device` | `multimedia` |
| Spotify | community | `device` | `multimedia` |
| Tapo | community | `device` | `security` |
| Tasmota | native | `device` | `lighting`, `energy` |
| Telegram | community | `communication` | `notifications` |
| Telegram | native | `communication` | `notifications` |
| TP-Link | native | `device` | `lighting` |
| TP-Link Kasa | community | `device` | `lighting` |
| Tuya | community | `device` | `lighting`, `climate` |
| Tuya | native | `device` | `lighting`, `climate` |
| UPnP / IGD | community | `device` | `network` |
| VigiEau | community | `device` | `environment` |
| Xiaomi Home | community | `device` | `appliances` |
| Xiaomi Home | native | `device` | `protocols` |
| Z2M Devices Monitor | community | `device` | `network` |
| Zendure | community | `device` | `energy` |
| Zigbee2mqtt | native | `device` | `protocols` |
| ZWave JS UI | native | `device` | `protocols` |

Notes on debatable rows: the native *Xiaomi Home* integration is the Xiaomi gateway (a hub → `protocols`) while the community one is Roborock-style vacuums (→ `appliances`) — same name, different products; *Prix carburants* is tagged both `energy` (fuel cost) and `environment` (open-data daily-life feed), a good example of a row where the assignment, not the vocabulary, is up for discussion. *Bluetooth Presence* is `network` first, not `protocols`: it is presence detection (i18n: "Presence detection via Bluetooth") that happens to use a radio, and filing it by its transport is exactly the mechanism-as-category mistake the governance rules reject — `protocols` stays as a secondary membership for users who do look for "Bluetooth". *Overkiz* (TaHoma) is primarily a covers hub — shutters, awnings, garage doors — before being an HVAC one, hence `lighting` (which now explicitly carries covers, §3) alongside `climate`; it is the row that exposed the missing covers shelf, see §9.6.

## 8. Rollout

Three phases, each independently shippable:

- **Phase A — contracts (no visible change).** Core: accept the optional `categories` manifest field (validator + schema, two-stage validation §6.2), add `categories` and `first_seen_at` to the `getCatalog` field allowlist, and update `docs/specs/external-integrations.md` (§C.1, §C.5, §C.6) in the same diff — it is the source of truth for those formats, and this RFC stays non-normative until it does. Store repo: canonical schema update, fallback mapping seeded with §7 (keyed by `store_slug`), `first_seen_at` persistence and backfill (§4), author-facing validation warnings.
- **Phase B — catalog UI.** Sidebar driven by categories (§5) with the redirects — including the three dead legacy routes (`music`, `health`, `navigation`) — facet chips with the transport normalization (§4), "Newest first" sort and "New" badge, i18n labels. This is the phase that removes the "Devices" trap and delivers the visible value of topic 10419. Includes the `transports` completion pass on existing store manifests (or accepting their "unspecified" state in the transport facet).
- **Phase C — ecosystem adoption.** Website developer docs, SDK template and example manifests updated to declare `categories`; the fallback mapping shrinks as authors adopt the field.

**Explicitly out of scope**: a global "My devices" inventory page. It is the other half of the original feedback (users looking for their devices), it deserves its own spec, and nothing here blocks it — but no catalog re-labeling replaces it.

## 9. Open questions

1. **Gladys Plus facet for community integrations**: `gladysPlus` exists only in the native JSONs. Manifests using Plus-relayed webhooks (`webhooks` field) could be detected mechanically; a declarative manifest flag is the alternative. To be settled in phase A.
2. **Counts in the sidebar**: show per-category counts next to labels, or keep the menu quiet? (The conditional `Updates` badge already shows a count.)
3. **`services` seeding**: the category is born below the sidebar threshold (CalDAV only). Fine per §5, but if candidates exist (calendar/task/photo services in the store pipeline), listing them here would validate the key.
4. **Category order**: fixed editorial order (§3 table) vs alphabetical-by-label (locale-dependent). This spec proposes the fixed order, so that related shelves (climate/lighting/energy…) stay adjacent in every language.
5. **A `released_at` for native integrations** (§4): without it, "Newest first" can only ever rank community integrations, and a core integration shipped in a recent 4.x release stays invisible under that sort. Adding the field to the native JSONs is cheap; deriving it from the Gladys version that introduced the entry avoids hand-maintained dates. To be settled in phase A, with the `first_seen_at` backfill.
6. **A dedicated `covers` key**: covers (shutters, blinds, awnings, garage doors) are currently carried by `lighting` as the wall-controls shelf — findable in French ("volets"), but a stretch of the label. Promoting them to their own key needs ≥3 concrete candidates per the governance rule; today only *Overkiz* is a dedicated one, the rest being hubs that would claim the shelf as a secondary membership, which is precisely the lazy assignment the rule guards against. To be revisited when the store gains a second and third covers-first integration.
