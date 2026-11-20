# Zigbee2mqtt pairing window

> **Living specification — source of truth.** This document specifies how a user pairs Zigbee devices
> from Gladys: permit joining with its countdown (B), the pairing registry the server keeps from the
> events of Zigbee2mqtt (C), the `zigbee2mqtt.permit-join` and `zigbee2mqtt.pairing` WebSocket
> messages and the routes that go with them (B, C), and the pairing window of the setup wizard and the
> dashboard (D). **Rule: any PR that changes one of these behaviors or contracts modifies this file in
> the same diff.**
>
> Status: **implemented** (lot 2 of the Zigbee2mqtt revamp, PR to come). The setup wizard and the dashboard themselves
> are specified in [zigbee2mqtt-installation.md](./zigbee2mqtt-installation.md) (M, N).

## A. Context

Findings E1 and E2 of the
[Zigbee2mqtt audit](https://community.gladysassistant.com/t/zigbee2mqtt-un-audit-pour-devenir-plus-simple-que-home-assistant/11498):
once joining was allowed, Gladys said nothing until the device showed up in the Discover tab — no
countdown, no sign that the device joined, that its interview ran or failed. A device Zigbee2mqtt does
not support joined and stayed invisible. Users left the Discover tab, opened the Zigbee2mqtt interface
or gave up.

Now: Gladys follows `bridge/event` and tells, device by device, "joined → interview → ready / failed",
with a countdown of the joining window; a device that is ready becomes a card to add to Gladys (photo,
suggested name, room) without leaving the wizard or the dashboard. No device is created without the
user's click.

What Zigbee2mqtt 2 publishes (checked on 2026-11-20 against its documentation, `lib/extension/bridge.ts`
and zigbee-herdsman `controller.ts`):

| Topic                | Retained | Payload used                                                                                                                                                                                  |
| -------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bridge/info`        | yes      | `permit_join` (boolean), `permit_join_end` (epoch in **milliseconds** of the Zigbee2mqtt host, absent when joining is closed); published again when joining opens or closes                  |
| `bridge/event`       | no       | `{ type, data }`: `device_joined` `{ friendly_name, ieee_address }`; `device_interview` `{ friendly_name, ieee_address, status: started / successful / failed }`, with `supported` and `definition { model, vendor, description, … }` on `successful`; `device_leave` `{ ieee_address, friendly_name }`; `device_announce` (ignored, see C.2) |
| `bridge/devices`     | yes      | the device list, published again at each step of an interview                                                                                                                                 |
| `bridge/response/permit_join` | no | `{ data: { time }, status }`                                                                                                                                                         |

## B. Permit joining

### B.1 State kept by the server

- `z2mPermitJoin` (boolean) and `z2mPermitJoinEnd` (epoch ms, or `null`), from `bridge/info`
  (`permit_join`, `permit_join_end`) and `bridge/response/permit_join` with `status: ok` (allowed when
  `data.time > 0`, its end estimated as now + `time` until the `bridge/info` that follows tells the
  exact one; a refused request changes nothing). Nothing else changes them: the branches of the legacy
  API of Zigbee2mqtt 1 (`bridge/config`, `bridge/config/permit_join`) are removed.
- Forgotten (`false`, `null`) when Gladys disconnects from the broker (Stop, `disconnect`, `reset`),
  and when `bridge/state` announces another run (a restarted Zigbee2mqtt starts with joining closed;
  its `bridge/info` tells otherwise if needed).

### B.2 `zigbee2mqtt.permit-join` and `GET /permit_join`

Both carry the same object:

```json
{ "allowed": true, "remainingSeconds": 241 }
```

- `remainingSeconds`: `z2mPermitJoinEnd - Date.now()` rounded to the second, bounded to 0–254; `null`
  when `allowed` is false or the end is unknown (Zigbee2mqtt 1, `permit_join_end` absent). The browser
  computes the end with its own clock from the moment it receives the value: the clocks of the browser
  and of the server never meet.
- Sent only when `allowed` or `z2mPermitJoinEnd` changes (not on every `bridge/info`).
- Formerly a bare boolean: every consumer of the front (wizard, dashboard, Discover tab) reads the object.

### B.3 `POST /permit_join`

Unchanged (installation spec, E.1): `{ value: true }` asks for 254 s, `{ value: false }` closes,
400 `ZIGBEE2MQTT_NOT_ANSWERING` when Zigbee2mqtt does not answer. Asking again while joining is open
starts a new window of 254 s ("Extend", D).

## C. Pairing registry

### C.1 Entry

The server keeps `pairingDevices`, by IEEE address, the devices seen joining since joining last
opened:

| Field          | Content                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ieee_address` | key                                                                                                                                           |
| `friendly_name`| last name told by Zigbee2mqtt (event or `bridge/devices`)                                                                                     |
| `status`       | `joined`, `interviewing`, `ready`, `unsupported`, `failed`                                                                                    |
| `model`, `vendor`, `description` | from `definition` once the interview succeeded, else `null`                                                                  |
| `device`       | `ready` only: the Gladys device as the Discover tab gets it (`getDiscoveredDevices`, with `id` when it is already in Gladys), else `null` |
| `updated_at`   | ISO date of the last change                                                                                                                   |

### C.2 Transitions

| Event                                         | No entry                | `joined` / `interviewing` | `ready` / `unsupported` / `failed` |
| --------------------------------------------- | ----------------------- | ------------------------- | ---------------------------------- |
| `device_joined`                               | create `joined`         | `joined`                  | `joined` (joined again)            |
| `device_interview` `started`                  | create `interviewing`   | `interviewing`            | `interviewing`                     |
| `device_interview` `successful`, `supported`  | create `ready`          | `ready`                   | `ready`                            |
| `device_interview` `successful`, not supported or no `definition` | create `unsupported` | `unsupported` | `unsupported`             |
| `device_interview` `failed`                   | create `failed`         | `failed`                  | `failed` (a late failure of an earlier interview after `ready` is applied: Zigbee2mqtt says the last word) |
| `device_leave`                                | —                       | removed                   | removed                            |
| `bridge/devices`                              | —                       | name updated              | name updated; `device` computed again (`ready`) |
| joining opens (`allowed` false → true)        | registry emptied        | emptied                   | emptied                            |
| Stop, `disconnect`, `reset`                   | emptied                 | emptied                   | emptied                            |

- `device_announce` is ignored: every known device announces itself when it powers up.
- Closing joining keeps the registry: an interview often ends after the window, and the user may add
  the ready devices later. A new run of Zigbee2mqtt keeps it too.
- An event arriving while joining is closed (a device joining through the Zigbee2mqtt interface) is
  applied all the same.
- `device` is read when the entry is sent, not stored: the `successful` event and the `bridge/devices`
  that follows come in any order, and a device added to Gladys meanwhile gets its `id`. Until the
  device is in `discoveredDevices`, a `ready` entry has `device: null` (the window shows "Getting the
  device ready…").

### C.3 `zigbee2mqtt.pairing` and `GET /pairing`

- `zigbee2mqtt.pairing`: the whole registry, `[entry]` ordered by first appearance, sent each time an
  entry changes (and after `bridge/devices` while the registry holds a `ready` entry). The list is
  small (the devices of one session).
- `GET /api/v1/service/zigbee2mqtt/pairing` (authenticated): the same list, for a page opened or
  reloaded during pairing.

## D. Pairing window (front)

### D.1 Where (D57)

One component (`setup-page/pairing/PairingWindow.jsx`, desktop and phone), the only way to pair
from Gladys: shown at step ④ of the setup wizard, and on a screen of its own
(`setup-page/pairing/PairingScreen.jsx`) opened by **Pair a device** on the dashboard (the 4-minute
notice removed) and on the Discover tab (D61: the switch "Permit joining" replaced, its texts
removed), closed back to where it was opened. The window asks Zigbee2mqtt to permit joining as it
opens (when Zigbee2mqtt answers): the user came to pair. The Discover tab keeps what the window does
not cover: the devices of the network not in Gladys yet (a former pairing, the Zigbee2mqtt
interface, an installation taken over) and those to update; its empty list points to "Pair a
device".

### D.2 Content

- **Header**: "Joining permitted 3:52" counting down from `remainingSeconds`, **Extend** (`POST
  /permit_join` `{ value: true }`) and **Stop** (`{ value: false }`); closed: "Joining closed" and
  **Permit joining** again. A request waits for Zigbee2mqtt to tell its outcome through
  `zigbee2mqtt.permit-join`, from the click (its answer may come before the one of the request): not
  told within 10 s, refused (500), or joining told closed while asked to open, it failed (an error
  under the header, the button back). A stop not confirmed while joining is already closed failed in
  nothing. In the demo, the answer of the request is enough. Without a known end, no countdown.
- **Tips** (approach, pairing mode, add it here) while the registry is empty.
- **One row per entry**, a timeline "Joined → Interview → Ready":
  - `joined`, `interviewing`: the step running, the friendly name (an IEEE address until the device
    has a name);
  - `ready`, `device` known, not in Gladys: a card — photo (D.3), suggested name (D.4, editable),
    room (optional, as in the Discover tab), **Add** (the request of the Discover tab:
    `POST /api/v1/device` with the feature names of the dictionary and the states stripped). Added: "In
    Gladys" with a link to the device;
  - `ready`, already in Gladys (`device.id`): "Already in Gladys" with a link (a device paired again);
  - `unsupported` (D60): "Not supported by Zigbee2MQTT" with the model when known and an explanation
    (Gladys cannot create its features); no Add;
  - `failed` (D59): "Interview failed" and the advice: "Bring the device closer to the dongle or to a
    mains-powered device, then put it in pairing mode again"; the row starts over if it joins again.
- A device whose photo, name or row once ready is shown is never created without the click on **Add**
  (D6). A name typed by the user is kept when the registry comes again.
- **Finish** (wizard) / **Close** (dashboard). Closing the window does not close joining (it closes by
  itself); the registry stays on the server.
- On a phone, the ready card is the sheet of the Discover tab (`MobileDeviceItem`, `primaryAction`
  "Add to Gladys"), opened from the row.

### D.3 Photo (D58)

`https://www.zigbee2mqtt.io/images/devices/<model>.png`, the model with `:`, `/` and spaces replaced by
`-` (as the Zigbee2mqtt interface does), loaded by the browser; the icon of the device category
(`getDeviceIcon`) when the image fails to load or the model is unknown. The model of the device is
thus sent to zigbee2mqtt.io by the browser, as the Zigbee2mqtt interface does.

### D.4 Suggested name

"<category> <vendor>" in the language of the user ("Lumière IKEA"), the category being the
`shortCategoryName` of the first feature that is not a secondary one (battery, battery low, signal
strength, device temperature); "<vendor> <model>" when there is none. Suffixed " 2", " 3"… when the
name is taken by a Zigbee2mqtt device of Gladys or another card of the window. Nothing is renamed in
Zigbee2mqtt.

### D.5 Asynchronous state

- The window reads `GET /permit_join` and `GET /pairing` when it opens, and listens to both messages;
  a message is more recent than a request still running (request numbered, answer dropped if a message
  came meanwhile).
- The countdown is a timer of the component, stopped on unmount and when joining closes; it shows 0:00
  until Zigbee2mqtt tells joining closed.
- An Add in flight keeps its card busy; its answer is applied only if the component is still mounted;
  a failure stays visible on the card.
- Zigbee2mqtt no longer online (status): the header says that Zigbee2mqtt does not answer, Extend /
  Allow are disabled; the rows stay.

## E. Tests

- Server, at mirrored paths (`getPermitJoin`, `updatePermitJoin`, `pairingDevices`,
  `handleMqttMessage`, `stop`, the controller): B.1 sources and forgetting, B.2 bounds and "only on
  change" (fake timers), each transition of C.2, `GET /pairing`.
- Cypress (`setup/Zigbee2MqttPairing.cy.js`, `…PairingMobile.cy.js`, step ④ in `…Wizard*.cy.js`,
  Pair in `…Dashboard.cy.js`): countdown, Extend, Stop, the three failures of a request, a slow
  answer after a message, Zigbee2mqtt not answering; a device going joined → interviewing → ready →
  added (suggested name suffixed, room, request body), a typed name kept, an Add that fails, already
  in Gladys, unsupported, failed, left, the icon when the photo does not load, a message more recent
  than the list read at opening, the list not readable; the sheet of a ready device on a phone.

## F. Out of scope

- Re-interview button (D59), generic features or reporting for unsupported devices (2.3, S2, S5),
  joining through a given router (2.5).
