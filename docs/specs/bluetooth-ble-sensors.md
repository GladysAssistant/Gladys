# BLE advertisement streaming (Bluetooth sensors)

> **Living specification — source of truth.** This document specifies how the Gladys core owns the Bluetooth LE radio and exposes a raw advertisement stream to integrations — internal services first, external integrations second — so that BLE sensors (Xiaomi/Qingping thermometers, plant sensors, iBeacons, scales…) can be decoded outside the core. **Rule: any PR that changes a behavior or contract described here modifies this file in the same diff** — spec first, code second.
>
> The external-integration side of this design applies the capture-and-relay principle established by `docs/specs/external-integrations.md` §B.16 (mediated network discovery): **the core captures (radio position), the integration interprets (protocol knowledge)**. When section C ships, the manifest field, host API endpoints and WS message types it defines must also be reflected in `external-integrations.md` in the same diff, which remains the source of truth for the external-integration contract surface.

## Context

Community RFC (topic 10555): millions of cheap BLE sensors broadcast their measurements inside advertisement frames, and the Theengs decoder alone knows how to decode hundreds of models. Gladys cannot support them natively today, and the author of Theengs/OpenMQTTGateway laid out on the forum what a robust core-side Bluetooth API should provide for an external integration to do the decoding. This spec is the answer to that proposal.

**What exists today** (`server/services/bluetooth/`, built on `@abandonware/noble`):

- **Scan model built for pairing, not for sensors.** `bluetooth.scan.js` runs bounded scan bursts (`TIMERS.SCAN` = 5 s), always active, `allowDuplicates: true` at the HCI level — but the `discover` handler drops every re-advertisement of an already-seen peripheral (`!this.discoveredDevices[uuid]`). Correct for a pairing screen; fatal for sensors, where **every advertisement carries a fresh measurement**.
- **Hand-rolled arbitration.** Concurrent scan demands (pairing scan from the UI, periodic presence scan, single-peripheral lookup) are coordinated through a manually incremented `scanCounter`, a shared `scanTimer` and a `peripheralLookup` flag on the manager. It works, but every new consumer of the radio makes it more fragile.
- **Advertisement data is discarded.** `transformToDevice` keeps the local name and connectable flag; RSSI, `manufacturerData`, `serviceData` and service UUIDs never leave the noble peripheral object.
- **GATT machinery exists** (`readDevice`, `writeDevice`, `subscribeDevice`, `applyOnPeripheral`) and stays as-is: this spec does not touch the connected path, it adds the broadcast path.
- **Stack constraints.** `@abandonware/noble` talks raw HCI: active scan only (no public passive-scan control), one adapter per process (`NOBLE_HCI_DEVICE_ID`), and the project is in maintenance mode. These constraints shape the v1/v2 split below.

**The alternative that already works**: Theengs Gateway (or OpenMQTTGateway on an ESP32) decoding frames and publishing to the Gladys MQTT service. The value of this design is not to make BLE sensors *possible* but to make them *native* — no broker, no side machine, zero technical fiddling. The success criterion is simplicity of use, not API completeness.

Scoping decisions:

- **The core owns the radio; it never decodes.** No sensor protocol knowledge ever enters the core — not even "just this one popular thermometer". Decoders live in integrations (internal or external), which receive raw frames and publish device states through the existing paths.
- **Scan leases replace the `scanCounter`.** A single arbiter decides when the radio scans, driven by explicit, expiring leases (section A.1). This is a net win even before any sensor integration exists: pairing and presence scans become two ordinary lease holders.
- **One frame format for every consumer** (section A.2): internal services and external integrations receive the same JSON frame, so a decoder can move from internal to external (or the reverse) without a rewrite.
- **Filters and throttling are core-side** (section A.3): a dense urban environment produces hundreds of frames per second; consumers declare what they want and how fast, the core drops the rest before it crosses a process boundary.
- **v1 is active scan, single adapter, observe-only.** Passive scan and multi-adapter multiplexing need a stack change and are phase 2 (section D); GATT over the streaming API is out of scope entirely.
- **Listening is an explicit user choice** (section C.3): a continuous BLE scan reveals the presence and habits of people (phones, watches, beacons). It never starts implicitly.

### Traceability to the forum proposal (topic 10555)

| Forum point | Where it lands |
|---|---|
| 1. Core-arbitrated scan with lease renewal, streamed frames | A.1 (leases), B (internal stream), C.2 (external stream) |
| 2. Minimal frame data: MAC, RSSI, name, manufacturer data, service data + UUID, timestamp, raw payload | A.2 |
| 3. Passive **and** active scan modes | Active in v1; passive deferred to phase 2 with the stack migration (D.1) |
| 4. Core-side filtering (MAC prefix, manufacturer id, service UUID) + throttling | A.3 |
| 5. Central adapter management, conflict arbitration | A.4 — reduced scope in v1 (single adapter, health reporting); multiplexing deferred (D.2) |
| 6. Distinct user consent for BLE listening | C.3 |
| 7. v1 out of scope: GATT connect/write | D.3 |

