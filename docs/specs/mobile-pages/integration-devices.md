# The "Devices" and "Discovery" tabs of an integration on a phone

> Part of [`mobile-pages`](README.md) — principles and kit there. **Any PR that changes one of
> these behaviors modifies this file in the same diff.**

## A. Context

Every integration that manages devices has a "Devices" tab and, most of the time, a "Discovery"
tab (`front/src/routes/integration/all/<integration>/`). They were a desktop grid: one `col-md-6`
card per device holding its name, its room, its features, its parameters as disabled fields and
its buttons. On a phone the cards stack — three Matter devices were 2 450 px of repeated fields —
the search and the sort select of the card header are 15 px fields squeezed next to the title
(iOS zooms into them), "Save" and "Delete" are 36 px buttons side by side, and "Delete" deletes on
a single tap.

What people come to do there: **find a device, rename it or move it to another room, delete it**
— and on the discovery tab, **scan and add what was found**.

This file covers the integrations below. The other ones keep their desktop grid on a phone until
they are moved to the same layout, **with the components of section B**.

| Integration           | Devices                                         | Discovery                                      |
| --------------------- | ----------------------------------------------- | ---------------------------------------------- |
| Matter                | `matter/MatterDevices.jsx`                      | `matter/MatterDiscoverPage.jsx` (pairing code) |
| MQTT                  | `mqtt/device-page`                              | `mqtt/discovery-page`                          |
| Bluetooth             | `bluetooth/device-page`                         | `bluetooth/setup-page`                         |
| Airplay               | `airplay/device-page`                           | `airplay/discover-page`                        |
| LAN Manager           | `lan-manager/device-page`                       | `lan-manager/discover-page`                    |
| Enedis                | `enedis-gateway/UsagePoints.jsx` ("My meters")  | —                                              |
| Thermostat            | `thermostat/device-page`                        | —                                              |
| External integrations | `external-integration/device-page`              | `external-integration/discover-page`           |
| RTSP cameras          | `rtsp-camera/RtspCamera.jsx` (one page, no tab) | —                                              |
| Zigbee2MQTT           | `zigbee2mqtt/device-page`                       | `zigbee2mqtt/discover-page` (pair a device)    |

## B. The pattern (< 768 px)

These are **list pages** (README C.1): they keep the app's top bar, the title of the integration
and its tabs. Only the content of the tab changes: **one row per device, opening a sheet that
holds what the desktop card of the device holds** (README C.2 and C.5).

The shared components are in `front/src/components/integration/mobile/`:

- `MobileIntegrationTab`: the content of a tab — a column at most 40 rem wide, on the wallpaper
  (no card around the list). It owns the **toast** of the tab (a row that just deleted or added
  its device is gone from the list when its request is over) and the floating "+" of an
  integration whose devices are not discovered: a link when they are created in a page of their
  own (MQTT, Thermostat), a button when they are created in the list itself (cameras).
- `MobileListToolbar`: the **search** (16 px) and the **sort order as one button** that flips it
  ("A - Z" / "Z - A"), then the actions of the list (`ToolButton`, 44 px). They call the handlers
  of the desktop header with the same event: a phone list has no request of its own. The search
  field shows the query the list is filtered on, like the desktop one. Where that query is a
  debounced state (the devices of Bluetooth, Airplay and LAN Manager, the cameras, the discovery
  of an external integration) the field is not controlled — it would take back the letters typed
  since the last update — and only starts from the query still applied when it mounts again
  (`initialSearchValue`). Where the query is stored at once and only the request is debounced
  (Matter, MQTT, Thermostat, Zigbee2MQTT) the field is controlled (`searchValue`).
- `MobileDeviceItem`: the row of a device and its sheet (C and D).
- `MobileListLoader`, `MobileWaitingNotice`, `MobileTextNotice`, `MobileProgress`, `BatteryPill`:
  the spinner of a list, a notice that waits (a scan running), a long explanation of the desktop
  card kept as it is written, a progress bar, the battery of a device.

