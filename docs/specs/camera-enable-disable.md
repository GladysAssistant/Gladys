# Camera enable / disable ("private mode")

> **Living specification — source of truth.** This document specifies how a camera is turned off
> in Gladys Assistant without being deleted. **Rule: any PR that changes one of these behaviors or
> contracts modifies this file in the same diff.**
>
> Status: **implemented**.

## A. Context

Community request ([forum topic 10645](https://community.gladysassistant.com/t/desactiver-une-camera-mode-prive/10645),
accepted by the maintainer). Today a camera can only be deleted, which loses its configuration,
its dashboard box and its history. Three field use cases:

1. **Seasonal cameras.** Nest-box cameras are unplugged during winter; Gladys keeps polling them
   every minute and floods the logs with errors. Disabling a camera must **stop the polling** —
   this is the primary pain point of the request.
2. **Private mode.** When the family is home, the cameras should stop capturing and displaying.
3. **Discretion.** Keep some visitors off the living-room dashboard.

The user asked for the switch to be reachable **from the UI and from a scene**.

## B. Data model

The state is one device feature on the camera itself:

| Category | Type | Constant | `read_only` | `min`/`max` | `keep_history` | `has_feedback` |
|---|---|---|---|---|---|---|
| `camera` | `enabled` | `DEVICE_FEATURE_TYPES.CAMERA.ENABLED` | `false` | 0 / 1 | `false` | integration choice (`false` for `rtsp-camera`) |

- **`1` = enabled** (the default), **`0` = disabled**.
- **A camera without the feature is enabled.** `isCameraEnabled(device)`
  (`server/utils/device.js`) returns `true` when the feature is absent or its `last_value` is not
  `0` (including `null`, i.e. never set). Existing installs are therefore unaffected, and a
  non-camera device is never gated.
- **No schema migration.** `category`/`type` are Sequelize ENUMs generated from the constants.

Modeling the gate as a feature is what makes it work everywhere for free: it renders as a toggle
in the device rows, and the existing `device.set-value` scene action turns it on/off from a scene
with no new plumbing.

**Boundary with neighboring categories.** `camera`/`enabled` is a *Gladys-side* gate: whether
Gladys polls, streams and displays this camera. It is **not** the camera's power supply — cutting
power stays a `switch` feature on the plug that feeds it. An integration able to mute the sensor
itself (Matter's Camera AV Stream Management soft privacy mode, vendor "privacy mode" APIs) maps
its control onto this feature; an integration with no such capability simply lets the core enforce
the gate.

## C. Server behavior when a camera is disabled

Polling, serving and RTSP live are gated in the **core**, so the behavior is identical for every
camera integration (`rtsp-camera`, MQTT-published cameras, external integrations):

| Path | Behavior |
|---|---|
| `device.poll` (`server/lib/device/device.poll.js`) | The device is skipped before the service is even looked up — no image fetch, no error log. This is the log-flood fix. |
| `camera.getImage` (dashboard snapshot, `GET /api/v1/camera/:selector/image`) | Throws `NotFoundError('Camera is disabled')`. The **last known image is never served**: serving it would defeat the privacy purpose. |
| `camera.getLiveImage` (live snapshot, chat intent, scene "send camera image") | Throws `NotFoundError('Camera is disabled')` before reaching the service. |
| `camera.getImagesInRoom` (chat "show me the cameras in the living room", MCP tool) | Devices carrying a `camera`/`enabled` feature at `0` are excluded from the query. |
| `rtsp-camera` `startStreaming` | Throws `NotFoundError('CAMERA_IS_DISABLED')`; the pending live-stream entry is cleaned up as for any start error. |
| `rtsp-camera` `setValue` | RTSP has no control channel, so the only writable feature is `enabled`; any other feature is rejected. Setting it to `0` **stops the running live stream immediately**, so a dashboard already streaming stops right away instead of waiting for the inactivity check. |
| `camera.setImage` (`POST /api/v1/camera/image`, external integrations through `saveCameraImage`, `rtsp-camera` polling) | Throws `NotFoundError('Camera is disabled')`: no new image is stored while the camera is off, so turning it back on cannot reveal what was captured during the private mode. |
| `device.newStateEvent` (`camera`/`image` states reported through `DEVICE.NEW_STATE` — MQTT and every other event-driven integration) | The image is dropped before being saved and the previous one is left untouched. Same guarantee as `camera.setImage`, on the path that does not go through it. |

**Ingest is gated on both paths.** Integrations reach the stored image in two ways: those calling
`camera.setImage` directly (`rtsp-camera` polling, the REST controller, external integrations
through `saveCameraImage`), and those reporting a `camera`/`image` state through
`DEVICE.NEW_STATE` — an MQTT camera, handled by `device.newStateEvent` → `saveStringState`. Both
refuse to store a frame while the camera is disabled, so no integration can keep filling the
image state during the private mode and reveal the newest frame when the camera is turned back
on. The gate in `device.newStateEvent` is narrow on purpose: it matches `camera`/`image` only, so
every other feature of every other integration keeps its generic state path untouched — including
the camera's own `enabled` feature, which must stay writable to turn it back on.

**Starting a stream is cancellable.** Several `await`s separate the `enabled` check from the
`ffmpeg` spawn in `rtsp-camera` `startStreaming`, so a camera disabled in between would otherwise
leave a process nobody can stop. The pending entry put in the `liveStreams` Map identifies the
start attempt: `stopStreaming` removes it (and tolerates a stream that has no process yet), and
`startStreaming` refuses to spawn — `CAMERA_STREAM_STOPPED` — when the entry is no longer its
own.

The state itself is stored by the standard path: `device.setValue` calls the owning service's
`setValue` and, since `has_feedback` is `false`, saves the new state.

## D. Feature creation and backward compatibility

- **New RTSP cameras** are created with both features (`image` + `enabled`, the latter starting at
  `1`) by the integration setup page (`front/src/routes/integration/all/rtsp-camera/actions.js`).
- **Existing RTSP cameras** get the feature from migration
  `20260818090000-add-camera-enabled-feature`: for each device of the `rtsp-camera` service that
  does not already have it, an `enabled` feature is created with `last_value = 1` (external id
  `<device external_id>:enabled`). The migration is idempotent and a no-op when the service is not
  installed.
- **Other integrations** declare the feature themselves — an MQTT camera through the MQTT device
  page, an external integration in its `discovered_device` payload. Nothing is auto-created for
  them: a feature the integration does not know about would have no owner.

## E. Frontend

- **Camera dashboard widget** (`front/src/components/boxs/camera/Camera.jsx`): the widget loads the
  camera device on mount and on camera change, and derives the disabled state from the `enabled`
  feature. When disabled it renders a **placeholder** (video-off icon +
  `dashboard.boxes.camera.cameraDisabled`) instead of the image, does not request an image, and
  offers no live-stream button. That placeholder reuses the widget's shared
  "no image" placeholder styling (`noImagePlaceholder` / `noImageIcon` / `noImageText`), so a
  disabled camera and an unavailable snapshot look consistent on a dashboard. It listens to
  `device.new-state` on the `enabled` feature's selector: turning the camera off from anywhere
  (scene, another dashboard, the devices page) clears the displayed image and stops an ongoing
  live view without a page reload; turning it back on refreshes the image. A websocket
  reconnection reloads the **device** before the image, since the state event of a camera
  disabled while the socket was down was missed — refreshing the image alone would leave the
  frame received before the disconnect on screen. That reload keeps what is displayed until the
  fresh device answers (`keepCurrentView`), so a reconnect does not blink the widget. Only a
  resolved "disabled" stops the image refresh: when the device reload does not resolve (its
  request failed, or a newer one superseded it) the widget still refreshes the image, since
  skipping it would drop the refresh the reconnect exists for — the last known state and the
  server's own gate already prevent a disabled camera from showing anything.
- **Device rows** (`device-in-room`): `camera`/`enabled` joins the supported-types allowlist and
  routes to `BinaryDeviceFeature` — a plain on/off toggle.
- **MQTT device page**: the type appears in the feature catalog with `min`/`max` 0/1, `read_only`
  false, no history and no unit.
- **Icon**: `power` in `DeviceFeatureCategoriesIcon`.
- **Scenes**: no change needed — the `device.set-value` action targets the feature directly, which
  is how "private mode when we get home" is built.
- **Translations**: `deviceFeatureCategory.camera.enabled` and
  `dashboard.boxes.camera.cameraDisabled` in every locale file.

## F. Out of scope

- **Per-camera scheduling** ("disable every day between 8 pm and 7 am"): a scene with a time
  trigger already does it; a dedicated scheduler is not needed.
- **A global "disable all cameras" switch**: a scene acting on several `enabled` features covers
  it without a new concept.
- **Deleting the images already recorded** when a camera is disabled: the stored last image is
  never served anymore, but the state history purge stays the generic mechanism.
- **Hard privacy feedback** (a camera reporting a physical shutter): would be a separate read-only
  feature, and no integration exposes one today.

## G. Answers to `device-feature-categories.md`'s checklist

- **No brand in the name/semantics**: `enabled` describes the capability "this camera may be used";
  every camera protocol can map onto it.
- **Could not be mapped onto an existing category + type**: no existing camera type carries an
  on/off state, and using `switch`/`binary` on the camera device would be ambiguous (it is the
  category used for the *plug*, and the core could not tell a camera gate from a real switch).
- **Same quantity not split across categories**: there is a single on/off state per camera.
- **Types intrinsic to the capability**: the feature holds one atomic boolean.
- **Standards checked**: Matter 1.4's Camera AV Stream Management cluster models privacy with three
  attributes (`SoftRecordingPrivacyModeEnabled`, `SoftLivestreamPrivacyModeEnabled`,
  `HardPrivacyModeOn`). Gladys deliberately diverges with **one inverted boolean**: (a) the core
  need is a single "Gladys must leave this camera alone" gate that also stops polling — something
  no Matter attribute expresses, since Matter only describes the camera, not the controller's
  polling; (b) splitting recording and livestream would expose two toggles that every non-Matter
  integration would have to keep in sync; (c) `enabled` follows the positive-logic convention of
  the rest of the taxonomy (`charge-on`, `climate-on`), where `1` means "active". A future
  integration that really distinguishes the two Matter modes can add types later — additive, and
  therefore non-breaking.
- **Enum-like values**: not applicable, the feature is binary.
- **Naming conventions**: kebab-case-compatible single English word, no protocol name, no `-sensor`
  suffix (it is a control, not a measurement).
- **Stress-tested against future device classes**: ONVIF/Tapo/Reolink cameras, doorbell cameras and
  external-integration cameras all have the same "should Gladys use it right now" question.
- **Inline scope comment** on the constant: yes (boundary with the plug's `switch` feature and
  value convention).
- **Translations** in all locale files: yes.
- **Units**: not applicable (not a measurement).
- **MQTT defaults and history grouping**: MQTT defaults added; the camera category is not part of
  the activity history groups.
- **Tests and spec in the same diff**: yes.
