> Part of the [external integrations living spec](../README.md) — the layout, the editing rules and the cross-repo map are there.

# Music players: live "now playing" model, proxied artwork and on-demand catalog (design)

Goal: that the dashboard music widget becomes a real player — artwork, title, artist, progress bar, play/pause, next/previous, volume, shuffle, repeat, the queue, and a way to find and start a track or a playlist — the way a Spotify or Sonos app does, for any player an integration exposes.

This file has no historic section identifier (the README's rule: none is allocated to a new file) — it is cited by its path, `capabilities/music.md`.

**Status: design, not implemented.** The rule of the living spec applies from the first code PR: any change to a behavior or contract below edits this file in the same diff.

**State before this workstream (verified in the code).** The `music` category (`DEVICE_FEATURE_CATEGORIES.MUSIC`) carries seven types: `play`, `pause`, `previous`, `next` (one-shot commands), `volume` (0–100), `playback_state` (read-only, `MUSIC_PLAYBACK_STATE`: `PAUSED: 0`, `PLAYING: 1`) and `play_notification` (a TTS URL to play, the `MUSIC.PLAY_NOTIFICATION` scene action). The `music` dashboard box (`front/src/components/boxs/music/MusicBox.jsx`) renders the device name, three transport buttons and a volume slider, and keeps `isPlaying` in sync over `DEVICE.NEW_STATE`. Nothing describes what is playing. Three internal services expose the category: `sonos` (`@svrooij/sonos`, every feature published with `keep_history: false`), `google-cast` (`play_notification` only) and `airplay`.

## Decisions taken with the maintainer

- **Music integrations are external integrations only.** No internal service gains a music interface: the core carries no `service.music.*` contract. The three internal services are frozen (section 8); Sonos, Spotify and the others live in the store.
- **No new entity, no new storage path.** A player stays a device; what is playing is a set of device features of the existing `music` category, held in RAM by the `stateManager` and mirrored in `t_device_feature` like every feature, with **no state history** (section 2). The queue, the catalog and search are **not states**: they are read on demand through the integration (section 4).
- **Artwork is always proxied**, from the first version: the browser never loads a third-party or a LAN URL. The integration serves the bytes behind a key and the core caches and serves them, the mechanism of `capabilities/dashboard-widgets.md` section 6 (section 3).
- **`playback_state` becomes writable** (the Gladys idiom: a feature is both the state and the command, like `light`/`binary`); `play` and `pause` stay as legacy one-shot commands.
- **Multi-room grouping is out of scope** of this workstream (listed in the later leads, with its design notes).

## 1. Device model: the `music` category completed

A player is one device. Its "now playing" is a set of features of the `music` category, one atomic value each (`device-feature-categories.md`, rule 5). The existing types are kept; the category gains the types below (`DEVICE_FEATURE_TYPES.MUSIC`), each with the inline scope comment rule 8 requires.

| Type | Value | Writable | Semantics |
|---|---|---|---|
| `playback_state` (existing) | enum `MUSIC_PLAYBACK_STATE`: `PAUSED: 0`, `PLAYING: 1`, **`IDLE: 2`**, **`BUFFERING: 3`** | **yes** (new) | `IDLE`: nothing loaded or playback stopped. `BUFFERING` is reported only. Writing `1` starts playback, `0` pauses, `2` stops; writing `3` is refused (`400`). `min: 0`, `max: 2` on a writable feature |
| `title` | string | no | title of the current track, or of the stream / station; empty when idle |
| `artist` | string | no | main artist(s) of the current track; empty when unknown |
| `album` | string | no | album, playlist or show the current track belongs to; empty when unknown |
| `artwork` | string, an **image key** (`^[a-z0-9][a-z0-9-]{0,63}$`) | no | key of the current artwork, served by the proxy route of section 3; empty when none |
| `duration` | integer, unit `seconds` | no | length of the current track; `0` for a live stream or when unknown |
| `position` | integer, unit `seconds` | **yes** | position in the current track **at the instant of `last_value_changed`** (section 2); writing a value seeks to it |
| `shuffle` | binary `0`/`1` | yes | shuffle mode of the player |
| `repeat` | enum `MUSIC_REPEAT_MODE`: `OFF: 0`, `ALL: 1`, `ONE: 2` | yes | repeat mode of the player |
| `mute` | binary `0`/`1` | yes | mute state, independent from `volume` (a muted player keeps its volume level) |

Kept as they are: `volume`, `play`, `pause`, `previous`, `next`, `play_notification`. No `stop` type: writing `IDLE` to `playback_state` is the stop command.

**Standards check (rule 3).** Matter's Media Playback cluster models the transport: `CurrentState` (Playing, Paused, NotPlaying, Buffering), `Duration`, `SampledPosition` (a position with the instant it was sampled — exactly the `position` + `last_value_changed` model of section 2), and the Play / Pause / Stop / Seek / Next / Previous commands; the Level Control cluster carries the volume and mute of the Speaker device type. The enum values of `playback_state` diverge from Matter's order (Matter: Playing = 0, Paused = 1) because `PAUSED: 0` / `PLAYING: 1` are already published by integrations and referenced by scenes; the two new values are appended. Matter has no metadata model: `title`, `artist`, `album`, `artwork`, `shuffle` and `repeat` are the capability-first set every player API exposes (Sonos AVTransport metadata, Google Cast media status, AirPlay, Spotify's player state, Home Assistant's `media_player`), none modeled on a single vendor.

**Writable features and feedback.** Every writable music feature is published with **`has_feedback: true`**: the player is the source of truth, the core relays the write (`external-integration.device.set-value`, C.4) and saves nothing, and the new state arrives when the player confirms it (an event for Sonos, the next poll for a cloud API). The widget renders optimistically until the confirmation or the next state (section 6).

**Sources, favorites and playlists are not music types.** A list that only exists on the appliance (inputs, the user's playlists, radio presets) goes through the dynamic `text`/`select` feature with `supported_options` (`device-feature-categories.md`, rule 6) or, when it is large or searchable, through the catalog of section 4.

## 2. The live contract: no history, publish on events, extrapolate

Music is live: there is nothing to chart and a position that moves every second must not become a write per second. Four rules, enforced by the core where it can, by the SDK and the developer documentation elsewhere.

1. **No state history on the whole category.** The core sets `keep_history: false` on every `music` feature at `device.create`, on creation and on update, whatever the integration published or the user chose; the external "Devices" screen hides the "Keep state history?" switch for the category, like it already does for `text` (`isHistorizableFeature`), and the MQTT device screen does the same. A numeric music state goes through `saveState` without the DuckDB insert; a string state goes through `saveStringState`, which never historizes. What remains per state change is what every feature already costs: the RAM store, one `UPDATE t_device_feature`, one user WebSocket message, one trigger check. A device whose `volume` was historized before this change loses that history at its next save, through the standard purge path of `device.create`.
2. **Position is never streamed.** The integration publishes `position` only on a discrete event: a change of `playback_state`, a seek, a change of track (together with the new `title`), and after a reconnection. Never on a timer. `last_value_changed` of the `position` feature is the instant the position was true (the `UpdatedAt` of Matter's `SampledPosition`). The frontend extrapolates: while `playback_state` is `PLAYING`, `shown = position + (now - receivedAt)`, clamped to `duration`; frozen while paused or buffering; `0` when idle. `receivedAt` is the client-side reception time of the state (the WebSocket message or the initial `GET`), so the extrapolation never depends on the clock skew between the server and the browser.
3. **Publish changes only.** A polling integration (a cloud API read every few seconds) publishes a state when its value differs from the last one it published — the `POST /state` rate limit (300 states per minute per integration, C.3) is sized for state changes, not snapshots. The SDK helper `publishNowPlaying` (section 5) does the diff.
4. **A track change is one batch.** The states of one track change (`title`, `artist`, `album`, `artwork`, `duration`, `position`, `playback_state`) are published in one `POST /state` batch, so the widget redraws once; the core emits them as the standard per-feature WebSocket messages, no new message type.

Cost check: a track change is seven states every three to four minutes per player; a play/pause gesture is two. Nothing that needs a volatile storage mode, which is why none is introduced (see "Alternatives considered").

The scene engine gets the `device.new-state` trigger on every one of these features for free: "when the track changes on the kitchen speaker" is the existing device-state trigger on `title`.

## 3. Artwork: integration-served keys, core-proxied bytes

The doctrine of `capabilities/dashboard-widgets.md` section 6 applies as is: the browser never loads a third-party URL (the user's IP would reach the provider on every dashboard render), the core never fetches a URL on an integration's behalf (a request into the LAN from a sandboxed container, SSRF by construction), and **the integration resizes, the core validates and never recompresses**.

- **Keys, not URLs.** The `artwork` state and the `artwork_key` of a `MediaItem` (section 4) carry a key (`^[a-z0-9][a-z0-9-]{0,63}$`), integration-scoped and **immutable for the life of the cache**: when the bytes change, the key changes. The natural key is content-addressed from the source URL (`art-<12 hex of a hash of the URL>`, the SDK's `artworkKey(url)` helper): two tracks of one album share one key, one command, one cache entry.
- **Bytes on demand.** `GET /api/v1/device/:selector/music/artwork/:key` (standard user auth, same device access rules as the other device routes) → the core sends `external-integration.music.get-artwork` `{ message_id, key }` to the device's integration and serves the `content-type;base64,data` shape of the weather and widget image routes. Decoded bytes validated exactly like widget images: PNG, JPEG or WebP by magic numbers, **≤ 300 KB**, pixel size read from the header **≤ 4096 × 4096**, each refusal named by its code and logged with the selector and the key (the `normalizeWidgetImage` rules and codes, reused as is). Cached **1 h** per `(integration, key)` in the same LRU store as widget images (≤ 100 entries per integration), **at most 4 image commands in flight per integration**, concurrent requests for one key share one command. Ack within **15 s**, the documented exception of `widget.get-image`.
- **Allowlist.** A key is served only when the core has seen it come from that integration: as the current `artwork` state of one of its devices (read from the `stateManager` at request time), or as an `artwork_key` in a music response of the last 10 minutes (a per-integration LRU set of 1000 keys). Any other key `404`s without a byte sent to the integration — the shape of the key is checked before anything else, as for widget images.
- **Size guidance.** The now-playing frame is rendered under 400 px wide, a list thumbnail under 64 px: the integration asks its source for the small variant (Spotify serves 300 px and 64 px images, Sonos accepts a size in its album-art URL) or resizes in its container. The SDK dev mode checks the image before it leaves the integration, like widget images.

Why not the camera pattern (the image as a base64 state)? It would put 30–50 KB of base64 in every `GET /device` answer that lists the player, in every `DEVICE.NEW_STRING_STATE` message, and in the `t_device_feature` row — and it gives no way to show a thumbnail per queue or search item. Keys do all of that with the code the widget image route already has.

## 4. On-demand catalog: queue, browse, search, play

A queue is a list, a catalog is a tree, search results are a page: none of them is an atomic device state (rule 5), and all of them depend on the account behind the integration. They are **read on demand**: the frontend asks the core, the core relays to the integration over the integration WebSocket, waits, and returns. Nothing is stored, nothing is pushed, no user WebSocket message is added.

### 4.1 Manifest: the `music` field

An integration that implements any of these operations declares them:

```json
"music": { "browse": true, "search": true, "queue": true, "append": false }
```

Each boolean defaults to `false`. `browse`, `search` and `queue` name the three read operations; `append` says the player accepts `mode: "next"` / `"append"` on a play command (section 4.3). The core answers `404 MUSIC_OPERATION_NOT_SUPPORTED` for an undeclared operation **without sending a command**, and the frontend reads the declaration through `GET /api/v1/device/:selector/music/capabilities` (below) to decide which panels to show. The field is accepted on `type: "device"` manifests only (a player is a device), and it is one of the fields the manifest's `structure_changed` ignores (it changes nothing on the user's devices). The `manifest.schema.json` of the store gains the field (canonical copy in `GladysAssistant/integration-store`, vendored copy in the monorepo).

### 4.2 The `MediaItem` object

One shape for the queue, the catalog and search results, so the frontend has one list component and one picker:

```json
{
  "id": "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M",
  "type": "playlist",
  "title": "Today's Top Hits",
  "subtitle": "Spotify",
  "duration": null,
  "artwork_key": "art-3f9a2c1b7e4d",
  "browsable": false,
  "playable": true
}
```

- `id`: an opaque string **owned by the integration** (a Spotify URI, a Sonos favorite id, a stream URL…), ≤ 512 characters. The core never interprets it; it is what a play command and a scene action carry back.
- `type`: one of the core enum `MUSIC_MEDIA_TYPES`: `track`, `album`, `artist`, `playlist`, `radio`, `folder`. Translated by the core (`front/src/config/i18n/*.json`), never a vendor label.
- `title` (required, ≤ 200 characters), `subtitle` (optional, ≤ 200: the artist of a track, the owner of a playlist, the station's slogan), `duration` (optional, integer seconds, `null` when not applicable).
- `artwork_key`: optional, the key of section 3.
- `browsable` / `playable`: what the user can do with the item; a `folder` is browsable and not playable, a `track` the reverse, a `playlist` or an `album` usually both.

The core **whitelists and bounds** every field (the weather and widget doctrine: a payload from unaudited code is normalized before use): unknown fields dropped, strings truncated at their cap, `type` outside the enum or a missing `id`/`title` → the item is dropped with a warning, **at most 100 items per response**. Text is rendered escaped, like every free-form text published by an integration.

### 4.3 Management API (front → core)

All routes under `/api/v1/device/:selector/music/`, standard user authentication, the same device access rules as `POST /api/v1/device_feature/:selector/value`. The device must belong to an external integration (`404 MUSIC_NOT_SUPPORTED` otherwise — an internal service's player), the integration must be connected (`503 EXTERNAL_INTEGRATION_UNAVAILABLE` otherwise), the operation must be declared in its manifest (section 4.1).

| Route | Answer |
|---|---|
| `GET .../capabilities` | `{ "browse", "search", "queue", "append" }` — the manifest declaration; one call when the widget mounts |
| `GET .../browse?parent_id=&offset=0&limit=50` | `{ "items": [MediaItem], "total": 123 }` — without `parent_id`, the **root**: the integration's entry points as `folder`s ("Favorites", "My playlists", "Radios", "Library"…); `parent_id` is the `id` of a browsable item; `limit` ≤ 100 |
| `GET .../search?q=&type=&limit=20` | `{ "items": [MediaItem] }` — `q` required (1–200 characters), `type` optional (one of `MUSIC_MEDIA_TYPES`, to filter), `limit` ≤ 50 |
| `POST .../play` body `{ "media": { "id", "type" }, "mode": "replace" }` | `200 { "success": true }` — starts the media. `mode`: `replace` (required for every integration: replaces the current playback), `next` and `append` (enqueue after the current track / at the end; `400 MUSIC_MODE_NOT_SUPPORTED` when the manifest does not declare `append`) |
| `GET .../queue?offset=0&limit=50` | `{ "items": [MediaItem], "current_index": 3, "total": 42 }` — the player's queue; `current_index` is the index of the playing item in the full queue (`null` when none); `limit` ≤ 100 |
| `POST .../queue/play` body `{ "index": 7 }` | `200 { "success": true }` — jumps to the item at that index of the full queue |
| `GET .../artwork/:key` | the image (section 3) |

Errors from the integration (`command-result` with `success: false`) surface as `400 REQUEST_TO_THIRD_PARTY_FAILED` with the relayed message, escaped; a timeout as `504`. **Timeout: 10 s** (`MUSIC_COMMAND_TIMEOUT_MS`), a documented exception to the 5 s ack rule: a search is a third-party API call. **At most 4 music commands in flight per integration** (`MAX_MUSIC_COMMANDS_IN_FLIGHT`); beyond, the request fails at once with `429` rather than queueing behind the others until the deadline (the AI chat rule). The frontend debounces search input at 300 ms.

### 4.4 Integration WebSocket messages (C.4)

Each message carries a `message_id` and expects a `command-result` ack within 10 s (artwork: 15 s). `device` is the standard `{ external_id, selector, params }` of `device.set-value`.

| Direction | `type` | `payload` → `data` of the ack |
|---|---|---|
| core → integration | `external-integration.music.browse` | `{ message_id, device, parent_id: null \| "…", offset, limit }` → `{ "items": [MediaItem], "total" }` |
| core → integration | `external-integration.music.search` | `{ message_id, device, query, type: null \| "track" \| …, limit }` → `{ "items": [MediaItem] }` |
| core → integration | `external-integration.music.play` | `{ message_id, device, media: { id, type }, mode }` → no data |
| core → integration | `external-integration.music.queue-get` | `{ message_id, device, offset, limit }` → `{ "items": [MediaItem], "current_index", "total" }` |
| core → integration | `external-integration.music.queue-play` | `{ message_id, device, index }` → no data |
| core → integration | `external-integration.music.get-artwork` | `{ message_id, key }` → `{ "image": "<raw base64, no data-URI prefix>" }` (section 3 bounds; 15 s) |

Everything else the player does goes through the existing contract: states (`POST /state`, numeric `state` or string `text`), commands (`external-integration.device.set-value`, including the writes of `playback_state`, `position`, `shuffle`, `repeat`, `mute`, `volume`), `play_notification` (a URL string, the existing one-shot command), polling (`device.poll`).

Constants: `WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MUSIC_BROWSE` / `MUSIC_SEARCH` / `MUSIC_PLAY` / `MUSIC_QUEUE_GET` / `MUSIC_QUEUE_PLAY` / `MUSIC_GET_ARTWORK` in `server/utils/constants.js`; `MUSIC_COMMAND_TIMEOUT_MS`, `MAX_MUSIC_COMMANDS_IN_FLIGHT`, `MAX_MUSIC_ITEMS_PER_RESPONSE` (100), `MAX_MUSIC_MEDIA_ID_LENGTH` (512), `MAX_MUSIC_TEXT_LENGTH` (200), `MAX_MUSIC_SEARCH_QUERY_LENGTH` (200), `MUSIC_ARTWORK_KEY_REGEX`, `MAX_MUSIC_ARTWORK_KEYS_PER_INTEGRATION` (1000) in `server/lib/external-integration/constants.js`; `MUSIC_REPEAT_MODE` and `MUSIC_MEDIA_TYPES` next to `MUSIC_PLAYBACK_STATE` in `server/utils/constants.js`.

## 5. SDK (`@gladysassistant/integration-sdk`, C.8)

The SDK carries the convenience so that an integration author never reimplements the diffing and the key bookkeeping.

| Surface | Contract |
|---|---|
| `publishNowPlaying(deviceExternalId, nowPlaying)` | `nowPlaying = { playback_state, title, artist, album, artwork_url, duration, position, shuffle, repeat, mute, volume }` (every key optional). Diffs against the last snapshot published for that device and sends **one `publishStates` batch** of the changed values (rule 3 of section 2); turns `artwork_url` into its key through `artworkKey` and publishes the key as the `artwork` state; always republishes `position` when `playback_state` or `title` changes or when the reported position deviates from the extrapolated one by more than 3 s (a seek); never republishes an unchanged position otherwise (rule 2). Feature external ids follow the integration's own convention; the helper takes a `featureExternalIds` map or defaults to `` `${deviceExternalId}:${type}` `` |
| `artworkKey(url)` | deterministic key for a source URL (`art-` + 12 hex of a SHA-1 of the URL); records the URL so the default artwork handler can serve it |
| `onMusicGetArtwork(cb)` | `(key) => Promise<string>` — resolve the raw base64 of the image; **default handler** fetches the URL recorded by `artworkKey` and returns its bytes as served (an integration whose source only serves large images overrides it with a resize step); the resolved string goes into `data.image` (15 s) |
| `onMusicBrowse(cb)` | `(device, { parentId, offset, limit }) => Promise<{ items, total }>` |
| `onMusicSearch(cb)` | `(device, { query, type, limit }) => Promise<{ items }>` |
| `onMusicPlay(cb)` | `(device, media, mode) => Promise` |
| `onMusicQueueGet(cb)` | `(device, { offset, limit }) => Promise<{ items, currentIndex, total }>` |
| `onMusicQueuePlay(cb)` | `(device, index) => Promise` |

Handlers follow the automatic-ack rule of C.8 (resolve → `success: true` with the value in `data`, throw → `success: false` with the message, absent → `"not implemented"`). The dev mode of the SDK validates `MediaItem`s and artwork against the bounds of sections 3 and 4 before they leave the integration, and the template shows a player with `publishNowPlaying` on an event and the five handlers.

## 6. Frontend: the music box

One box per player, as today (`box.device`, the device selector — the field `device-migration.md` B.3 already rewrites on a migration; nothing new to register there). The box fetches its device, the music capabilities (`GET .../music/capabilities`, `404` → legacy layout), and listens to `DEVICE.NEW_STATE` and `DEVICE.NEW_STRING_STATE` for its features, plus `websocket.connected` to refetch after a disconnection (the existing pattern of the box).

- **Now playing**: the artwork (`GET .../music/artwork/:key`, lazy-loaded, a neutral placeholder when the key is empty or the image is refused), `title`, `artist` and `album`, the progress bar extrapolated per section 2 (tappable to seek when `position` is writable; a live stream with `duration: 0` shows no bar), the state label of `playback_state` (`deviceFeatureValue` translations, including `idle` and `buffering`).
- **Transport**: previous / play-pause / next. Play-pause writes `playback_state` when the feature is writable, and falls back to the `play` / `pause` one-shot features otherwise (the frozen internal services). Optimistic rendering: the button flips at once and is corrected by the next state. `shuffle`, `repeat` and `mute` render only when the feature exists; `volume` as today.
- **Queue panel** (when `capabilities.queue`): the `MediaItem` list with the current item highlighted, a tap jumps (`POST .../queue/play`); refetched when the panel opens and when `title` changes.
- **Browse and search panel** (when `capabilities.browse` or `capabilities.search`): a search field (300 ms debounce, optional `type` filter chips) and the root folders; a tap on a browsable item opens it, a tap on a playable item plays it (`mode: replace`), a secondary gesture enqueues it when `capabilities.append` (`next` / `append`).
- **Legacy layout**: a device without the new features (an internal Sonos, a MQTT player) renders exactly what the box renders today; the box adds nothing it has no data for, so the update breaks no dashboard.
- **Touch targets** follow `dashboard-flexible-layout-and-widgets.md` (≥ 44 px on coarse pointers, the music transport already in its audit list).
- **Devices-in-room widget**: `playback_state` and `volume` keep rendering as controls; the new text and progress types do not render there (the music box is their place) — they join the non-push-button sets of `front/src/utils/consts.js` so they never appear as buttons (`isPushButtonFeature` treats every unknown `music` type as a push button today); `SUPPORTED_FEATURE_TYPES` gains `playback_state`, `shuffle`, `repeat` and `mute`.
- **Edit box**: unchanged selection of players with a `play` feature; it also accepts a player exposing a writable `playback_state` without `play`.

## 7. Scenes: the `music.play-media` action

A new core action `ACTIONS.MUSIC.PLAY_MEDIA` (`music.play-media`), next to `play-notification`:

```json
{ "type": "music.play-media", "device": "kitchen-speaker", "media": { "id": "spotify:playlist:…", "type": "playlist", "title": "Morning" }, "mode": "replace" }
```

- **Editor**: a player select (music devices of external integrations whose manifest declares `browse` or `search`), then the browse / search picker of section 6 reused as is; the chosen `MediaItem` is stored as `{ id, type, title }` — the title is display only and may age, **the `id` is what plays**. `mode` defaults to `replace`, `next` / `append` offered when the integration declares `append`.
- **Runtime**: `gladys.device.music.play(device, media, mode)` → the relay of section 4.4; an integration that is stopped, disconnected or refusing makes the action throw, and the scene framework contains and logs the failure as for `play-notification` (there is nothing to degrade to).
- **Migration**: the action stores the **device** selector, so `device.migrate` rewrites it unconditionally (the `play_notification` precedent of `device-migration.md`); the `media.id` only makes sense on the same provider, so the migration modal warns when the destination device belongs to another integration.
- The MCP scene schemas (`server/services/mcp/lib/sceneSchemas.js`) expose the action with its `media` reference as free fields; the assistant can fill `id` only from a search it ran through the same routes (a later lead, not part of the first PR).

## 8. Internal services: frozen, and the migration path

- `sonos`, `google-cast` and `airplay` keep their current features and receive **none** of the new types, the music routes answer `404 MUSIC_NOT_SUPPORTED` for their devices, and the music box renders them with the legacy layout. No change in the core PR.
- The community [gladys-sonos](https://github.com/vincentBesseau/gladys-sonos) external integration is the natural first implementation of this contract (`@svrooij/sonos` exposes track metadata and album art in the AVTransport event, the position through `GetPositionInfo`, the queue, favorites and a multi-service search); Spotify (cloud, OAuth2 field, polling every few seconds, `replace` only: the Web API enqueues at the end without a jump) is the second. Google Cast has no catalog: a Cast integration implements the now-playing states and transport only.
- Users move from an internal player to its external replacement with the existing **device migration** (`device-migration.md`): room, `music` boxes and scenes follow, `play_notification` keeps working when the destination implements it (its modal warning already covers the case).
- The three internal services are removed in a later major version, once their replacements are published in the store.

## 9. Compliance with `device-feature-categories.md`

- [x] No brand, product or vendor name in the types or their semantics; every type is the capability every player exposes.
- [x] Nothing mappable onto an existing category + type: `text`/`text` was considered for `title`/`artist`/`album` and rejected — a `music` type carries the semantics the widget and the scene editor need (a trigger "when the title changes" must not be configured on an anonymous text feature), and `text` is the category of free-form values the user writes.
- [x] One quantity, one type: `position` and `duration` are the only time values; `mute` is separate from `volume` because the two are independent on every player.
- [x] Intrinsic metrics only: the queue, the catalog and search are not features (section 4); sources and playlists go through `text`/`select` or the catalog.
- [x] Matter checked (Media Playback and Level Control clusters), semantics aligned, the one divergence (the order of `playback_state`'s values) justified by backward compatibility; the metadata types, outside any standard, shown generic across Sonos, Cast, AirPlay, Spotify and Home Assistant.
- [x] Enum types expose the full value set (`playback_state` with four values, `repeat` with three); a player that has no shuffle or repeat simply does not publish the feature.
- [x] Naming: kebab-case values, English, no protocol name.
- [x] Stress-tested against the neighbors: a TV or a receiver reporting what it plays would use the same `music` metadata types with its `television` controls on the same device; a radio tuner publishes `title` = station and `duration: 0`.
- [x] Inline scope comments on every new constant (`position` is the sampled position at `last_value_changed`; `duration: 0` means unknown or live; `artwork` is an image key, never a URL).
- [x] Translations in every locale: the type labels, `deviceFeatureValue` for `playback_state` (`0`–`3`) and `repeat` (`0`–`2`), the `MUSIC_MEDIA_TYPES` labels, the box's strings (`npm run compare-translations`).
- [x] Units: `seconds` for `duration` and `position` in `DEVICE_FEATURE_UNITS_BY_CATEGORY_AND_TYPE` (the category otherwise has `percent` for `volume`).
- [x] MQTT feature defaults (`front/src/routes/integration/all/mqtt/device-page/utils.js`: the new types as sensors or 0/1 controls, `keep_history` off) and no history grouping (`categoryGroups.js`: nothing to show, the category has no history).
- [x] Tests and this spec in the same diff as the code.

## 10. Security and accepted risks

- Nothing new crosses the sandbox boundary: every music command is outbound from the core on a user's gesture, bounded in flight, and acked or timed out; the integration never pushes a list uninvited.
- Every payload coming back is whitelisted, capped and escaped before it is stored (never) or rendered (always): `MediaItem` fields, counts, image bytes, image dimensions. A refused image or item is logged with the selector, as for widgets.
- The artwork allowlist means a user cannot make an integration fetch arbitrary keys; keys are opaque and the integration maps them to URLs it chose itself.
- `media.id` is opaque to the core and flows back to the integration that produced it, with the user's gesture behind it: the same trust level as a `set-value` on a feature of that integration. A scene action carrying an `id` is as trusted as the user who saved it.
- The core still never fetches a URL for an integration (section 3). Accepted: a provider's small artwork variant is sometimes not small enough and the integration must resize; the SDK dev mode catches it before publication.

## 11. Tests (100% patch coverage, B.13)

- **Constants and taxonomy**: `compare-translations` for the new types, values and media types; `normalizeSupportedOptions` unchanged.
- **`device.create`**: `keep_history` forced to `false` on every `music` feature at creation and update, the purge job scheduled for a feature that had history; other categories untouched.
- **`device.setValue` / `saveState`**: a writable `playback_state` relays `0`/`1`/`2` and refuses `3`; `has_feedback` saves nothing; `position` write relays the seek.
- **Manifest** (`validateManifest`): the `music` field with its four booleans, defaults, refused on a non-`device` type, ignored by `structure_changed`; the vendored schema carries it.
- **Proxy service / supervisor**: each of the six commands relayed with the right payload, 10 s (15 s for artwork) timeouts honored, `success: false` → `ExternalIntegrationUnavailableError`, in-flight cap, undeclared operation refused without a command; `MediaItem` normalization (unknown fields dropped, caps, bad `type` or missing `id`/`title` dropped with a warning, 100-item cap, `current_index` bounds); artwork allowlist (state key, response key within 10 min, unknown key `404` without a command), validation codes, cache hit, in-flight sharing.
- **Controllers** (`server/test/controllers/device/music/`): every route — auth, device access, internal-service device `404`, disconnected integration `503`, undeclared operation `404`, parameter validation (`limit` caps, `q` required, `mode` values, `index` integer), relayed error `400`, timeout `504`, artwork `content-type;base64` shape.
- **Scene action**: `music.play-media` resolves the device and relays; failure contained and logged; `device.migrate` rewrites the device selector; the modal warning on a cross-integration destination.
- **Frontend**: the Cypress music box spec covers the legacy layout, the now-playing layout with extrapolated progress, play-pause through a writable `playback_state`, the queue and the search panels against a stubbed API.

## 12. Verification (manual e2e, environment with the Docker socket)

Dev-install a player integration built on the template (section 5) → create its device from Discovery → the device page shows the new features with no history switch → the music box shows artwork, title, artist, a moving progress bar; pause: the bar freezes and `playback_state` reads "Paused"; a seek on the bar moves the player; next track: one redraw with the new artwork → the queue panel lists the queue with the current item highlighted, a tap jumps → search "jazz", play a playlist: the player starts and the box follows → a scene "at 7:00 play *Morning* on the kitchen speaker" runs → stop the integration: the box keeps the last known track, the panels report the integration as unavailable, the scene action fails visibly in the scene log → migrate an internal Sonos device to the external one: boxes and scenes follow.

## Deliverable

1. This spec (this PR).
2. The core PR: types, enums and translations; `keep_history` rule; writable `playback_state`; the manifest field and schema; the six commands, their normalization and the artwork proxy; the seven routes; the music box; the `music.play-media` action; tests.
3. The SDK PR (`integration-sdk-js`): `publishNowPlaying`, `artworkKey`, the six handlers, dev-mode checks; the template's player example.
4. The first store integration (Sonos) as the proof of the contract, then Spotify.

## Later leads

- **Multi-room grouping**: a `music`/`group` string feature per player holding the coordinator's `external_id` (empty = alone), written to join or leave, `has_feedback: true` with the topology event as confirmation; the box shows the coordinator's now-playing and each member's own volume; grouping never crosses integrations; no virtual device per group (ephemeral devices would break the dashboards referencing them). Designed, deferred by decision.
- Per-item artwork at larger sizes, and artwork in the queue of the devices-in-room widget.
- Adding to favorites, creating playlists, a global search across every music integration, transferring playback between players (the Spotify Connect gesture).
- A `radio` root folder for catalog-less players (Cast) listing user-configured streams.
- The assistant: an MCP tool to search and play through the same routes.
- An "accept a key, serve the thumbnail" default resize step in the SDK (`sharp` optional dependency) for sources without a small variant.

## Alternatives considered

- **A dedicated in-memory `music` entity outside the device model.** Rejected: it would reimplement what features already give (scene triggers, permissions, `POST /state`, the MCP schemas, the devices-in-room widget, device migration, the `music` box's device reference) to save one `UPDATE` per state change, and `keep_history: false` already keeps the hot path out of DuckDB. Where the instinct was right — the queue and the catalog are not states — section 4 keeps them out of storage entirely.
- **A volatile flag on features (RAM + WebSocket, no DB write).** Not needed once position is published on events only (section 2); kept out so that the last known track survives a restart.
- **Artwork as a base64 state (the camera pattern).** Rejected (section 3): payload on every device read and state message, no thumbnails for lists.
- **Position streamed by the integration, the core throttling it.** Rejected: a throttle is a write per throttle window per player, forever; the sampled-position model costs nothing and is what Matter does.
- **Capabilities answered by the browse root instead of the manifest.** Rejected: the box needs them before any panel opens, and a declaration the core can check lets it refuse undeclared operations without a command.
- **Capabilities declared per device (`params`).** Rejected: every player of one integration shares the same provider; a per-device declaration would be copied on every discovered device for nothing.

## Out of scope

Multi-room grouping and group volume (later leads), lyrics, equalizer and sound settings, TV and video playback (the `television` category keeps its remote-control model), continuous audio streaming through Gladys, and any change to the three internal services.