## A. Core: scan arbiter and advertisement stream

Everything in this section lives in the existing internal service `server/services/bluetooth/` (one function per file, as today). No new top-level lib: the Bluetooth service stays the single owner of the radio, and other code reaches it via `gladys.service.getService('bluetooth')` — the established inter-service pattern (nuki and tasmota consume the `mqtt` service, zigbee2mqtt consumes `usb`).

### A.1 Scan leases

A **lease** is the only way to make the radio scan. The arbiter replaces the `scanCounter`/`scanTimer`/`peripheralLookup` trio.

```
lease = {
  id,                      // uuid, generated by the arbiter
  owner,                   // free-form label for logs/UI ("pairing", "presence", "ext-theengs")
  kind,                    // 'burst' | 'stream'
  filters,                 // section A.3 (streams only; bursts receive everything)
  expires_at,              // now + ttl
}
```

- **`burst`**: the existing bounded scans, unchanged in behavior. `scan()` (pairing screen), `scanPresence()` and the single-peripheral lookup each acquire a burst lease for their current timeout (`TIMERS.SCAN`, `TIMERS.PRESENCE` cycle) and release it when done. Their external behavior — promises resolving with discovered peripherals, WebSocket `BLUETOOTH.DISCOVER` messages to the frontend, the presence `NEW_STATE` events — does not change.
- **`stream`**: continuous listening for sensor consumers. A stream lease has a **TTL of 60 s** and must be renewed before expiry (renewal = a cheap `renewLease(id)` call; the SDK/internal helper renews at half-TTL). A consumer that crashes or forgets stops costing radio time within a minute — this is the property that makes "continuous" scanning safe to expose.
- **Radio rule**: the adapter scans **iff at least one unexpired lease exists**. Scan parameters are fixed: active scan, `allowDuplicates: true`, no HCI-level UUID filter (`startScanning([], true)` — filtering is done in the arbiter so that concurrent leases with different filters can coexist). When the last lease expires or is released, `stopScanning()` is called.
- **Dispatch**: every `discover` event is fanned out to all live leases. Burst leases keep today's first-seen-only dedup path; stream leases receive every frame that passes their filters and throttle (A.3).
- **Failure semantics**: if the adapter goes away (`stateChange` ≠ `poweredOn`), all leases are notified (`onError` callback / WS event for external consumers) but **not destroyed** — when the adapter comes back, scanning resumes for the leases still alive. Acquiring a lease while `!this.ready` throws, as `scan()` does today.

### A.2 The advertisement frame

One JSON shape for every consumer, built in a single place (`bluetooth.transformToFrame.js`) from the noble peripheral:

```json
{
  "address": "a4:c1:38:0a:1b:2c",
  "address_type": "public",
  "rssi": -71,
  "name": "LYWSD03MMC",
  "connectable": false,
  "manufacturer_data": "TLYuAQ==",
  "service_data": [{ "uuid": "181a", "data": "QKQaFgsD6QzAqg==" }],
  "service_uuids": ["181a"],
  "timestamp": 1755430000000
}
```

- `address` is the peripheral MAC (lowercase, colon-separated), `address_type` is `public` or `random`. Consumers must expect **random and rotating addresses** (phones randomize; many sensors do not) — that is their problem to solve, not the core's.
- Binary fields (`manufacturer_data`, each `service_data[].data`) are **base64**; absent sections are omitted, not `null`.
- `timestamp` is stamped by the core at reception (ms epoch).
- **No raw EIR payload in v1**: noble parses the advertisement and does not reliably expose the undecoded packet. The field is *reserved* (`raw`, base64) and will be added by the phase 2 stack migration (D.1) — additive, so the contract does not break. Everything the forum proposal lists as needed for Theengs decoding (manufacturer data, service data with UUIDs, name, MAC, RSSI) is present from v1.
- An `adapter` field (e.g. `"hci0"`) is also reserved for phase 2 multi-adapter support (D.2); in v1 it is omitted.

### A.3 Filters and throttling

Filters are evaluated **in the arbiter**, per stream lease, before any frame crosses a process (or container) boundary.

```json
"filters": {
  "address_prefixes": ["a4:c1:38"],
  "manufacturer_ids": [76, 1177],
  "service_uuids": ["181a", "fe95"]
}
```