**One logic, two layouts** (README B). The container of each tab is unchanged; the component that
rendered the card of a device (`MatterDeviceBox`, `BluetoothDevice`, `DiscoveredBox`…) keeps its
state and its handlers and renders a `MobileDeviceItem` instead of its card when it gets
`isMobile`. Nothing is requested, validated or posted differently. The only changes to that logic
are what the sheet needs to tell how a request ended and to undo a change:

- the handlers that save, add or delete **resolve to `false` when the request failed** — and
  when nothing was requested: a discovered device that a live update removed from the list
  between the render and the tap is not added (external integrations return `false`; the MQTT
  action, which cannot return a value, throws);
- a device with too many states to delete at once is told apart from an error by every card
  (Enedis and the external integrations did not), and passed to the sheet as `deleteScheduled`,
  so the sheet can say what happens instead of a failure;
- replacing a Matter device works on a copy of the paired device: a replacement that fails
  leaves its row as it was published, not under the name and the ids of the existing device;
- a handler that changes a field of a device kept in the state of a component builds it **from
  the previous state** (two changes in a row must not overwrite each other);
- the Matter and Airplay cards keep what is being typed when their parent merely renders again
  (the router does on a system "back"); they still take the device of the list when the list
  brings another version of it.

**Order of a tab**: what blocks or warns about a state first (the integration is disabled,
Bluetooth is not reachable, an error), then the action of the page or the toolbar, then the list.
**A permanent explanation of the desktop card** (what the integration is for, what it cannot do)
**comes after the list**: the devices are what one comes for.

An empty list says so (`MobileEmptyState`) and leads to the next step when there is one (the
discovery tab, the pairing form, the connection with Enedis).

## C. The row

- An **icon tile**: the icon of the first feature of the device, or the one of the integration
  when its devices are all alike (a speaker, a thermometer, a meter, Bluetooth).
- Its **name** ("Unnamed device" when it has none), then **one line**: its room on a "Devices"
  tab ("No room" when it has none), what identifies it on a "Discovery" tab (model, manufacturer,
  address, number of features).
- Under them, **what the desktop card shows as badges, as pills with their word** — never the
  color alone: "In Gladys" / "Already added", "Update", "Not supported", "Disconnected", the
  battery level, the transport of a device of an external integration ("Local", "Cloud",
  "Unreachable", "Degraded"). They sit under the name, not beside it: a long name keeps the width
  of the row.
- The whole row is the target and ends with a chevron.

## D. The sheet of a device

Titled with the name of the device, closed with **×**, the system "back", the backdrop or a drag.
From top to bottom:

1. The pills of the row, and **what a badge says in a tooltip on the desktop card, written
   out** (a touch screen has no tooltip): why the transport is degraded, that a Matter device
   already exists under another node, that a device exposes nothing Gladys handles.
2. **Name** and **Room** — where the desktop card has them: 48 px, 16 px text, the native select
   of the system with the rooms grouped by house and "No room" first.
3. What the integration adds to the card (the "keep the history" switches of an external
   integration, the progress of an Enedis synchronization).
4. **Features**: the tags of the desktop card, read-only.
5. **Details**: what the card shows as disabled fields or in a table (external id, model,
   manufacturer, MAC and IP addresses, technical parameters) — a label over its value, wrapping,
   selectable. The technical parameters of Matter and of the external integrations stay folded
   behind "Show the details", as on the card.
