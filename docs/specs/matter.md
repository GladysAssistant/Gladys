# Matter: readable names, node sheet and unavailable devices

## Context

The native Matter integration (`server/services/matter`, `front/src/routes/integration/all/matter`) is one of the foundations of Gladys. The audit of November 2026 (Gladys 5.3.1, matter.js 0.17.9, compared with Home Assistant 2026.11) found three gaps in daily use and in managing the devices, which this spec covers:

- **Technical names.** A device was named `Vendor (Product) 1` and its features `OnOff - 1`, `Pm25ConcentrationMeasurement - 1`. These names reach the dashboard as soon as a device has two features of the same type, and could only be fixed widget by widget.
- **A node list made for debugging.** The settings tab showed a raw tree of clusters, attributes and commands, untranslated, with no status, firmware, network or controllers.
- **No unavailable state.** A node going offline, or a bridged device its bridge could not reach, kept showing its last value. The "Disconnected" badge of the Devices tab was a snapshot taken when the page loaded.

The other items of the audit (pairing over Bluetooth and QR code, OTA updates, new device families, an unavailable state on the dashboard) are out of scope here.

## A. Readable default names

### A.1 Naming hints (server)

The server has no i18n: it gives **hints**, and the front builds the name in the language of the user, like the Zigbee2mqtt pairing (`docs/specs/zigbee2mqtt-pairing.md`, D.4). Every paired device of `GET /api/v1/service/matter/paired-device` carries:

```json
"matter_naming": { "product": "Living room plug", "role": "outlet", "index": 2, "count": 2, "alone": false }
```

- **`product`**: the first filled label of the product the endpoint belongs to: `nodeLabel`, then `productLabel`, `productName`, `vendorName`, or `null`.
  - The product of a bridged device (an endpoint carrying `BridgedDeviceBasicInformation`) is that bridged device, named after its own `nodeLabel` / `productLabel` / `productName`. This label applies to the bridged device and to its children.
  - A bridged device without any label of its own is named after the bridge, within the bridge.
- **`role`**: the role of the endpoint, read from its Matter device types (`utils/endpointRoleMapping.js`). For example, an On/Off Plug-in Unit is an `outlet`, a Temperature Sensor is `temperature`, an Extended Color Light is a `light`.
  - Utility device types (root node, bridged node, aggregator, power source) carry no role.
  - The electrical sensor (`energy`) only names an endpoint which declares nothing more specific.
- **`alone`**: the product has a single Gladys device.
- **`index` / `count`**: the rank of the device among the devices of its product sharing its role, and how many share it.

The `name` of the paired device is unchanged (`Vendor (Product) number`): it is the fallback of a client that does not read the hints.

### A.2 The name (front)

`front/src/routes/integration/all/matter/matterUtils.js`, `suggestDeviceName`:

| Case | Name |
| --- | --- |
| `alone` | `Living room plug` |
| role known, `count > 1` | `Living room plug – Outlet 2` |
| role known, `count = 1` | `Office sensor – Humidity` |
| no role | the short name of the category of the first feature (`deviceFeatureCategory.<category>.shortCategoryName`), then the index |
| no hints | the `name` of the server |

The roles are translated under `integration.matter.roles.<role>`. A feature is named after its type in the language of the user (`deviceFeatureCategory.<category>.<type>`), else its category, else the name the server gave. Two features of a device with the same name are numbered.

The paired card (and its phone row) is titled with the suggested name. "Add to Gladys" saves it, with the feature names, and never the `matter_naming` hints.

### A.3 Updates keep the names

"Update in Gladys" and "Replace the existing device" (`energy-hierarchy.md`, F, Matter) keep the name of the device and **the names of its features already in Gladys**. A feature matches by `external_id`, or by the replaced `external_id` on a replacement. Only a feature new to Gladys gets a suggested name. Devices created before this change are never renamed.

## B. Node status and unavailable devices

### B.1 Status of a node

`lib/matter.watchNode.js` follows every node handled by `handleNode` for as long as Gladys knows it. It puts permanent observers on the `PairedNode` events:

- `stateChanged` carries the status;
- `connectionAlive`, `attributeChanged` and `eventTriggered` give the last contact.