- Semantics: a frame matches if it matches **any** entry of **any** provided list (pure OR — a decoder integration typically knows "my sensors are these OUIs or these service UUIDs"). An empty or absent `filters` object means **everything** — legal, because Theengs-style decoders genuinely want the full stream, but it makes the throttle below do the real work.
- `manufacturer_ids` are the Bluetooth SIG company identifiers (the first two little-endian bytes of `manufacturer_data`); `service_uuids` match against both `service_uuids` and `service_data[].uuid`, normalized to lowercase 16/32/128-bit hex without dashes.
- Limits: ≤ 32 entries per list — enough for any real decoder, small enough to evaluate per frame without indexing cleverness.
- **Throttle, per lease**: `max_frames_per_second` (default **50**, hard cap **100**) enforced with a token bucket, plus an optional **per-address dampener** `min_interval_per_address_ms` (default **0** = off): when set, at most one frame per address per interval is forwarded, keeping the *latest* frame. The dampener is what a sensor decoder actually wants (one measurement per device per few seconds); the global bucket is the safety net for the empty-filter case. Dropped-frame counts are kept per lease and exposed in the lease status (never silently pretend the stream is complete).

### A.4 Adapter management (v1 scope)

The forum proposal's point 5 (inventory, health, multiplexing of every hci adapter, arbitration with Matter/Thread) is deliberately reduced in v1 to what the current stack can honor:

- **One adapter**, the one noble binds (`NOBLE_HCI_DEVICE_ID` env var, default `hci0`). Which adapter is in use, its power state and whether scanning is on are part of `getStatus()` and the existing frontend status broadcast.
- **Health**: the arbiter already reacts to `stateChange` (A.1). Adapter disappearance/return is surfaced to lease holders and to the frontend; no automatic failover.
- **Coexistence**: the Matter service currently commissions with `ble: false` (`matter.pairDevice.js`), so there is no HCI contention today. The lease model is the future arbitration point if that changes — any core code wanting the radio must hold a lease, including a future Matter BLE commissioning window (which would be a `burst`).
- Full multiplexing is phase 2 (D.2).

## B. Internal consumer API (phase 1)

New methods on the Bluetooth service's public surface (`server/services/bluetooth/index.js`), consumed by other internal services via `getService('bluetooth')`:

```js
const bluetooth = this.gladys.service.getService('bluetooth');

const lease = await bluetooth.subscribeAdvertisements(
  {
    owner: 'my-sensor-service',
    filters: { service_uuids: ['181a', 'fe95'] },
    max_frames_per_second: 20,
    min_interval_per_address_ms: 2000,
  },
  (frame) => { /* one A.2 frame */ },
);

// lease.renew() — called automatically every 30 s by the returned handle
// await lease.stop() — release explicitly
// lease.getStatus() — { active, frames_forwarded, frames_dropped, adapter_ready }
```

- `subscribeAdvertisements` acquires a stream lease and returns a handle that **auto-renews** (internal consumers should not be able to leak the radio by forgetting a timer; the handle stops renewing when `stop()` is called or the service stops).
- Errors (adapter gone, Bluetooth service stopped) are delivered through an optional `onError` callback on the options object; frames resume automatically on recovery (A.1 failure semantics).
- This is the API a future internal "BLE sensors" integration — or an internal Theengs-decoder service — builds on. Nothing else about internal integrations changes: decoded measurements go through the standard discovery + `EVENTS.DEVICE.NEW_STATE` paths.

## C. External integration contract (phase 2 of this spec)

This section extends the external-integration framework (`docs/specs/external-integrations.md`) exactly like B.16 did for network discovery. It ships **after** section A/B exist in the core. When it ships, `external-integrations.md` (manifest C.1, host API C.3, WS protocol C.4, install screen B.8/B.14) must be updated in the same diff.

### C.1 Manifest declaration

Same philosophy as `containers` / `network_discovery`: **requesting = showing the user**. Optional `bluetooth` field:

```json
"bluetooth": {
  "mode": "observer",
  "filters": {
    "service_uuids": ["181a", "fe95", "fdcd"]
  }
}
```

- `mode: "observer"` is the only v1 value (frozen name so a future `"gatt"` mode is additive). It grants exactly one thing: the ability to open advertisement stream leases within the declared filters.
- The declared `filters` are a **ceiling**, not the runtime subscription: at lease time the integration may subscribe to any subset, and an empty declared `filters` (legal — the Theengs case) means the ceiling is "everything", which the install screen must say in plain words.
- A manifest with a `bluetooth` field is refused by a Gladys that predates this feature via the existing `gladys_version` compatibility gate — the additive-field pattern established in B.16.

### C.2 Host API and WS stream