6. **The buttons**, 52 px, one under the other:
   - **Save** on a "Devices" tab: disabled while nothing differs from the device as the sheet
     opened. A success closes the sheet and shows the "Saved" toast.
   - **the action of a discovered device** ("Add to Gladys", "Update", "Connect in Gladys"…): a
     success closes the sheet and shows "Device added to Gladys" / "Device updated". A device
     that cannot be added says why on a disabled button ("Already created", "Managed by … service").
     An action that needs a confirmation (`primaryAction.confirm`: a Zigbee2MQTT device added with
     generic features) asks first in a sheet over this one; Cancel leaves the sheet as it was, a
     failure shows in it once the confirmation closed.
   - **Edit**, when the integration has an edit page for the device (Bluetooth, MQTT,
     Thermostat).
   - **another request of the card** ("Update" a meter, "Test connection" of a camera). A success
     closes the sheet, unless its result shows in the sheet (the image of a connection test).
   - **Delete**, always last.
   - A button shows a spinner while its request runs, and the other ones are disabled meanwhile
     — **and so are the fields of the sheet** (name, room, switches): what would be typed after
     "Save" is not in the request, and would be taken for saved the next time the sheet opens.

**A failure stays where the thumb is**: the sheet stays open and the error shows right above the
buttons — the sentence of the desktop card when it has one (with its technical detail for Matter
and the external integrations), "Gladys could not save this device. Try again." otherwise (the
Bluetooth, LAN Manager and Enedis cards never said that a save had failed).

**Nothing is deleted on a single tap.** "Delete" opens a confirmation sheet naming the device and
what goes with it (its history; the scenes and the dashboards that use it). Confirming calls the
handler of the card; a refusal shows in the confirmation, which stays open. **A device with too
many states to delete at once is not a refusal** — Gladys purges its history in the background,
then deletes the device on its own, in one "Device deletion" job (`device.destroyAfterStatesPurge`):
the confirmation closes and the sheet says so in a plain notice, with the link to the jobs, its
fields and its buttons disabled — nothing is saved or deleted again on a device that is going
away (closing it then drops the unsaved changes without asking, see below). Each card keeps that
state per device: deleting another device of the same list does not clear it. This holds for every integration of A. The deletion is bound to the device as it was when
asked (a device paired again in place meanwhile is kept), and is kept in memory: a restart of
Gladys drops it, and the row stays in the list until the page is loaded again — the notice says
what to do then. A success closes everything and shows "Device deleted".

**On a wider screen too, and in every integration.** The "Delete" button of a device card is a
`DeleteDeviceButton` (`front/src/components/device/DeleteDeviceButton.jsx`) — in the integrations
of A and in the ones that keep their desktop grid on a phone (Tasmota, Z-Wave JS UI,
Philips Hue, Tuya, Netatmo, the cameras…): it opens the same confirmation, with the same texts,
as a centered dialog (the sheet of the kit below 576 px). Confirming closes the dialog and calls
the delete handler of the card, which keeps its own loader and **says the outcome itself, on the
card**: the notice of a deletion that goes on in the background, or the sentence of the card ("Gladys could not delete this
device. Try again." where the card had none: Bluetooth, Broadlink, LAN Manager, Philips Hue,
Xiaomi, the cameras, the Enedis meters) — after a confirmation, a deletion that fails never looks
like nothing happened. Cancel, Escape and the backdrop delete nothing. A card whose device was
never saved (no `created_at`: a camera being filled in) holds no history and nothing uses it: it
is removed without a question. Thermostat keeps the inline question of its card.

The question is about one device, and one confirmation is one deletion:

- every list of device cards gives its cards a **stable key** (the `id`, the `external_id` or
  the `selector` of the device — the `id` where a card not saved yet has no `external_id`), so a card, its dialog and its messages stay with their device when
  the list changes (a search, a sort, a neighbour deleted, a reload);
- `DeleteDeviceButton` remembers which device it asked about: handed another one while the
  dialog is open, it closes the dialog instead of confirming for a device the user never looked
  at;
- while the handler runs, the button is disabled and a second click on "Delete the device" does
  nothing (the handler returns its request, so "runs" lasts until it ends);
- the cameras and Zigbee2mqtt remove the deleted device from their list by its identity, in the
  list as it is when the request ends, not by the index it had when the request left — a saved
  device by its `external_id`, a card not saved yet by the `id` the page gave it, so two such
  cards never go together.