A node is watched once. When matter.js gives a new object for the same node (controller restarted by the nightly backup, node re-paired), the observers of the former one are removed. The controller stopping, a reset or a decommission stop the watch and forget the status.

| matter.js `NodeStates` | `status` | Available |
| --- | --- | --- |
| 0 Connected | `connected` | yes |
| 2 Reconnecting | `reconnecting` | yes for `MATTER_NODE_UNAVAILABLE_GRACE_MS` (30 s), then no |
| 1 Disconnected | `disconnected` | no |
| 3 WaitingForDeviceDiscovery | `waiting-for-discovery` | no |

The grace delay keeps a renewed subscription, or a short glitch, from making the devices blink "unavailable". A timer makes the node unavailable if the same reconnection is still running when it ends.

`last_contact` is the last time the node was heard of. For a node offline since Gladys started, it is the last time matter.js saw it online or going offline (`state.commissioning.onlineAt` / `offlineAt`).

### B.2 Bridged devices

For a bridged device, `handleNode` reads `BridgedDeviceBasicInformation.reachable`, then listens to it. The listener is added once per cluster client, through `stateChangeListeners`. A bridged device the bridge reports unreachable (`reachable === false`) is unavailable, with its children; a missing value counts as reachable.

### B.3 Availability of a device

A Gladys device (`matter:<nodeId>:<devicePath>`) is unavailable:

- with reason `node-offline` when its node is not available;
- with reason `bridged-unreachable` when its path is, or is under, the path of an unreachable bridged device.

A command to a device its bridge reports unreachable is refused at once (`matter.setValue`, "unreachable"): the command-failure toast of the dashboard says so (`dashboard-flexible-layout-and-widgets.md`). A command to an offline node still tries to reconnect it for a bounded time (`ensureNodeConnected`).

### B.4 WebSocket

Every change of status, of availability (end of the grace delay) or of reachability of a bridged device sends to all the users:

```json
{
  "type": "matter.node-status-changed",
  "payload": {
    "node_id": "1",
    "status": "reconnecting",
    "available": false,
    "last_contact": "2026-11-24T10:00:00.000Z",
    "unreachable_device_paths": ["1:child_endpoint:3"]
  }
}
```

A contact alone (`last_contact` moving) sends nothing.

### B.5 What this does not cover

Gladys core has no notion of device availability. The dashboard keeps showing the last value of an unavailable Matter device, and only the Matter pages show "Unavailable". A core contract (a runtime flag on devices, a WebSocket message, a row of the devices widget) would need its own spec.

## C. API

All the routes are authenticated. `:node_id` must be digits (`400` otherwise).

| Route | Admin | Answer |
| --- | --- | --- |
| `GET /api/v1/service/matter/node` | no | The nodes (C.1). `with_gladys_devices=true` adds `gladys_devices` (`{ name, selector, external_id }`). `with_clusters=true` adds `devices`, the endpoint and cluster tree. Both flags accept the boolean of Gladys Plus too. |
| `GET /api/v1/service/matter/node/:node_id` | no | The sheet of a node (C.2), `404` for an unknown node |
| `POST /api/v1/service/matter/node/:node_id/identify` | no | `{ success, identified_endpoints }`: every endpoint with an `Identify` cluster identifies itself for 15 s. `400` when the node has none. |
| `POST /api/v1/service/matter/node/:node_id/share` | yes | `{ success, manual_pairing_code, qr_pairing_code, expires_at, duration_seconds }`: an enhanced commissioning window of 15 minutes (`openEnhancedCommissioningWindow`). |
| `POST /api/v1/service/matter/node/:node_id/decommission` | yes | Unchanged |

An error that is not a `400`/`404` is sent as an `Error500` with its message, so that it reaches the user through Gladys Plus too.

### C.1 Node of the list

```json
{
  "node_id": "1",
  "name": "Living room plug",
  "is_connected": true,
  "status": "connected",
  "available": true,
  "last_contact": "…",
  "unreachable_device_paths": [],
  "network_type": "wifi",
  "node_information": {
    "vendor_name": "…",
    "product_name": "…",
    "product_id": 32768,
    "product_label": "…",
    "vendor_id": 65521,
    "node_label": "…",
    "software_version": "2.4.1"
  }
}
```