- `POST /api/integration/v1/bluetooth/lease` `{ filters?, max_frames_per_second?, min_interval_per_address_ms? }` → `201` `{ lease_id, ttl_seconds: 60, adapter_ready }`. `403` if the manifest declares no `bluetooth` field, if the requested filters exceed the declared ceiling, or if the user has not granted the permission (C.3). **One live lease per integration** (`409` otherwise): an integration multiplexes internally; the core does not manage N leases per tenant.
- `POST /api/integration/v1/bluetooth/lease/:lease_id/renew` → `204` (resets the 60 s TTL). `DELETE .../lease/:lease_id` → `204`.
- **Frames flow core → integration over the integration WebSocket** (the existing return channel), as `bluetooth-advertisement` messages carrying **batches**: the core flushes a lease's buffer every **500 ms or 100 frames**, whichever comes first — `{ "lease_id", "frames": [ ...A.2 frames ], "dropped": 0 }`. Batching keeps WS overhead sane at urban frame rates; `dropped` carries the throttle counter delta so the integration knows the stream is bounded, never lied to.
- Integration WS disconnected → frames are dropped (not queued); the lease keeps running until its TTL expires, so a brief SDK reconnect does not cold-restart the radio. Integration stopped or uninstalled → its lease is destroyed with it.
- SDK surface (`@gladysassistant/integration-sdk`): `subscribeBluetooth({ filters, ... }, onFrames)` wrapping lease acquisition, auto-renewal and reconnection — mirroring the internal handle of section B.

### C.3 Consent: a distinct, revocable permission

Continuous BLE listening reveals **who is home and when** (phones, wearables, beacons) — more sensitive than the capabilities the install screen already discloses. Two rules:

- **Install screen**: the `bluetooth` request is listed like `network_discovery` requests, with explicit wording ("this integration will be able to listen continuously to nearby Bluetooth advertisements — this can reveal the presence of people and their devices"), and the declared filter ceiling (or "all nearby Bluetooth devices" when the ceiling is empty).
- **A dedicated toggle, off by default is wrong here — the user just approved it at install** — so: granted at install like the other requests, but **revocable at any time** from the integration's supervision block (same pattern as the Hardware toggles of B.2). Revoking destroys the live lease immediately (`403` on the next renew) and notifies the integration over WS so it can degrade gracefully. The grant is persisted alongside the other per-service grants.

The internal presence scanner keeps its own existing enable/disable setting; this consent governs external integrations only.

## D. Deferred and out of scope

### D.1 Passive scan — phase 2, tied to a stack migration

Some sensors only reveal their data to a passive scan, and continuous *active* scanning costs battery on nearby devices and airtime. But `@abandonware/noble` exposes no passive-scan control, and patching it at the HCI layer means maintaining a fork. Decision: **v1 ships active-only**, and passive scan is the flagship reason to evaluate migrating the service to an actively maintained stack (`@stoprocent/noble`, or BlueZ/D-Bus via `node-ble`). The migration is its own project (it touches pairing, presence and GATT paths); this spec constrains it only through the frame contract (A.2), which already reserves the fields (`raw`, `adapter`) the new stack will fill. When passive lands, leases gain a `scan_mode: 'passive' | 'active'` hint and the arbiter resolves concurrent modes by escalating to active (a superset of passive for every consumer that declared passive).

### D.2 Multi-adapter multiplexing — phase 2

Noble is one-adapter-per-process; real multiplexing (several dongles, per-adapter leases, RSSI triangulation use cases) is not honestly implementable today and is **not** faked. v1 states which adapter it uses (A.4); the frame format reserves `adapter`; the lease API takes no adapter parameter yet, so adding one later is additive.

### D.3 Out of scope entirely (v1 and v2)

- **GATT over the external API** — no connect, read, write or subscribe for external integrations. Connection windows interrupt scanning, multiply failure modes, and the read-only advertisement path covers the vast majority of BLE sensors. Sensors that require a GATT connection to deliver data (e.g. some stock-firmware Xiaomi thermometers) are simply not covered — documented honestly, as B.2 does for bridge limitations. The *internal* GATT machinery is untouched and remains available to internal services.
- **Decoding in the core** — never, per the first scoping decision.
- **BLE advertising/emission by the core** — the observer never transmits; there is no BLE analog of B.16's active broadcast in this design.
- **Presence detection changes** — the existing Bluetooth presence scanner is refit onto leases (A.1) with zero behavior change; improving it is a separate topic.

## E. Verification

- **Arbiter unit tests** (the existing bluetooth suite pattern, `server/test/services/bluetooth/`): concurrent burst + stream leases (radio stays on until the last one dies), TTL expiry stops the radio, renewal keeps it alive, adapter loss/recovery preserves leases, filter matching (prefix, manufacturer id, 16/128-bit UUID normalization), token bucket and per-address dampener (latest-frame-wins), dropped-frame accounting.
- **No regression on today's behavior**: the pairing scan, presence scan and single-peripheral lookup tests must pass unchanged after the lease refit — the refit is proven by the absence of test changes, not by new tests.
- **External contract e2e** (when C ships, in the external-integrations test journey): manifest with/without `bluetooth` field (403 path), filter ceiling enforcement, consent revocation kills the stream, WS batch delivery with a mocked noble feed.
