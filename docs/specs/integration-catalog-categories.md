# Integration catalog categories & filters

> **Status: proposal (RFC).** Nothing in this document is implemented yet. It formalizes a redesign of the integration catalog's navigation (the categories in the left menu of the Integrations page) and proposes facet filters, based on two converging pieces of user feedback and on the actual content of the catalog. Once accepted, this document becomes a living spec under the usual rule: any PR that changes the catalog's categorization behavior or one of the contracts below modifies this file in the same diff.

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
| `lighting` | `zap` | Lighting, plugs & switches / Éclairage, prises & interrupteurs | Lights, smart plugs, wall switches, relays |
| `energy` | `battery-charging` | Energy / Énergie | Meters (electricity, gas), solar & batteries, EV charging, consumption tracking |
| `security` | `shield` | Cameras & security / Caméras & sécurité | Cameras, doorbells, locks, alarm-related sensors |
| `multimedia` | `speaker` | Multimedia / Multimédia | Speakers, TVs, streaming, casting, media remotes |
| `appliances` | `coffee` | Appliances & garden / Électroménager & jardin | Vacuums, kitchen & laundry appliances, mowers, watering |
| `environment` | `cloud` | Weather & environment / Météo & environnement | Weather providers, air quality, pollens, UV, drought, open-data daily-life feeds |
| `protocols` | `radio` | Protocols & hubs / Protocoles & passerelles | Protocol bridges and hubs: Zigbee, Z-Wave, Matter, MQTT, Bluetooth, vendor hubs |
| `network` | `wifi` | Network & presence / Réseau & présence | LAN equipment & monitoring, presence detection, printers, home-network tools |
| `notifications` | `message-square` | Messaging & notifications / Messages & notifications | Messaging channels and notification providers |
| `assistants` | `mic` | Voice assistants & AI / Assistants vocaux & IA | Voice-assistant bridges (Alexa, Google Home, HomeKit) and AI providers |
| `services` | `calendar` | Services / Services | Productivity & personal services (calendars…) — currently below the sidebar threshold, see §5 |

The current `weather` type is absorbed by `environment` as a browse category (the `weather` *type* remains, unchanged, as the technical contract for weather providers).

### Vocabulary governance

Mirroring the rules of `device-feature-categories.md`:

- **A category describes a domain of use, never a brand, a protocol name used as marketing, or a mechanism.** Litmus test: would a user who does not know the brand look for it under this word?
- **Adding a key** requires ≥3 concrete candidate integrations (the same threshold that gates sidebar visibility, §5) and is done by a PR that modifies, in the same diff: this spec, the core enum (validation + i18n labels), and the canonical schema in `GladysAssistant/integration-store`. Renaming or removing a key follows the same path plus a redirect entry (§5).
- **An integration declares 1 to 3 categories.** More than 3 means the assignment is lazy, not the vocabulary too narrow.

## 4. Facets and sorting

Facets are cumulative filter chips displayed above the grid, combinable with the category, the search field and each other. All facet state is carried in the URL query string (same rationale and mechanics as `catalog-url.js`: back/"back to integrations" restores the exact view).

| Facet | Values | Data source | Status |
|---|---|---|---|
| Origin | Native / Community | `external` flag, already computed by the front | Data already available |
| Transport | Local / Cloud | `local`/`cloud` fields (native JSONs) and `manifest.transports` | Data already available, **quality gap**: several store manifests have no `transports` (SMTP, CallMeBot, MELCloud, Roborock…). Entries without the field match neither chip; a completion pass on existing manifests is listed in §8 |
| Gladys Plus | Requires Gladys Plus | `gladysPlus` field (native JSONs) | Native only today; extending it to the manifest is an open question (§9) |
| Updates | Update available | existing `updateAvailable` | Already shipped as the conditional "Updates" sidebar entry; unchanged |

**Sorting.** The current A→Z / Z→A selector gains a **"Newest first"** option, answering the original need of topic 10419 (discovering what is new without rescrolling the whole catalog). This requires the store index to expose a per-entry `first_seen_at` (§6.3): the indexer already rebuilds hourly, it only needs to persist the first date it saw each `store_slug`. Native integrations sort as "old" (they predate the field). A "New" badge on cards first seen less than 30 days ago is a cheap complement.

## 5. Frontend behavior