- `name` is `null` when the node publishes no label.
- `network_type` is `wifi`, `thread`, `ethernet` or `null`: the active interface first (matter.js `deviceInformation`), then the operational interface of `GeneralDiagnostics`, then the supported one.
- The basic information is the one matter.js keeps up to date (a firmware updated since the pairing), over the one stored at the pairing.

### C.2 Sheet of a node

`status`, `available`, `since`, `last_contact`, plus:

- `live`: whether the node was asked. Live values are only read while the node is connected, each read bounded to 5 s. Otherwise the sheet shows what matter.js keeps in cache.
- `information`: vendor and product (names and ids), label, serial number, unique id, hardware and firmware versions.
- `network`:
  - `type` and `power_source` (`battery`, `mains`, `null`);
  - `rssi` (Wi-Fi: `WiFiNetworkDiagnostics.rssi`; Thread: the best link of `neighborTable`, the parent first) and `signal_quality`: `excellent` ≥ −60 dBm, `good` ≥ −70, `fair` ≥ −80, `weak` below;
  - `thread_role`, `thread_channel`;
  - `ip_addresses` of the operational interfaces.
- `controllers`: the fabrics of the node, read without fabric filtering, as `{ fabric_index, label, vendor_id, vendor_name, is_gladys }`.
  - `vendor_name` names Apple, Google, Amazon and Samsung SmartThings by their vendor id.
  - `is_gladys` comes from `currentFabricIndex`.
  - The field is `null` while the node is offline: the fabrics are always read from the node.
- `gladys_devices`: `{ name, selector, available, unavailable_reason }`. `bridged_devices`: `{ path, name, reachable }`.
- `capabilities`: `identify` (an endpoint has `Identify`) and `share` (the root endpoint has `AdministratorCommissioning`).

## D. Front

- **Devices tab.** Every device whose node or bridge makes it unavailable shows "Unavailable" (`data-cy=matter-device-unavailable`) on its card, and on its paired card. The reason is a tooltip on desktop, and a notice in the sheet of the phone row (`mobile-pages/integration-devices.md`, E). The status of the nodes comes from `GET /node`, then follows `matter.node-status-changed`.
- **Settings tab.** The nodes are rows (`MatterNodeList.jsx`). Each row shows the network as its icon, the name, vendor · product, firmware and the number of Gladys devices, and the status pill: "Connected", "Reconnecting" during the grace delay, "Offline". A row opens the **sheet of the node** (`MatterNodeSheet.jsx`, a `BottomSheet`, a centered dialog on desktop), live through the WebSocket:
  - groups: Status, Appliance, Network, Controllers with access, Devices;
  - actions: "Identify"; "Share with another app" (admin) opens a second sheet with the QR code, the manual code and a countdown; "Remove this node" (admin) opens the confirmation of the decommission (linked devices, "also delete them") and closes the sheet. The outcome is shown above the list.
- **Expert mode.** A switch below the list. It loads `with_clusters=true` and shows the endpoint and cluster tree (`MatterExpertTree.jsx`, translated) and the JSON export. The mode is remembered by the browser (`localStorage` `matter-settings-expert-mode`, read and written safely).

## E. Tests

- **Server** (`server/test/services/matter`):
  - `matter.watchNode`, `matter.nodeStatus` (grace delay with fake timers, last contact, reachability, forgetting);
  - `matter.handleNode` (naming hints of a power strip, a sensor, bridged devices with and without labels, reachability read, listened to once, unreadable);
  - `matter.getNodes`, `matter.getNodeDetails` (Wi-Fi, Thread, offline, unreadable fabrics, slow node), `matter.identifyNode`, `matter.shareNode`;
  - the refusal of `matter.setValue`, the routes of `matter.controller` (flags, validation, errors, admin on share), the cleanup of `stop` and `decommission`;
  - the helpers `getMatterAvailability`, `endpointRoleMapping`, `matterNodeInformation`.
- **Cypress**:
  - `MatterDevices.cy.js`: suggested names on a new device, feature names kept on an update, unavailable live and why;
  - `MatterSettings.cy.js`: the list, the sheet, identify, share, live status, remove, expert mode;
  - the Matter block of `IntegrationDevicesMobile.cy.js`.