**Nothing is lost silently.** The changes made in the sheet live in the state of the card, as on
a wider screen. Closing a "Devices" sheet with unsaved changes — by any of the four ways, the
system "back" included — asks: **Save and close** / **Close without saving** (the name, the room
and the switches go back to what they were) / **Keep editing** — except on a device whose
deletion is scheduled, which has nothing left to save: its changes are dropped as by "Close
without saving". "Edit" asks the same question
before it leads to the edit page. A second system "back" closes the question, like "Keep
editing". A discovery sheet does not ask: what was typed stays with the device in the list, as on
the card, until it is added.

**Leaving for another page from a sheet** ("Edit", "Connect in Gladys") replaces the history
entry of the sheet: one "back" from that page returns to the list.

## E. Per integration

Only what differs from B, C and D.

### Matter

- **Devices.** The toolbar has the search, the sort order and "Refresh". "Paired devices not
  added to Gladys" comes first, as on the card: one row per device, whose sheet says why it is
  there ("already exists under another node", "has updates") and holds "Add to Gladys", "Update in
  Gladys" or "Replace the existing device". The row of an update and its sheet are titled with
  the name of the Gladys device it updates, like the card (`energy-hierarchy.md`, F, Matter), and
  the search finds it by that name too. While the paired devices load, a waiting notice says
  so. A disconnected node shows "Disconnected" on its devices.
- **Add a device.** The pairing form: the explanation as a lead, the Thread border router warning
  as a notice, the pairing code (16 px, numeric keyboard, the same pattern), and "Add to Gladys"
  as a full-width button. While the device is paired — it can take minutes — a waiting notice says
  so and the button shows a spinner; an error shows above the button.

### MQTT

- **Devices.** The groups by room of the list are section titles ("Living room · My house"). A
  device has no field in its sheet: **Edit details** leads to the MQTT device editor, which keeps
  its desktop layout (`device-edit.md` D), and **Delete** is confirmed. The creation is the
  floating "+".
- **Discovery.** The devices are pushed live: "Refresh" is a quiet button. "Hide devices already
  in Gladys" is a switch row. A device that exposes nothing Gladys handles is "Not supported": its
  sheet says so and has no action.

### Bluetooth

- **Devices.** The battery of a device is a pill. "Edit" leads to the device page
  (`device-edit.md`).