- **Sidebar** = `All`, `Favorites`, conditional `Updates` (unchanged), then the categories of §3 in the table's fixed order (stable, not count-ordered).
- **Visibility threshold**: a category appears in the sidebar only when it contains **≥3 integrations** visible to the current user (counted after the role filter — same generalization as today's per-type hiding for non-admins). Below-threshold categories (today: `services`) stay routable by URL and their integrations remain reachable through `All`, search and favorites. This is the same pattern as the conditional `Updates` entry, and it lets the vocabulary contain forward-looking keys without cluttering the menu.
- **Category views** move to `/dashboard/integration/{categoryKey}`. The four legacy type paths redirect: `device` → catalog root, `communication` → `notifications`, `calendar` → `services`, `weather` → `environment`. Category keys are reserved words: they must never collide with `favorites`, `updates`, nor with the legacy type paths.
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

- Array, 1..3 items, unique, each item from the §3 enum. Validated by `externalIntegration.validateManifest.js` / `manifest.schema.json` in the core, and by the canonical schema owned by `GladysAssistant/integration-store` (the two are kept in lockstep, as today).
- **Compatibility sharp edge**: the core validates manifests with a strict field allowlist — an older Gladys **rejects** a manifest carrying an unknown field at install/update time. Therefore the rule, enforced by the indexer as a validation error: *a manifest declaring `categories` must set `gladys_version` to at least the first release whose validator accepts the field*. This turns a cryptic install failure on old instances into the standard, well-understood "requires Gladys ≥ X" gate.
- Unknown category keys (published with a newer vocabulary than the instance knows): the instance **drops the unknown keys and keeps the rest** — forward compatibility must never reject an otherwise valid integration.

### 6.3 Store index (`index.json`)

The indexer computes and exposes, per entry:

- `categories`: the manifest's `categories` if present and valid, otherwise the entry from a **fallback mapping file** maintained in the `GladysAssistant/integration-store` repo (one-time seed for the 45 existing integrations — proposed content in §7 — amendable by simple PR, including by the integration's author), otherwise `[]` (uncategorized, with a validation warning surfaced to the author).
- `first_seen_at`: first indexing date of the `store_slug`, persisted across hourly rebuilds (powers "Newest first", §4).

This placement is deliberately **backward compatible in both directions**: the instance's catalog builder projects index entries through an explicit field allowlist (`store.getCatalog.js`), so old cores simply ignore the new entry fields, and new cores get categories for the whole store immediately — including integrations whose authors never republish, thanks to the fallback mapping. The fallback file is expected to shrink over time as authors adopt the manifest field, which always wins over it.

### 6.4 What does not change

`type` (values, semantics, screens, host-API surface, non-admin hiding), the device-feature taxonomy (`device-feature-categories.md`), install flows, and every integration-page URL.

## 7. Proposed assignment of the current catalog

Full assignment of the 81 integrations (native + community store as of 2026-08). Native/community duplicates (Philips Hue, Tuya, Telegram…) are expected — they are migrations in progress — and naturally receive the same categories. Resulting distribution (multi-membership, so the sum exceeds 81):

`climate` 13 · `lighting` 12 · `environment` 11 · `protocols` 11 · `notifications` 9 · `energy` 8 · `multimedia` 8 · `security` 7 · `network` 6 · `assistants` 5 · `appliances` 4 · `services` 1

Every category except `services` clears the sidebar threshold, versus today's 62/14/4/1 split — and the heaviest cluster of the real catalog (heating & cooling) finally gets a shelf, which no current category even hints at.

| Integration | Origin | `type` (unchanged) | Proposed `categories` |
|---|---|---|---|
| Airplay | native | `device` | `multimedia` |
| Airzone Cloud | community | `device` | `climate` |
| Amazon Alexa | native | `communication` | `assistants` |
| Apple HomeKit | native | `communication` | `assistants` |
| Apple TV | community | `device` | `multimedia` |
| Artificial Intelligence | native | `communication` | `assistants` |
| Bluetooth Presence | native | `device` | `protocols` |
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
| Overkiz | community | `device` | `protocols`, `climate` |
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

Notes on debatable rows: the native *Xiaomi Home* integration is the Xiaomi gateway (a hub → `protocols`) while the community one is Roborock-style vacuums (→ `appliances`) — same name, different products; *Prix carburants* is tagged both `energy` (fuel cost) and `environment` (open-data daily-life feed), a good example of a row where the assignment, not the vocabulary, is up for discussion.

## 8. Rollout

Three phases, each independently shippable:

- **Phase A — contracts (no visible change).** Core: accept the optional `categories` manifest field (validator + schema), project `categories` and `first_seen_at` from index entries through `getCatalog`. Store repo: canonical schema update, fallback mapping seeded with §7, `first_seen_at` persistence, author-facing validation warnings.
- **Phase B — catalog UI.** Sidebar driven by categories (§5) with the redirects, facet chips (§4), "Newest first" sort and "New" badge, i18n labels. This is the phase that removes the "Devices" trap and delivers the visible value of topic 10419. Includes the `transports` completion pass on existing store manifests (or accepting their "unspecified" state in the transport facet).
- **Phase C — ecosystem adoption.** Website developer docs, SDK template and example manifests updated to declare `categories`; the fallback mapping shrinks as authors adopt the field.

**Explicitly out of scope**: a global "My devices" inventory page. It is the other half of the original feedback (users looking for their devices), it deserves its own spec, and nothing here blocks it — but no catalog re-labeling replaces it.

## 9. Open questions

1. **Gladys Plus facet for community integrations**: `gladysPlus` exists only in the native JSONs. Manifests using Plus-relayed webhooks (`webhooks` field) could be detected mechanically; a declarative manifest flag is the alternative. To be settled in phase A.
2. **Counts in the sidebar**: show per-category counts next to labels, or keep the menu quiet? (The conditional `Updates` badge already shows a count.)
3. **`services` seeding**: the category is born below the sidebar threshold (CalDAV only). Fine per §5, but if candidates exist (calendar/task/photo services in the store pipeline), listing them here would validate the key.
4. **Category order**: fixed editorial order (§3 table) vs alphabetical-by-label (locale-dependent). This spec proposes the fixed order, so that related shelves (climate/lighting/energy…) stay adjacent in every language.
