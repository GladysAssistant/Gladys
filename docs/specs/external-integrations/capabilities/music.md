> Part of the [external integrations living spec](../README.md) — the layout, the editing rules and the cross-repo map are there.

# Music players: live "now playing" model, proxied artwork and on-demand catalog (design)

Goal: that the dashboard music widget becomes a real player — artwork, title, artist, progress bar, play/pause, next/previous, volume, shuffle, repeat, the queue, and a way to find and start a track or a playlist — the way a Spotify or Sonos app does, for any player an integration exposes.

This file has no historic section identifier (the README's rule: none is allocated to a new file) — it is cited by its path, `capabilities/music.md`.

**Status: core implemented** (types, live contract, artwork proxy, on-demand routes, music box, `music.play-media` action); the SDK surface of section 5 and the first store integration are the next deliverables. Any change to a behavior or contract below edits this file in the same diff.

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
| `title` | string, ≤ 200 characters | no | title of the loaded track, or of the stream / station; empty when nothing is loaded |
| `artist` | string, ≤ 200 characters | no | main artist(s) of the loaded track; empty when unknown |
| `album` | string, ≤ 200 characters | no | album, playlist or show the loaded track belongs to; empty when unknown |
| `artwork` | string, an **image key** (`^[a-z0-9][a-z0-9-]{0,63}$`) | no | key of the current artwork, served by the proxy route of section 3; empty when none |
| `duration` | integer, unit `seconds` | no | length of the current track; `0` for a live stream or when unknown |
| `position` | integer, unit `seconds` | **yes** | position in the current track **at the instant of `last_value_changed`** (section 2); writing a value seeks to it |
| `shuffle` | binary `0`/`1` | yes | shuffle mode of the player |
| `repeat` | enum `MUSIC_REPEAT_MODE`: `OFF: 0`, `ALL: 1`, `ONE: 2` | yes | repeat mode of the player |
| `mute` | binary `0`/`1` | yes | mute state, independent from `volume` (a muted player keeps its volume level) |

Kept as they are: `volume`, `play`, `pause`, `previous`, `next`, `play_notification`. No `stop` type: writing `IDLE` to `playback_state` is the stop command.

**Standards check (rule 3).** Matter's Media Playback cluster models the transport: `CurrentState` (Playing, Paused, NotPlaying, Buffering), `Duration`, `SampledPosition` (a position with the instant it was sampled — exactly the `position` + `last_value_changed` model of section 2), and the Play / Pause / Stop / Seek / Next / Previous commands; the Level Control cluster carries the volume and mute of the Speaker device type. The enum values of `playback_state` diverge from Matter's order (Matter: Playing = 0, Paused = 1) because `PAUSED: 0` / `PLAYING: 1` are already published by integrations and referenced by scenes; the two new values are appended. Matter has no metadata model: `title`, `artist`, `album`, `artwork`, `shuffle` and `repeat` are the capability-first set every player API exposes (Sonos AVTransport metadata, Google Cast media status, AirPlay, Spotify's player state, Home Assistant's `media_player`), none modeled on a single vendor.

**String types are string features, by type.** `title`, `artist`, `album` and `artwork` are string states (`last_value_string`, `saveStringState`, `DEVICE.NEW_STRING_STATE`), and the core recognizes them **by category and type**, the way it recognizes `text`/`text` today: `device.newStateEvent` and `device.setValue` route a `music` feature of one of these four types to `saveStringState` whatever the shape of the event, `POST /state` accepts them as `text`, and the frontend lists them in `DeviceFeatureTypesString` so the MQTT catalog and the devices-in-room path never treat them as numbers. The core caps the three texts at 200 characters (`MAX_MUSIC_TEXT_LENGTH`, truncation); an `artwork` value is either the **empty string** (nothing loaded, the explicit exception to the key shape) or a key matching `MUSIC_ARTWORK_KEY_REGEX` — anything else is refused on the state path (`normalizeStringState`): the state is skipped with a warning log naming the feature, the rest of the `POST /state` batch applies, exactly as an unknown external id is ignored.

**Clearing metadata is explicit.** "Nothing loaded" is published as **empty strings** on the four string types, never by omitting them: an absent key means "unchanged" everywhere (`POST /state`, `publishNowPlaying`), so omitting `title` when the player goes idle would leave the previous track on the dashboard. The core PR therefore treats `text: ""` as a valid string state — today's `device.newStateEvent` only saves a text when `event.text` is truthy, so an empty string is silently dropped; the gate becomes `event.text !== undefined`, and the by-type routing above covers these features regardless. A player that stops with a track still loaded (Sonos keeps showing it) may keep its metadata and publish `playback_state: IDLE` alone; a player that unloads clears them.

**Writable features and feedback.** Every writable music feature is published with **`has_feedback: true`**: the player is the source of truth, the core relays the write (`external-integration.device.set-value`, C.4) and saves nothing, and the new state arrives when the player confirms it (an event for Sonos, the next poll for a cloud API). The widget renders optimistically until the confirmation or the next state (section 6).

**Sources, favorites and playlists are not music types.** A list that only exists on the appliance (inputs, the user's playlists, radio presets) goes through the dynamic `text`/`select` feature with `supported_options` (`device-feature-categories.md`, rule 6) or, when it is large or searchable, through the catalog of section 4.

## 2. The live contract: no history, publish on events, extrapolate

Music is live: there is nothing to chart and a position that moves every second must not become a write per second. Four rules, enforced by the core where it can, by the SDK and the developer documentation elsewhere.

1. **No state history on the whole category.** The core sets `keep_history: false` on every `music` feature at `device.create`, on creation and on update, whatever the integration published or the user chose. This is a deliberate exception to the C.3 rule that `keep_history` is a user setting, the same exception `text` features already have (a string state is never historized): a music feature has no history worth keeping, and offering the switch would promise one. The external "Devices" screen hides the "Keep state history?" switch for the category, like it already does for `text` (`isHistorizableFeature`), and the MQTT device screen does the same. A numeric music state goes through `saveState` without the DuckDB insert; a string state goes through `saveStringState`, which never historizes. What remains per state change is what every feature already costs: the RAM store, one `UPDATE t_device_feature`, one user WebSocket message, one trigger check. A device whose `volume` was historized before this change loses that history at its next save, through the standard purge path of `device.create`.
2. **Position is never streamed.** The integration publishes `position` only on a discrete event: a change of `playback_state`, a seek, a change of track (together with the new `title`), and after a reconnection. Never on a timer. `last_value_changed` of the `position` feature is the instant the position was true (the `UpdatedAt` of Matter's `SampledPosition`). The frontend extrapolates from that timestamp: while `playback_state` is `PLAYING`, `shown = position + (now - last_value_changed)`, clamped to `duration`; frozen while paused or buffering; `0` when idle. `last_value_changed` travels with the state in `GET /device` and in `DEVICE.NEW_STATE`, so a dashboard opened two minutes into a track shows the bar two minutes in, not at the last sample. The few seconds of clock skew between the server and a browser are accepted: a bar that resets on every page load would be worse. The widget applies that age once at reception, then ticks locally from its own clock.
3. **Publish changes only.** A polling integration (a cloud API read every few seconds) publishes a state when its value differs from the last one it published — the `POST /state` rate limit (300 states per minute per integration, C.3) is sized for state changes, not snapshots. The SDK helper `publishNowPlaying` (section 5) does the diff.
4. **A track change is one batch.** The states of one track change (`title`, `artist`, `album`, `artwork`, `duration`, `position`, `playback_state`) are published in one `POST /state` batch, so the widget redraws once; the core emits them as the standard per-feature WebSocket messages, no new message type.

Cost check: a track change is seven states every three to four minutes per player; a play/pause gesture is two. Nothing that needs a volatile storage mode, which is why none is introduced (see "Alternatives considered").

The scene engine gets the `device.new-state` trigger on every one of these features for free: "when the track changes on the kitchen speaker" is the existing device-state trigger on `title`.

## 3. Artwork: integration-served keys, core-proxied bytes

The doctrine of `capabilities/dashboard-widgets.md` section 6 applies as is: the browser never loads a third-party URL (the user's IP would reach the provider on every dashboard render), the core never fetches a URL on an integration's behalf (a request into the LAN from a sandboxed container, SSRF by construction), and **the integration resizes, the core validates and never recompresses**.

- **Keys, not URLs.** The `artwork` state and the `artwork_key` of a `MediaItem` (section 4) carry a key (`^[a-z0-9][a-z0-9-]{0,63}$`), integration-scoped and **immutable for the life of the cache**: when the bytes change, the key changes. The natural key is content-addressed from the source URL (`art-<12 hex of a hash of the URL>`, the SDK's `artworkKey(url)` helper): two tracks of one album share one key, one command, one cache entry.
- **Bytes on demand.** `GET /api/v1/device/:selector/music/artwork/:key` (standard user auth, same device access rules as the other device routes) → the core sends `external-integration.music.get-artwork` `{ message_id, key }` to the device's integration and serves the `content-type;base64,data` shape of the weather and widget image routes. Decoded bytes validated exactly like widget images: PNG, JPEG or WebP by magic numbers, **≤ 300 KB**, pixel size read from the header **≤ 4096 × 4096**, each refusal named by its code and logged with the selector and the key (the `normalizeWidgetImage` rules and codes, reused as is). Cached **1 h** per `(integration, key)` in the same LRU store as widget images (≤ 100 entries per integration). Artwork commands share the **image** pool of widget images, not the music command pool of section 4.3: **at most 4 image commands in flight per integration, the others queued**, concurrent requests for one key share one command. Ack within **15 s**, the documented exception of `widget.get-image`. A cache hit is served whatever the state of the container; a miss while the integration is stopped or disconnected is a `503`.
- **Allowlist.** A key is served only when the core has seen it come from that integration: as the current `artwork` state of one of its devices (read from the `stateManager` at request time), or as an `artwork_key` in a music response of the **last hour** — the same TTL as the image cache, so a queue panel left open or a browse grid scrolled later never `404`s thumbnails the cache would still serve (a per-integration LRU set of 1000 keys, `MUSIC_ARTWORK_KEY_TTL_MS`). Any other key `404`s without a byte sent to the integration — the shape of the key is checked before anything else, as for widget images. The frontend treats an artwork `404` as a stale list: it refetches the panel's list once, then shows the placeholder.
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

All routes under `/api/v1/device/:selector/music/`, standard user authentication, the same device access rules as `POST /api/v1/device_feature/:selector/value`. The device must belong to an external integration (`404 MUSIC_NOT_SUPPORTED` otherwise — an internal service's player). The **relayed** routes (browse, search, play, queue, queue/play, and an artwork cache miss) also require the integration to be connected (`503 EXTERNAL_INTEGRATION_UNAVAILABLE` otherwise) and the operation to be declared in its manifest (section 4.1). `GET .../capabilities` answers from the **stored manifest** and an artwork cache hit is served from the cache, whatever the state of the container: a stopped player keeps its now-playing layout and its last artwork (section 12), only its panels report it unavailable.

| Route | Answer |
|---|---|
| `GET .../capabilities` | `{ "browse", "search", "queue", "append" }` — the manifest declaration, read from the stored manifest, no command, no connection required; one call when the widget mounts |
| `GET .../browse?parent_id=&offset=0&limit=50` | `{ "items": [MediaItem], "total": 123 }` — without `parent_id`, the **root**: the integration's entry points as `folder`s ("Favorites", "My playlists", "Radios", "Library"…); `parent_id` is the `id` of a browsable item; `limit` ≤ 100 |
| `GET .../search?q=&type=&limit=20` | `{ "items": [MediaItem] }` — `q` required (1–200 characters), `type` optional (one of `MUSIC_MEDIA_TYPES`, to filter), `limit` ≤ 50 |
| `POST .../play` body `{ "media": { "id", "type" }, "mode": "replace" }` | `200 { "success": true }` — starts the media. `mode`: `replace` (required for every integration: replaces the current playback), `next` and `append` (enqueue after the current track / at the end; `400 MUSIC_MODE_NOT_SUPPORTED` when the manifest does not declare `append`) |
| `GET .../queue?offset=0&limit=50` | `{ "items": [MediaItem], "current_index": 3, "total": 42 }` — a page of the player's queue; `current_index` and `total` always describe the **full** queue (`current_index` is `null` when nothing plays), `items` the requested page; `limit` ≤ 100. The widget reads `current_index` from its first page and, when that index falls outside it, requests the page starting at `max(0, current_index - 10)` so the playing item is shown with a few items before it — the highlight and the jump target are then defined for a queue of any length |
| `POST .../queue/play` body `{ "index": 7 }` | `200 { "success": true }` — jumps to the item at that index of the full queue |
| `GET .../artwork/:key` | the image (section 3) |

Errors from the integration (`command-result` with `success: false`) surface as `400 REQUEST_TO_THIRD_PARTY_FAILED` with the relayed message in `error`, escaped; a timeout as `504 EXTERNAL_INTEGRATION_COMMAND_TIMEOUT`; a disconnected integration as `503 EXTERNAL_INTEGRATION_UNAVAILABLE`. Query parameters are bounded by the core (`400` outside the bounds, defaults when absent). **Timeout: 10 s** (`MUSIC_COMMAND_TIMEOUT_MS`), a documented exception to the 5 s ack rule: a search is a third-party API call. **At most 4 music commands in flight per integration** (`MAX_MUSIC_COMMANDS_IN_FLIGHT`, the five relayed operations; artwork has its own queued pool, section 3); beyond, the request fails at once with `429` rather than queueing behind the others until the deadline (the AI chat rule). The frontend debounces search input at 300 ms.

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

Constants: `WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MUSIC_BROWSE` / `MUSIC_SEARCH` / `MUSIC_PLAY` / `MUSIC_QUEUE_GET` / `MUSIC_QUEUE_PLAY` / `MUSIC_GET_ARTWORK`, `MUSIC_REPEAT_MODE`, `MUSIC_MEDIA_TYPES`, `MUSIC_PLAY_MODES`, `MUSIC_STRING_FEATURE_TYPES`, `MAX_MUSIC_TEXT_LENGTH` (200) and `MUSIC_ARTWORK_KEY_REGEX` next to `MUSIC_PLAYBACK_STATE` in `server/utils/constants.js` (the frontend shares them); `MUSIC_COMMAND_TIMEOUT_MS`, `MAX_MUSIC_COMMANDS_IN_FLIGHT`, `MAX_MUSIC_ITEMS_PER_RESPONSE` (100), `MAX_MUSIC_MEDIA_ID_LENGTH` (512), `MAX_MUSIC_ITEM_TEXT_LENGTH` (200), `MAX_MUSIC_SEARCH_QUERY_LENGTH` (200), the browse / search page bounds, `MAX_MUSIC_ARTWORK_KEYS_PER_INTEGRATION` (1000), `MUSIC_ARTWORK_KEY_TTL_MS` (1 h) and `MUSIC_MANIFEST_FIELDS` in `server/lib/external-integration/constants.js`. The relay lives in `server/lib/external-integration/externalIntegration.music.js` (with `externalIntegration.normalizeMusic.js`), the proxy capability in `registerProxyService`, the core manager in `server/lib/device/music/` (`gladys.device.music`), the routes in `server/api/controllers/music.controller.js`; the `503` / `504` HTTP errors are `Error503` / `Error504` in `server/utils/httpErrors.js`.

## 5. SDK (`@gladysassistant/integration-sdk`, C.8)

The SDK carries the convenience so that an integration author never reimplements the diffing and the key bookkeeping.

| Surface | Contract |
|---|---|
| `publishNowPlaying(deviceExternalId, nowPlaying)` | `nowPlaying = { playback_state, title, artist, album, artwork_url, duration, position, shuffle, repeat, mute, volume }`. An absent key means **unchanged**; clearing a text is an explicit `''` (section 1), and `artwork_url: null` publishes an empty `artwork`. Diffs against the last snapshot published for that device and sends **one `publishStates` batch** of the changed values (rule 3 of section 2); turns `artwork_url` into its key through `artworkKey` and publishes the key as the `artwork` state; always republishes `position` when `playback_state` or `title` changes or when the reported position deviates from the extrapolated one by more than 3 s (a seek); never republishes an unchanged position otherwise (rule 2). Feature external ids follow the integration's own convention; the helper takes a `featureExternalIds` map or defaults to `` `${deviceExternalId}:${type}` `` |
| `artworkKey(url)` | deterministic key for a source URL (`art-` + 12 hex of a SHA-1 of the URL); records the URL so the default artwork handler can serve it |
| `onMusicGetArtwork(cb)` | `(key) => Promise<string>` — resolve the raw base64 of the image; **default handler** fetches the URL recorded by `artworkKey` and returns its bytes as served (an integration whose source only serves large images overrides it with a resize step); the resolved string goes into `data.image` (15 s) |
| `onMusicBrowse(cb)` | `(device, { parentId, offset, limit }) => Promise<{ items, total }>` |
| `onMusicSearch(cb)` | `(device, { query, type, limit }) => Promise<{ items }>` |
| `onMusicPlay(cb)` | `(device, media, mode) => Promise` |
| `onMusicQueueGet(cb)` | `(device, { offset, limit }) => Promise<{ items, currentIndex, total }>` |
| `onMusicQueuePlay(cb)` | `(device, index) => Promise` |

Handlers follow the automatic-ack rule of C.8 (resolve → `success: true` with the value in `data`, throw → `success: false` with the message, absent → `"not implemented"`). The dev mode of the SDK validates `MediaItem`s and artwork against the bounds of sections 3 and 4 before they leave the integration, and the template shows a player with `publishNowPlaying` on an event and the five handlers.

## 6. Frontend: the music box

One box per player, as today (`box.device`, the device selector — the field `device-migration.md` B.3 already rewrites on a migration; nothing new to register there). The box fetches its device, the music capabilities (`GET .../music/capabilities`: a `404`, or every flag false, means **no catalog panel**, nothing else), and listens to `DEVICE.NEW_STATE` and `DEVICE.NEW_STRING_STATE` for its features, plus `websocket.connected` to refetch after a disconnection (the existing pattern of the box).

- **Now playing**: the artwork (`GET .../music/artwork/:key`, lazy-loaded, a neutral placeholder when the key is empty or the image is refused; on a key change the current image stays until the next one is loaded, which then fades in — a track change never flashes the placeholder), `title`, `artist` and `album` on their own lines (ellipsis, the full text as a tooltip), the progress extrapolated per section 2 as a slider (a thin track over an invisible native range: dragging shows the time under the finger and seeks on release, a click or an arrow key seeks one step, the ticking position glides instead of jumping; disabled when `position` is read-only). With `duration: 0` and a track loaded (a live stream) a "Live" badge takes the place of the bar. The state of `playback_state` sits next to the box title: moving bars while `PLAYING`, the `deviceFeatureValue` label otherwise (`PAUSED` "Paused", `BUFFERING` "Buffering", `IDLE` "Stopped" only while a track is still loaded — with nothing loaded the title already reads "Nothing playing").
- **Transport**: shuffle / previous / play-pause / next / repeat, play-pause being the one solid control (shuffle and repeat show their state in the accent color with a dot, repeat-one with a "1"; while `BUFFERING` the play-pause button spins and pauses). Play-pause writes `playback_state` when the feature is writable, and falls back to the `play` / `pause` one-shot features otherwise (the frozen internal services). Optimistic rendering: the button flips at once and is corrected by the next state. **Confirmation**: `POST /api/v1/device_feature/:selector/value` answers before the player acts, so a refusal or a player gone away never comes back as an HTTP error; a write of `playback_state`, `shuffle`, `repeat`, `mute` or `volume` on a `has_feedback` feature therefore waits for that feature's next state, and without it within 8 s (`CONFIRMATION_TIMEOUT_MS`, the 5 s set-value ack plus a cloud player's next poll) the box reads the device back — the optimistic state never stays on screen — and says the player did not respond. A seek waits for no confirmation (a player republishes its position only when it deviates noticeably, section 5), a volume released where it started sends nothing. `shuffle`, `repeat` and `mute` render only when the feature exists; `volume` is the same slider as the progress, with the mute button (or a plain icon) before it.
- **The queue and the catalog open in a sheet, never inside the card** (`MusicSheet`): the card only carries one quiet icon button per declared operation (a list icon for the queue, a magnifier for the search — a folder when the integration declares `browse` without `search`), labelled by its tooltip and accessible name, at the end of the volume row where a player app puts its queue button (they wrap under the volume, right-aligned, on a card too narrow for both), so opening a list never changes the card's height and no widget under it moves. The sheet is the light panel's shell (`dashboard-flexible-layout-and-widgets.md`): portaled to `<body>` with the `glass-theme` gate, a full-bleed bottom sheet on a phone and a centered dialog from 576px, sized in `dvh` and of a **fixed height** (`92dvh`; `min(40rem, 88dvh)` on a dialog) so a list loading, narrowing or growing never resizes it either; it closes on Escape / backdrop / ×, locks the page scroll, takes the focus and gives it back to the button that opened it. Inside: the player's name, a `hz-segmented` tab pair when both operations exist, the list as the only scrolling part (the search field and the opened folder's header stay), and a **mini player** at the bottom (artwork, title, artist, play-pause, a thin progress line) so the effect of a tap shows while the card is under the backdrop. The search field takes the focus when the catalog tab opens on a fine pointer only (on a touch screen the keyboard would cover the list before the user asked for it).
- **Queue tab** (when `capabilities.queue`): the `MediaItem` list with the current item highlighted and marked with bars over its artwork (the page around `current_index`, section 4.3), the list scrolled to it once per page (a row above it left visible), a tap jumps (`POST .../queue/play`); refetched when the tab opens and when `title` changes.
- **Browse and search tab** (when `capabilities.browse` or `capabilities.search`): a search field (300 ms debounce, a spinner while a search runs, optional `type` filter chips) and the root folders; a tap on a browsable item opens it, a tap on a playable item plays it (`mode: replace`), a secondary gesture enqueues it when `capabilities.append` (`next` / `append`). An opened item that is also playable (an album, a playlist) shows a "Play" button next to its title that plays it whole (`mode: replace`) — without it a container could only be enqueued. The row being started shows a spinner, then a short confirmation (bars for a started item, a check for an enqueued one). A container's subtitle starts with its translated type ("Album · Miles Davis"); an item without artwork shows a placeholder icon of its type (folder, radio, playlist, album, artist).
- **Two independent switches.** *Now playing versus legacy* depends on the device's **features** alone: a player exposing at least one of `title`, `artist`, `album`, `artwork`, `duration` or `position` gets the now-playing layout, whatever its integration — a MQTT or any DIY player included, whose artwork route `404`s (no container to serve keys) and shows the placeholder while title, artist, progress, shuffle and repeat work as ordinary features. *Catalog panels* depend on the capabilities object alone. No music HTTP call decides the layout.
- **Legacy layout**: a device without any of those features (a frozen internal Sonos, a bare MQTT player) gets the same controls in the same style — previous / play-pause / next, the volume slider, the playback state next to the title when the player reports one, the catalog buttons when its integration declares them (the sheet then has no mini player) — and no artwork, title or progress block: the box adds nothing it has no data for, so the update breaks no dashboard. One render path serves both layouts, each block showing only when the player has its features.
- **Touch targets** follow `dashboard-flexible-layout-and-widgets.md` (≥ 44 px on coarse pointers, the music transport already in its audit list). The player's controls are plain buttons, not Tabler `.btn` (the theme's pill grammar would override their active states), so they carry their own coarse-pointer floor: 44 px icon buttons, a 56 px play-pause, 44 px tall slider hit areas whose thumbs stay visible (no hover on a finger). On a narrow card (a 5- or 6-column dashboard) nothing leaves the card: the transport closes its gaps then narrows its icon buttons, and the artwork takes at most a third of the width so the title keeps room.
- **Devices-in-room widget**: `volume` keeps its slider; a writable `playback_state` renders as a play/pause switch, `shuffle` and `mute` as on/off switches, `repeat` as a three-value option control (`MusicRepeatDeviceFeature`), the four string types as read-only text values (`TextDeviceValue`, no "stale value" expiry on the category); `duration` and `position` never render as controls there (the music box is their place). The numeric types join the non-push-button sets of `front/src/utils/consts.js` and the four string types join `DeviceFeatureTypesString`, so none of them ever appears as a button (`isPushButtonFeature` treats every unknown `music` type as a push button); `SUPPORTED_FEATURE_TYPES` gains `playback_state`, `shuffle`, `repeat` and `mute`. Enum controls go through `resolveFeatureOptions`, so a player that declared a subset of `repeat` or of the writable `playback_state` values through `supported_options` only shows that subset.
- **Edit box**: unchanged selection of players with a `play` feature; it also accepts a player exposing a writable `playback_state` without `play`.

## 7. Scenes: the `music.play-media` action

A new core action `ACTIONS.MUSIC.PLAY_MEDIA` (`music.play-media`), next to `play-notification`:

```json
{ "type": "music.play-media", "device": "kitchen-speaker", "media": { "id": "spotify:playlist:…", "type": "playlist", "title": "Morning" }, "mode": "replace" }
```

- **Editor**: a player select (music devices of external integrations whose manifest declares `browse` or `search`), then the browse / search picker of section 6 reused as is (an opened album or playlist is picked whole through its "Choose" button); the chosen `MediaItem` is stored as `{ id, type, title }` — the title is display only and may age, **the `id` is what plays**. `mode` defaults to `replace`, `next` / `append` offered when the integration declares `append`.
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
- [x] Enum types expose the full value set (`playback_state` with four values, `repeat` with three); a player that has no shuffle or repeat at all does not publish the feature, and a player that supports a **subset** declares it through `supported_options` on the feature, as AC and water-heater modes do: `repeat` with `OFF` / `ALL` only for a radio or a provider without single-track repeat, the writable `playback_state` with `PAUSED` / `PLAYING` only for a player that cannot stop (the Spotify Web API has pause, not stop). The widget and the scene editor read the subset through `resolveFeatureOptions`; a write outside the declared subset is refused by the integration like any unsupported value.
- [x] Naming: kebab-case values, English, no protocol name.
- [x] Stress-tested against the neighbors: a TV or a receiver reporting what it plays would use the same `music` metadata types with its `television` controls on the same device; a radio tuner publishes `title` = station and `duration: 0`.
- [x] Inline scope comments on every new constant (`position` is the sampled position at `last_value_changed`; `duration: 0` means unknown or live; `artwork` is an image key, never a URL).
- [x] Translations in every locale: the type labels, `deviceFeatureValue` for `playback_state` (`0`–`3`) and `repeat` (`0`–`2`), the `MUSIC_MEDIA_TYPES` labels, the box's strings (`npm run compare-translations`).
- [x] Units: `seconds` for `duration` and `position` in `DEVICE_FEATURE_UNITS_BY_CATEGORY_AND_TYPE` (the category otherwise has `percent` for `volume`).
- [x] MQTT feature defaults (`front/src/routes/integration/all/mqtt/device-page/utils.js`): `title`, `artist`, `album` and `artwork` as **string** features (the `DeviceFeatureTypesString` path, read-only, a text preview value), `duration` as a read-only `seconds` sensor, `position` as a `seconds` control, `shuffle` and `mute` as 0/1 controls, `repeat` and `playback_state` as enum controls, `keep_history` off on all of them; no history grouping (`categoryGroups.js`: nothing to show, the category has no history).
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
- **`device.newStateEvent` / `device.setValue`**: a `music` feature of a string type is saved through `saveStringState` whatever the event shape; `text: ""` is saved (the truthy gate is gone) and a track → idle batch clears the four string features; the 200-character cap and the artwork key check; a writable `playback_state` relays `0`/`1`/`2` and refuses `3`; `has_feedback` saves nothing; `position` write relays the seek.
- **Manifest** (`validateManifest`): the `music` field with its four booleans, defaults, refused on a non-`device` type, ignored by `structure_changed`; the vendored schema carries it.
- **Proxy service / supervisor**: each of the six commands relayed with the right payload, 10 s (15 s for artwork) timeouts honored, `success: false` → `ExternalIntegrationUnavailableError`, in-flight cap, undeclared operation refused without a command; `MediaItem` normalization (unknown fields dropped, caps, bad `type` or missing `id`/`title` dropped with a warning, 100-item cap, `current_index` bounds); artwork allowlist (state key, response key within 1 h, expired key and unknown key `404` without a command), validation codes, cache hit served while the integration is stopped, cache miss `503` while stopped, the image pool shared with widget images.
- **Controllers** (`server/test/controllers/device/music/`): every route — auth, device access, internal-service device `404`, `capabilities` answered from the stored manifest while the integration is stopped, disconnected integration `503` on the relayed routes, undeclared operation `404`, queue page semantics (`current_index` and `total` on the full queue, `offset` honored), parameter validation (`limit` caps, `q` required, `mode` values, `index` integer), relayed error `400`, timeout `504`, artwork `content-type;base64` shape.
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