- **Discovery.** The scan is the button of the page; **while a scan runs it says "Stop the
  scan"** (the desktop button only turns red). It is disabled while Bluetooth is not reachable,
  which a notice says. The sheet of a peripheral leads to its configuration page ("Connect in
  Gladys" / "Update in Gladys"); a peripheral managed by another service says which one.

### Airplay

- **Discovery.** "Scan" is the button of the page. A device found is added with "Save", as on
  the card; one that is already in Gladys shows "In Gladys".

### LAN Manager

- **Devices.** The sheet shows the manufacturer, the MAC address and the hostname.
- **Discovery.** "Scan network" is the button of the page and says "Stop the scan" while one
  runs; "New devices available" shows under it when the scan found some. "Hide already added
  devices" is a switch row. A device needs a name to be added, as on the card: its field is
  marked and "Save" is disabled until it has one.

### Enedis — "My meters"

- "Synchronise with Gladys Plus" is the button of the page; its spinner is for the
  synchronization only (it is disabled, not spinning, while a meter is saved or deleted). One row
  per meter: its name, its meter id, and "Synchronisation in progress… 42%" while Gladys Plus
  refreshes it.
- The sheet: the name, the progress of the synchronization and its explanation, the meter id, the
  last synchronization and the number of states, then "Save", "Update" (a meter that misses its
  features) and "Delete" — confirmed, on every screen size.

### Thermostat

- One row per thermostat: its room, and what it is set to in the words of the card ("20.5 °C ·
  Work week", "Stopped · No schedule", "The heater regulates").
- The sheet: name, room, the same summary, "Save", "Edit" (the thermostat form) and "Delete",
  whose confirmation is the sheet of D instead of the inline question of the card. The creation is
  the floating "+".

### RTSP cameras

The integration has one page and no "Discovery": a camera is created by hand, in the list.

- **The list.** The toolbar has the search and the sort order; the count of the cameras heads
  the rows (a camera icon, the name, the room). With no camera at all the page offers "Add a
  camera" in place of the floating "+"; a search that finds nothing only says so, the "+" stays.
- **The sheet** holds the fields of the card: name, room, **refresh frequency**, the **URL** of
  the stream (16 px, a URL keyboard, no capital letter and no correction; its explanation under
  the field) and the **rotation** of the image — which gets a label here, the card has none.
  The frequency, the URL and the rotation count in the unsaved changes and are put back by "Close
  without saving". The features are not listed: a camera always has the same ones.
- **Test connection** is a button of the sheet, under "Save", disabled while the camera has no
  URL. It posts the camera as the sheet shows it, saved or not, and **the sheet stays open**: the
  image the camera answered shows right above the buttons. A failed test shows there too, with
  the reason the server gave (the `message` of the API error — the card showed an empty alert).
  The error of a test or of a save is forgotten when the sheet opens again.
- **A camera needs a name to be saved**: "Save" is disabled until it has one and a line under
  the field says why (the card lets the request fail). The field is marked once it was typed in
  and emptied, or when a saved camera lost its name — not on a new camera nothing was typed in.
- **"+"** adds a camera to the list, as the "New" button of the card, **and opens its sheet**,
  titled "New camera" until it has a name. That camera only exists in the page until it is
  saved: its sheet has no "Delete", and closing it without saving — after the question of D when
  something was typed — **takes it out of the list**. Saved, it is a camera like the other ones.
- **A camera that was never saved** can be saved as soon as it has a name, whatever the sheet
  changed. One added on a wider screen keeps its row when the window narrows: its sheet has
  "Delete", confirmed, which takes it out of the list without a request, as on its card.
- **A search or another sort order keeps the cameras that were never saved**, at the end of the
  list it brings (on every screen size: the card of a camera being typed was dropped by the
  answer of a search). They are not kept when the page is opened again.
- A failed deletion is said: on a phone in the confirmation, on a wider screen on the card (D),
  and both tell a camera with too many states apart. Both remove the camera from the list by its
  identity (D), and a camera that was never saved goes without a request.

### External integrations

- **Devices.** The count of the devices heads the list, with "Refresh" on its right and the
  devices per transport as pills. The sheet adds one **"keep the history" switch per feature**
  that can be historized (the rows of the card), counted in the unsaved changes.
- **Discovery.** "Scan" is the button of the page ("Scanning…" with a spinner while it runs, and
  the notice of the card); the search filters the list as on the card. The error of a device that
  could not be created is the one of the card, with the rejected fields.

### Zigbee2MQTT

- **Both tabs.** The state of Zigbee2MQTT comes first, with the words of the desktop banner: a
  warning when it does not answer or when Gladys does not reach the broker (with why it does not
  start, and the link to the setup page). **Not installed**, it is a notice and "Install
  Zigbee2MQTT" as a full-width button — the only banner then. The notice that the address of the
  Zigbee2MQTT interface is not set comes **after the list**: it only takes away the links of the
  sheets, it blocks nothing on the tab.
- **Devices.** The battery of a device is a pill. The sheet shows the IEEE address in its
  details and, when the address of the interface is known, "Open in Zigbee2MQTT" (a new tab).
  "Edit" leads to the device page (`device-edit.md`). An empty list leads to the Discover tab,
  unless Zigbee2MQTT is not installed.
- **Discover.** **"Pair a device" is the button of the page** — the button of the desktop
  header: it opens the pairing window on a screen of its own (`zigbee2mqtt-pairing.md`, D.1),
  which asks for joining and follows each device; "back" and "Close" lead back to the list. It is
  disabled when Zigbee2MQTT does not answer, Gladys does not reach the broker, or it is not
  installed. The tab itself lists the devices of the network not in Gladys yet (a former pairing,
  the Zigbee2MQTT interface, another installation) and those to update. "Hide already added
  devices" is a switch row. A device is added with "Save"
  or updated with "Update", as on the card; its sheet shows the topic and the IEEE address, and
  "Open in Zigbee2MQTT" as on the "Devices" tab. A device Zigbee2MQTT supports that exposes nothing
  besides secondary features (battery, signal…) is "Not supported by Gladys": its sheet says so and
  holds "Suggest this device" (a prefilled topic of the Gladys forum, in a new tab). The devices
  Zigbee2MQTT does not support are in a row "Not supported by Zigbee2MQTT (n)" after the list, which
  opens and closes their section: a device with generic features is added with "Add to Gladys" after
  a confirmation sheet, the others hold "Ask Zigbee2MQTT to support it" and "Copy the information",
  or the advice of a failed identification (`zigbee2mqtt-pairing.md`, E). The empty list says "No new
  device found." — the button above it is the next step.

## F. What does not change

- From 768 px (a tablet, a desktop): the cards, as before — except that their "Delete" asks
  first (D).
- The containers, the requests and their payloads, the websocket updates.
- The pages these tabs lead to: the MQTT device editor, the Bluetooth peripheral configuration
  and the thermostat form keep their layout; the Bluetooth and Zigbee2MQTT device pages are the
  phone page of `device-edit.md`.
- The other tabs of these integrations (settings, setup, debug, schedules…).

A window resized across the breakpoint (a tablet turned) swaps the rows and the cards without a
new request (README C.8), and what was typed in a sheet is in the card: the lists and their
unsaved changes live in the container of the tab. Matter and Airplay are the exception — the name
and the room being typed live in the card of the device itself, which is another instance in the
other layout: an unsaved change there does not survive the swap.

## G. Tests

- Cypress, phone viewport, `front/cypress/e2e/routes/integration/IntegrationDevicesMobile.cy.js`:
  the rows in place of the cards and the 16 px fields; a device renamed from its sheet, the saved
  payload and the toast; the question asked when a sheet is closed with unsaved changes (keep
  editing, close without saving) and through the system "back"; a deletion confirmed, and
  cancelled; a refused deletion explained in the confirmation (Matter, Enedis, external
  integrations); the fields disabled while a save runs; a failed Matter replacement leaving its
  row untouched; the search and the sort order sent to the server; a discovered device added; the
  pairing form; the cards kept on a wider screen. For the cameras: the fields of the sheet, a
  connection test that leaves the sheet open on its image, a failed test (with the body the API
  sends) and its error forgotten when the sheet opens again, no test without a URL, the URL, the
  frequency and the rotation saved and undone, a camera added with "+" then saved, one closed
  without being saved, one kept when a search answers, and one added on a wider screen deleted
  from its sheet.
- Cypress, desktop viewport, `front/cypress/e2e/routes/integration/DeviceDeleteConfirm.cy.js`:
  the "Delete" of a card naming the device, cancelled by "Cancel", by Escape and by the backdrop
  (no request, the card kept), confirmed (the request, the card gone, and only one request for
  two clicks on the confirming button); a confirmed deletion that fails said on the card
  (Zigbee2mqtt and a card that had no sentence for it); a dialog left open while its device
  leaves the list closes instead of confirming for the next one.
- Cypress, phone viewport,
  `front/cypress/e2e/routes/integration/zigbee2mqtt/Zigbee2MqttTabsMobile.cy.js`: the status of
  Zigbee2MQTT first (not answering, not installed); a device renamed and saved, a failed save
  kept in the sheet, a deletion confirmed, a refused one explained; a discovered device added,
  an unsupported one; the "Pair a device" button — the pairing window it opens and the way back,
  and disabled while Zigbee2MQTT does not answer or is not installed; the "hide already added
  devices" switch; the cards and the button kept on a wider screen.
- The checks of README E on every tab of the table of A, in a phone emulation with a real touch
  screen (iPhone 13, 320 px, landscape, light and dark): no horizontal scroll, no field below
  16 px, no target below 44 px, the drag of a sheet.
