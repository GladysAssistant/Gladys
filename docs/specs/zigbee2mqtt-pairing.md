# Zigbee2mqtt pairing window

> **Living specification — source of truth.** This document specifies how a user pairs Zigbee devices
> from Gladys: permit joining with its countdown (B), the pairing registry the server keeps from the
> events of Zigbee2mqtt (C), the `zigbee2mqtt.permit-join` and `zigbee2mqtt.pairing` WebSocket
> messages and the routes that go with them (B, C), and the pairing window of the setup wizard and the
> dashboard (D). **Rule: any PR that changes one of these behaviors or contracts modifies this file in
> the same diff.**
>
> Status: B to D **implemented** (lot 2 of the Zigbee2mqtt revamp, #3427); E (devices Zigbee2mqtt does not
> support, step 2.3) **implemented** (PR to come). The setup wizard and the dashboard themselves are specified in
> [zigbee2mqtt-installation.md](./zigbee2mqtt-installation.md) (M, N).

## A. Context

Findings E1 and E2 of the
[Zigbee2mqtt audit](https://community.gladysassistant.com/t/zigbee2mqtt-un-audit-pour-devenir-plus-simple-que-home-assistant/11498):
once joining was allowed, Gladys said nothing until the device showed up in the Discover tab — no
countdown, no sign that the device joined, that its interview ran or failed. A device Zigbee2mqtt does
not support joined and stayed invisible. Users left the Discover tab, opened the Zigbee2mqtt interface
or gave up.

Now: Gladys follows `bridge/event` and tells, device by device, "joined → identification → ready / failed",
with a countdown of the joining window; a device that is ready becomes a card to add to Gladys (photo,
suggested name, room) without leaving the wizard or the dashboard. No device is created without the
user's click.

Finding E3: a device Zigbee2mqtt does not support (`supported: false`) was dropped by Gladys without a
word, and "Suggest this device" (a GitHub issue) never reached it. Now (E): it is shown, added with the
generic features Zigbee2mqtt deduces from its clusters after a confirmation, and the user is pointed to
whoever can support it — Zigbee2mqtt for a model it does not know, the Gladys forum for a model Gladys
cannot convert.

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
  (`permit_join`, `permit_join_end`) and `bridge/response/permit_join` with `status: ok` (open when
  `data.time > 0`, or, without `time`, when `data.value` is true — Zigbee2mqtt 1 asked by another
  client; closed when `time` is 0 or `value` false; a refused request, or an answer telling neither,
  changes nothing). The end of a response is an estimate, now + `time`: Zigbee2mqtt 2 publishes
  `bridge/info` before or after its answer (before, on the test bench), and the exact end it tells is
  kept over an estimate within 5 s of it. Nothing else changes them: the branches of the legacy API of
  Zigbee2mqtt 1 (`bridge/config`, `bridge/config/permit_join`) are removed.
- An end is taken only when it falls between now − 2 s and now + 256 s by the clock of Gladys: the end of
  an external Zigbee2mqtt whose host clock differs is not, nor the missing one of Zigbee2mqtt 1. The
  open window then keeps the end it had (the estimate of the response), or none.
- Forgotten (`false`, `null`, sent) when Gladys disconnects from the broker (Stop, `disconnect`,
  `reset`) and at each `init`: the Zigbee2mqtt it connects to tells joining again (its retained
  `bridge/info`). `bridge/state` changes nothing: retained, it is replayed at each reconnection and
  proves no new run; a new run tells joining closed in its own `bridge/info`, a crash is told by the
  health check.
- A window seen open stays the same window until Zigbee2mqtt tells joining closed (or Gladys
  disconnects): the forgetting of an `init` does not end it. Joining told open again meanwhile — the
  retained `bridge/info` replayed after a reconnection or an init — is that window, whatever its end
  says (another clock, none with Zigbee2mqtt 1), and takes back its end while it runs (C.2). Limit: a
  window closed then opened again while Gladys was not connected is taken for the same one.

### B.2 `zigbee2mqtt.permit-join` and `GET /permit_join`

Both carry the same object:

```json
{ "allowed": true, "remainingSeconds": 241 }
```

- `remainingSeconds`: `z2mPermitJoinEnd - Date.now()` rounded to the second, bounded to 0–254; `null`
  when `allowed` is false or the end is unknown (Zigbee2mqtt 1, `permit_join_end` absent). The browser
  computes the end with its own clock from the moment it receives the value: the clocks of the browser
  and of the server never meet.
- Sent when `allowed` or `z2mPermitJoinEnd` changes (not on every `bridge/info`), and on each
  `bridge/response/permit_join` with `status: ok` even when it changes nothing (an Extend whose
  estimated end falls within 5 s of the known one, with Zigbee2mqtt 1 or another clock): the window
  waits for the answer of its request (D.2).
- Formerly a bare boolean: every consumer of the front (wizard, dashboard, Discover tab) reads the object.

### B.3 `POST /permit_join`

Unchanged (installation spec, E.1): `{ value: true }` asks for 254 s, `{ value: false }` closes,
400 `ZIGBEE2MQTT_NOT_ANSWERING` when Zigbee2mqtt does not answer. Asking again while joining is open
renews the current window for 254 s ("Extend", D): the same window (B.1), the registry kept.

## C. Pairing registry

### C.1 Entry

The server keeps `pairingDevices`, by IEEE address, the devices seen joining since joining last
opened, and the ready ones of earlier windows not added to Gladys yet:

| Field          | Content                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ieee_address` | key                                                                                                                                           |
| `friendly_name`| last name told by Zigbee2mqtt (event or `bridge/devices`)                                                                                     |
| `status`       | `joined`, `interviewing`, `ready`, `generic` (not supported, with a useful generic feature, E.1), `unsupported` (not supported, nothing useful), `failed`, `left` (gone before its interview ended) |
| `model`, `vendor`, `description` | from `definition` once the interview succeeded, else `null`                                                                  |
| `device`       | `ready`, `generic`, `unsupported`: the Gladys device as the Discover tab gets it (`getDiscoveredDevices`, with `id` when it is already in Gladys, and `zigbee2mqtt_support` / `zigbee2mqtt_info`, E.2), else `null` |
| `updated_at`   | ISO date of the last change                                                                                                                   |

### C.2 Transitions

| Event                                         | No entry                | `joined` / `interviewing` | `ready` / `generic` / `unsupported` / `failed` / `left` |
| --------------------------------------------- | ----------------------- | ------------------------- | ---------------------------------- |
| `device_joined`                               | create `joined`         | `joined`                  | `joined` (joined again)            |
| `device_interview` `started`                  | create `interviewing`   | `interviewing`            | `interviewing`                     |
| `device_interview` `successful`, `supported`  | create `ready`          | `ready`                   | `ready`                            |
| `device_interview` `successful`, not supported, a `definition` with a useful feature (E.1) | create `generic` | `generic` | `generic` |
| `device_interview` `successful`, not supported, no `definition` or none useful | create `unsupported` | `unsupported` | `unsupported`             |
| `device_interview` `failed`                   | create `failed`         | `failed`                  | `failed` (a late failure of an earlier interview after `ready` is applied: Zigbee2mqtt says the last word) |
| `device_leave`                                | —                       | `left`                    | removed (`left`: unchanged)        |
| `bridge/devices`                              | —                       | name updated; the device listed with its interview finished (`interview_completed`, not `interviewing`): `ready`, `generic` or `unsupported` as `device_interview` `successful` | name updated; `device` computed again (`ready`, `generic`, `unsupported`); a `generic` / `unsupported` device the list now tells supported (Zigbee2mqtt updated meanwhile) becomes `ready` |
| `bridge/devices` without the device (removed from Zigbee2mqtt) | —      | removed                   | removed, but `left` (no longer listed since it left) |
| a new window opens (`allowed` false → true, not the same window, B.1) | — | removed | removed, but `ready` / `generic` with a `device` not in Gladys (no `id`) or not known yet |
| Stop, `disconnect`, `reset`                   | emptied                 | emptied                   | emptied                            |

- `device_announce` is ignored: every known device announces itself when it powers up.
- The names of a `bridge/devices` are taken as it arrives, before the Gladys devices renamed in
  Zigbee2mqtt are re-attached (an await): a name told meanwhile, more recent, is not replaced by them.
- `bridge/event` is not retained, `bridge/devices` is: Gladys reconnecting to the broker (every 5 s,
  the registry kept) misses the events told meanwhile, and gets the list again. A device whose
  interview ended meanwhile is thus taken from the list, not left `joined` / `interviewing`. A failure
  told meanwhile is not in the list: the entry waits for the device to join again.
- A device removed from Zigbee2mqtt (its interface, `bridge/request/device/remove`) may tell no
  `device_leave`: its entry is removed when a `bridge/devices` no longer lists it.
- Closing joining keeps the registry: an interview often ends after the window, and the user may add
  the ready devices later. A new run of Zigbee2mqtt keeps it too, and so does the same window told again
  after a reconnection or an init (B.1). A new window keeps the ready devices while they are not in
  Gladys: the window reopened shows them with their photo and suggested name, not only the Discover tab
  under their IEEE address.
- A device leaving before its interview ended stays `left`: its row says why it is gone, until it joins
  again or a new window opens.
- An event arriving while joining is closed (a device joining through the Zigbee2mqtt interface) is
  applied all the same.
- `device` is read when the entry is sent, not stored: the `successful` event and the `bridge/devices`
  that follows come in any order, and a device added to Gladys meanwhile gets its `id`. Until the
  device is in `discoveredDevices`, a `ready` or `generic` entry has `device: null` (the window shows
  "Getting the device ready…"), an `unsupported` one shows its explanation without "Copy the
  information" (E.4); on a phone, its row opens no sheet, and so holds no link, until the device is known.

### C.3 `zigbee2mqtt.pairing` and `GET /pairing`

- `zigbee2mqtt.pairing`: the whole registry, `[entry]` ordered by first appearance, sent each time an
  entry changes (and after a `bridge/devices` that changes the `device` of a `ready`, `generic` or
  `unsupported` entry: known, or its `id`). The list is
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

- **Header**: "Joining permitted 3:52" counting down from `remainingSeconds`, **Extend** (white, dark green
  label: readable on the green of the open header; `POST
  /permit_join` `{ value: true }`) and **Stop** (`{ value: false }`); closed: "Joining closed" and
  **Permit joining** again. A request waits for Zigbee2mqtt to tell its outcome through
  `zigbee2mqtt.permit-join`, from the click (its answer may come before the one of the request): not
  told within 10 s, or refused by the server, it failed (an error under the header, the button back).
  Joining told closed while asked to open is not a refusal (the end of the previous window): still
  waited for. What was asked, told later, ends the request and clears its failure. A stop not
  confirmed while joining is already closed failed in nothing. Each click is an attempt: the answer of
  an earlier one, still running after its 10 s, touches neither the wait nor the outcome of the last.
  In the demo, the answer of the request is enough. Without a known end, no countdown.
- **Tips** (approach, pairing mode, add it here) while the registry is empty; once a device is listed, while
  joining is permitted, a line under the rows says another device can be put in pairing mode.
- **One row per entry**, a timeline "Joined → Identification → Ready" (the last step reads "Generic
  features" for a `generic` entry, "Not supported" for an `unsupported` one; each step also tells its state —
  done, in progress, failed, not supported, to come — in a text for screen readers, told as it changes:
  a polite live region; in the header, only the title is one, not the countdown):
  - `joined`, `interviewing`: the step running, the friendly name (an IEEE address until the device
    has a name);
  - `ready`, `device` known, not in Gladys: a card — photo (D.3), suggested name (D.4, editable),
    room (optional, as in the Discover tab), **Add** (the request of the Discover tab:
    `POST /api/v1/device` with the feature names of the dictionary and the states stripped, the device
    read again from `GET /pairing`, which attaches its energy features to the main electric meter; the
    message does not). Not read again (the request fails, the device is no longer ready): not added,
    the error of the card — never the device of the message, saved without its meter. Read again with an
    `id` (added meanwhile from another window or the Discover tab): not saved over, "Already in Gladys".
    Added: "In Gladys" with a link to the device, until a registry received tells it out of Gladys
    (deleted since): to add again, under its name. The names of the Gladys devices read after the Add
    do not undo it;
  - `ready`, already in Gladys (`device.id`): "Already in Gladys" with a link (a device paired again);
  - `generic` (D65, D68): the card of a `ready` device with the "Generic features" badge and the
    features listed; **Add** asks for the confirmation of E.3 first;
  - `unsupported`: "Not supported by Zigbee2MQTT" with the model when known (desktop and phone), the
    explanation of E.4 and its two actions; no Add;
  - `failed` (D59): "Identification failed" and the advice: "Bring the device closer to the dongle or to a
    mains-powered device, then put it in pairing mode again"; the row starts over if it joins again;
  - `left`: "Left the network before its identification ended" and the advice to put it in pairing mode
    again.
- The icon of a device (photo not loaded, phone rows) is the one of its first feature that is not a
  secondary one (D.4), not of its battery.
- A device whose photo, name or row once ready is shown is never created without the click on **Add**
  (D6). A name typed by the user is kept when the registry comes again.
- **Finish** (wizard) / **Close** (dashboard, Discover tab). Closing the window does not close joining
  (it closes by itself); the registry stays on the server. Back on the dashboard or the Discover tab,
  the devices of the network not in Gladys are read again: the ones just added are no longer new. While
  ready devices are not added, a notice under the rows counts them and says they stay in the window until
  added (C.2): nothing blocks the close.
- The screen of its own holds an entry of the history: "back" (browser, Android button, iOS swipe) closes
  it, back to the dashboard or the Discover tab, not out of the Zigbee2mqtt page; on a phone, a "back"
  with the sheet of a device open closes the sheet first. Closed by its button, it leaves its entry.
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
  came meanwhile). A `zigbee2mqtt.pairing` message clears the failure to read the list.
- Opened while Zigbee2mqtt does not answer, the window asks for joining once it answers again, unless
  the user asked something meanwhile. Zigbee2mqtt answering again after an outage clears the failure of
  a request told before it, and asks for joining again when that failure was one to permit it.
- The countdown is a timer of the component, stopped on unmount and when joining closes; it shows 0:00
  until Zigbee2mqtt tells joining closed.
- An Add in flight keeps its card busy; its answer is applied only if the component is still mounted;
  a failure stays visible on the card.
- Zigbee2mqtt no longer online (status): the header says that Zigbee2mqtt does not answer, or that
  Gladys is not connected to the MQTT broker when that is the cause (`gladysConnected` false); no
  button; the rows stay.

## E. Devices Zigbee2mqtt does not support (step 2.3)

What Zigbee2mqtt 2 does (checked on 2026-11-27 in Zigbee2mqtt 2.14.2, `lib/model/device.ts` and
`lib/extension/bridge.ts`, and zigbee-herdsman-converters 26.115.1, `src/index.ts` and
`src/lib/generateDefinition.ts`): once the interview of a device ended (succeeded or failed), a model it
does not know gets a **generated definition** (`description: "Automatically generated definition"`,
`model` = the `modelID` of the device, `vendor` = its manufacturer name, `definition.source:
"generated"`), whose exposes come from its standard clusters (light, plug, sensors, cover, thermostat,
IAS zone, lock…); proprietary clusters (Tuya `0xEF00`) give nothing. Such a device is told `supported:
false`. A device has no `definition` (the key is absent) only until its interview ended. `linkquality`
is added to the exposes of every device.

### E.1 Useful feature

A feature is useful when its category is not a secondary one (D.4: battery, battery low, signal
strength, device temperature). Every device has a signal feature (`linkquality`): a device with only
secondary features gives the user nothing to control or read.

### E.2 Server: what the Discover tab gets

- `discoveredDevices` keeps every device of `bridge/devices` but the coordinator, supported or not (it
  dropped `supported: false`): a generic device added to Gladys is then controlled and its states read
  like any other (`findMatchingExpose`, `postCreate`).
- `GET /discovered` gives each device a `zigbee2mqtt_support` (not saved with the device):
  - `native`: supported by Zigbee2mqtt (`supported` true), whatever its interview — unchanged;
  - `interview_failed`: not supported and its interview failed (`interview_state` `FAILED`; without
    `interview_state`, Zigbee2mqtt 1: neither `interview_completed` nor `interviewing`);
  - `generic`: not supported, a `definition` with at least one useful feature (E.1) once converted;
  - `unsupported`: not supported, nothing useful (or no `definition` after its interview).
  A device not supported whose interview is not over (`interviewing`, `PENDING` / `IN_PROGRESS`) is not
  listed: the pairing window follows it.
- The devices that are not `native`, and the `native` ones without a useful feature (E.4 b), carry
  `zigbee2mqtt_info`: `model_id`, `manufacturer`, `power_source`, `interview_state`, `definition`
  (`model`, `vendor`, `description`, `exposes`) and `endpoints` (their input and output clusters), as
  Zigbee2mqtt tells them, for the reports of E.4. Neither field is sent back with `POST /device` (the
  front strips them, as it strips the states).
- `filter_existing` applies to every device, whatever its `zigbee2mqtt_support`.
- The pairing registry classifies `generic` and `unsupported` with the same rules (C.2).

### E.3 Adding a generic device (D65, D69)

- Discover tab and pairing window alike: **Add** (Save) on a `generic` device opens a confirmation (closed by
  itself in the window when a registry received no longer offers that device to add: left, removed, added
  elsewhere):
  "Zigbee2MQTT does not know this model. Gladys will create the features Zigbee2MQTT deduced from what the
  device declares: some may be missing or not work. Add it anyway?" — **Cancel** / **Add**. A modal on a
  large screen, the confirmation sheet of the kit on a phone. Only **Add** sends the request; Cancel
  leaves the card as it was (name, room kept).
- Once added, it is a Gladys device like another. When an update of Zigbee2mqtt supports its model, the
  device turns `native` and the Discover tab offers **Update** (`mergeDevices`), as for any device whose
  features changed: the update takes the features of the new definition, those with the same
  `external_id` keeping their id and history (`mergeDevices`), the others gone — scenes and dashboards
  that used them lose them, as for any update.
- Its suggested name (D.4) is the category alone when the vendor is a raw Tuya manufacturer name
  (starting with `_`, `_TZ3000_…`).

### E.4 Reporting (D66, D70)

- **(a) Not known by Zigbee2mqtt** (`generic`, `unsupported`): "Ask Zigbee2MQTT to support it", a link
  (new tab) to
  `https://www.zigbee2mqtt.io/advanced/support-new-devices/01_support_new_devices.html`, and **Copy the
  information**: a Markdown text — model ID, manufacturer, power source, endpoints with their input and
  output clusters, the generated exposes — to paste in an issue of Zigbee2mqtt. The copy works on plain
  HTTP (`document.execCommand('copy')` fallback, as the password of the interface); refused, the text is
  shown, selectable. The explanation of an `unsupported` device: "Zigbee2MQTT does not know this model and
  found nothing Gladys can control on it."
- **(b) Known by Zigbee2mqtt, nothing useful in Gladys** (`native`, only secondary features, E.1): still added
  as before (a router is added for its signal), in the Discover tab and the pairing window alike, and counted by
  the dashboard; its card adds "Gladys only uses the battery or the signal of this device" and **Suggest this
  device**: a new topic on the Gladys forum, prefilled
  (`https://community.gladysassistant.com/new-topic?title=…&body=…&category=feature-requests`): title
  "Zigbee2MQTT: support for <vendor> <model>", body with the model, vendor, description, model ID and
  the exposes in a code block, cut (and said so, by character, never inside one) for the whole URL to stay
  under 6,000 characters. It replaces the GitHub issue, which the old criterion ("a feature other than the
  battery", always met since `linkquality` is converted) no longer reached. A `native` device without any
  feature but its battery cannot be added: "Not supported by Gladys" and the same link.
- `interview_failed`: "Identification failed" and the advice of D59; no Add, no report.

### E.5 Discover tab (D67, D71)

- The main list holds the `native` devices, as today (case b included). Below it, a section **"Not
  supported by Zigbee2MQTT (n)"**, collapsed by default (desktop and phone), holds the `generic`,
  `unsupported` and `interview_failed` devices, each with what E.3 and E.4 say; absent when empty. A
  `generic` device already in Gladys shows "Already in Gladys" / Update as in the main list; an
  `unsupported` or `interview_failed` one already in Gladys (added before, not recognized since) shows
  "Already in Gladys" with its explanation, never Update (its features would be emptied).
- "No new device" shows only when the list and the section are both empty.
- The count of new devices of the dashboard (`countNewDevices`) counts the `native` devices only.
- On a phone, the section is a row that opens and closes it; each device is the sheet of the tab
  (`MobileDeviceItem`): `primaryAction` "Add to Gladys" for a `generic` one (then the confirmation sheet),
  the two actions of (a) for an `unsupported` one, the advice of D59 for an `interview_failed` one.

## F. Tests

- Server, at mirrored paths (`getPermitJoin`, `updatePermitJoin`, `pairingDevices`,
  `handleMqttMessage`, `stop`, the controller): B.1 sources and forgetting, B.2 bounds and "only on
  change" (fake timers), each transition of C.2, `GET /pairing`. E.2: each `zigbee2mqtt_support` (Zigbee2mqtt
  1 and 2 interview fields), the useful-feature rule, `zigbee2mqtt_info` only where E.2 says, a generic
  device controlled and read once in Gladys (`setValue`, `readValue`, `findMatchingExpose` without definition),
  a generic device turning `native` (Update), a state of a device not supported logged in debug only.
- Cypress (E): the collapsed section (desktop, phone), the confirmation (Cancel keeps the card, Add sends
  the request) in the Discover tab and the pairing window, a `generic` row, an `unsupported` one (link,
  copy on HTTP, copy refused), case (b) (the forum URL, cut), `interview_failed`, the count of new devices.
- Cypress (`setup/Zigbee2MqttPairing.cy.js`, `…PairingMobile.cy.js`, step ④ in `…Wizard*.cy.js`,
  Pair in `…Dashboard.cy.js`): countdown, Extend, Stop, the three failures of a request, a slow
  answer after a message, Zigbee2mqtt not answering; a device going joined → interviewing → ready →
  added (suggested name suffixed, room, request body, the count of devices to add), a typed name kept,
  an Add that fails, already in Gladys, unsupported (its last step), failed, left before the end of its
  interview, removed, the icon of what the device is when the photo does not load, a message more recent
  than the list read at opening, the list not readable, the failure cleared and joining asked again after
  an outage, "back" closing the screen; on a phone, the sheet of a ready device, the model of an
  unsupported one, Extend and Stop side by side, "back" closing the sheet then the screen.

## G. Out of scope

- Re-interview button (D59), joining through a given router (2.5), writing an external converter of
  Zigbee2mqtt from Gladys.
