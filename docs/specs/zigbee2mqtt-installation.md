# Zigbee2mqtt installation in the background

> **Living specification — source of truth.** This document specifies how Gladys installs and updates
> the Zigbee2mqtt and MQTT broker containers: the `installation` and `prefetch` of the status, the
> `zigbee2mqtt.install-progress` WebSocket message, the setup and prefetch routes and their 409, the
> installation job, the image downloads, the update at start-up, and the USB dongle: its stable path,
> its check on save and its watch (K). **Rule: any PR that changes one of these behaviors or contracts
> modifies this file in the same diff.**
>
> Status: **implemented** (PR #3351; USB dongle, K: PR #3395). The setup wizard and the
> Zigbee2mqtt dashboard of the next PRs build on sections B to F and K.

## A. Context

`POST /api/v1/service/zigbee2mqtt/setup` used to run the whole installation inside the request: the
two images downloaded one after the other, then the broker created, started, given its accounts with
`mosquitto_passwd` run inside it and restarted, with 10 s of fixed waits. The request answered at the
end only: through Gladys Plus, a first installation on a Raspberry Pi outlasted the gateway timeout,
and the user got an error while the installation went on, with no progress shown. An image update at
start-up removed the running containers before downloading the new images: no Zigbee during the
download, and none until the next start when the download failed.

Now (findings D1, X1–X4 of the
[Zigbee2mqtt audit](https://community.gladysassistant.com/t/zigbee2mqtt-un-audit-pour-devenir-plus-simple-que-home-assistant/11498)):
the setup answers at once and the installation
runs in a job, followed through the status and a WebSocket message; both images download in
parallel, possibly before the setup is saved; the broker starts once, already configured; an update
downloads before it removes anything and keeps the running containers when the download fails.

## B. `status.installation`

`GET /api/v1/service/zigbee2mqtt/status` and the `zigbee2mqtt.status-change` message carry two new
fields, `installation` and `prefetch` (C). An installation follows one init up to the first answer
of Zigbee2mqtt. It lives in memory only: `idle` after a restart of Gladys (`getIdleInstallation()`).

| Field        | Type                                      | Meaning                                                  |
| ------------ | ----------------------------------------- | -------------------------------------------------------- |
| `state`      | `idle` \| `running` \| `done` \| `failed` | `INSTALLATION_STATE`                                     |
| `kind`       | `install` \| `switch` \| `update` \| null | `INSTALLATION_KIND`, `null` when idle (B.1)              |
| `phases`     | `[{ key, state, progress }]`              | the five phases, in order (B.2); `[]` when idle          |
| `progress`   | integer 0–100                             | weighted progress of the phases (B.2)                    |
| `error`      | `{ code, message }` \| null               | why it failed (B.4)                                      |
| `durationMs` | number \| null                            | from its start to its outcome; `null` while idle/running |

### B.1 Kinds

| Kind      | Launched by                                                                                          | When                                                                                                                                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `switch`  | `POST /setup`                                                                                        | a coordinator is stored and the setup saves another one. The coordinator is the URL in network mode, the USB dongle otherwise (its port and its link are the same dongle, K.2): a change of mode is a switch |
| `install` | `POST /setup`                                                                                        | any other setup: first one, the same coordinator saved again after a failure, another setting changed                                                                                                        |
| `update`  | an init outside an installation (start of the service, `POST /connect`, the watch of the dongle K.3) | a container of ours exists whose stored version (`DOCKER_MQTT_VERSION`, `DOCKER_Z2M_VERSION`) is set and differs from `DEFAULT` (G)                                                                          |

Only `install` and `switch` run in a job (E.2).

### B.2 Phases and progress

| Key (`INSTALLATION_PHASE`) | Weight | `running`                                          | `done`                                          | `skipped`                                 |
| -------------------------- | ------ | -------------------------------------------------- | ----------------------------------------------- | ----------------------------------------- |
| `pull_z2m`                 | 50     | the Zigbee2mqtt image downloads (phase `progress`) | downloaded                                      | image on the machine, or container kept   |
| `pull_mqtt`                | 10     | the broker image downloads (phase `progress`)      | downloaded                                      | image on the machine, or container kept   |
| `start_mqtt`               | 10     | the broker container is created or started         | the broker answers (H)                          | the broker already runs                   |
| `start_z2m`                | 10     | the Zigbee2mqtt container is created or restarted  | Docker restarted it                             | it runs and its configuration is the same |
| `connect_adapter`          | 20     | waiting for Zigbee2mqtt to answer the health check | it answered (external broker: Gladys connected) | —                                         |

Phase states (`INSTALLATION_PHASE_STATE`): `pending`, `running`, `done`, `skipped`, `failed`.

- Only the downloads move a phase `progress` between 0 and 100: each layer counts for its size, half
  for its download, half for its extraction (`utils/getPullProgress.js`). `done` and `skipped` set it
  to 100. It never goes backwards.
- `installation.progress = floor(Σ weight × phase.progress / 100)`, never lower than its last value.
- `skipped` only applies to a `pending` phase: a phase run again (ezsp fallback) keeps its state.
- Success: `pending` phases become `skipped`, `running` ones `done` (a broker slow to answer during an
  update), `progress` 100.
- Failure: the `running` phases become `failed`, unless a download already failed on its own (F): the
  other running phases then go back to `pending`, as the other download ends unfollowed.
- Outside an installation, phase updates are ignored (an init at start-up with nothing to follow).

### B.3 Lifecycle

`startInstallation(kind)` sets `running` with every phase `pending`, and throws `ConflictError` when
one already runs. `finishInstallation(error)` sets `done` or `failed` and `durationMs`, and resolves
`installationEnd`, which the stop of the service waits for (I). Each step logs its duration
(download, creation, start, broker ready, first answer of Zigbee2mqtt, whole installation).

| Event                                                      | `done`         | `failed`       |
| ---------------------------------------------------------- | -------------- | -------------- |
| next installation                                          | replaced       | replaced       |
| Zigbee2mqtt answers the health check (`handleMqttMessage`) | kept           | cleared → idle |
| integration disabled (`disconnect`) or reset               | cleared → idle | cleared → idle |
| restart of Gladys                                          | idle           | idle           |

A failure stops describing Zigbee2mqtt once it answers (restarted by Docker, slower than the window,
update postponed with the old containers running). `clearInstallation()` also forgets the job.

### B.4 Error

`error` is `{ code, message }`: a known `code` with `message: null`, or `code: null` with the raw
message. The setup page translates the code.

| `code`                                                                                         | When                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NO_ANSWER`                                                                                    | Zigbee2mqtt did not answer within its startup window (`zigbee2mqttStartingTimeoutInMs`, 2 min) and its logs told nothing. An ezsp fallback restarts it and opens a new window              |
| `DONGLE_NOT_FOUND`                                                                             | local broker and no usable coordinator (the configured USB dongle is not plugged in): nothing is started, the installation fails at once. `POST /setup` refuses such a dongle before (K.2) |
| `NOT_ENOUGH_DISK_SPACE`                                                                        | a missing image does not fit in the free disk space (F)                                                                                                                                    |
| `EZSP_PROTOCOL_VERSION`, `ADAPTER_UNREACHABLE`, `ADAPTER_NO_RESPONSE`, `INVALID_CONFIGURATION` | the logs of the new run of Zigbee2mqtt tell why it does not start (`readZ2mContainerLogs`, #3334); `code: null` with the last logged error otherwise                                       |
| `BAD_CREDENTIALS`, `NOT_AUTHORIZED`, `BROKER_UNREACHABLE`                                      | `MQTT_CONNECTION_ERROR`: the broker refuses Gladys; with an external broker, also out of reach, or Gladys not connected to it by the end of the window                                     |
| `SYSTEM_NOT_RUNNING_DOCKER`, `DOCKER_BAD_NETWORK`                                              | local broker, Gladys not in Docker or not on the host network (`PlatformNotCompatible`)                                                                                                    |
| `null`                                                                                         | anything else, with its message: Docker error, a container name taken by a container that is not ours, broker silent for 30 s (H), stalled download (F), failed save                       |

`INSTALLATION_ERROR` holds the first three, the codes without a source of their own.

## C. `status.prefetch`

The download of the missing images before the setup is saved, so that the installation does not wait
for them. In memory only (`getIdlePrefetch()`).

| Field         | Type                                      | Meaning                                                                                                       |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `state`       | `idle` \| `running` \| `done` \| `failed` | same values as the installation                                                                               |
| `progress`    | integer 0–100                             | the downloads of the missing images, each weighted by `IMAGE_SIZE_IN_BYTES`; never backwards                  |
| `freeBytes`   | number \| null                            | available bytes of `/` in the Gladys container (`df`); `null` before the check or without `df`                |
| `neededBytes` | number \| null                            | sizes of the missing images + `DISK_SPACE_MARGIN_IN_BYTES`; `0` when none is missing; `null` before the check |
| `error`       | `{ code, message }` \| null               | as in B.4: `NOT_ENOUGH_DISK_SPACE`, or the error of a download                                                |

`startPrefetch()`:

1. `running` or `done`: returned as is. `idle` or `failed`: starts again, `running` at once, so that
   a call meanwhile starts nothing.
2. Checks in parallel which images are on the machine and the free disk space.
3. None missing: `done`. Free space known and below `neededBytes`: `failed` with
   `NOT_ENOUGH_DISK_SPACE`, nothing downloaded. Otherwise `pullMissingImages()` runs in the
   background, then sets `done` or `failed`.
4. Resolves with the prefetch once step 3 is decided, without waiting for the downloads.

A reset sets a `done` or `failed` prefetch back to `idle`; a running one goes on.

## D. WebSocket message `zigbee2mqtt.install-progress`

`WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.INSTALL_PROGRESS`, sent with `EVENTS.WEBSOCKET.SEND_ALL`: to
every connected user, and through Gladys Plus. Payload `{ installation, prefetch }`, as in B and C.

Pace (`events/emitInstallProgress.js`):

- At most one message every 500 ms. A call within the interval schedules one send at its end, with
  the state of that time: the last state is always sent.
- Only when `{ installation, prefetch }` changed since the last message sent: a pull reports many
  events that change nothing visible.
- Disconnect and reset cancel the timer of a waiting message and send it at once, when it changed: no
  timer outlives the integration.
- The installation job follows `installation.progress` at the same pace (E.2).

`zigbee2mqtt.status-change` carries both fields too, as part of the status. A client that reads the
status over HTTP keeps the `installation` and `prefetch` of a message received during the request.

## E. Routes and job

### E.1 Routes

Under `/api/v1/service/zigbee2mqtt/`. A refusal answers 409 with the generic body of Gladys,
`{ status: 409, code: 'CONFLICT', error }`, whose message tells which (`refuseWhileInstalling`, I):
`cannot <action> while an installation is running`, or
`cannot <action> while the integration is busy`.

| Route              | Access        | Behavior                                                                                                                                                                                                                                                                                                                                            |
| ------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /setup`      | admin         | validates (400), 409 when busy, 400 `DONGLE_NOT_FOUND` when its USB dongle is not plugged in (K.2), starts the installation (`install` or `switch`), saves the variables (the dongle by its stable path, K.1), launches the job without waiting and answers the saved setup (as `GET /setup`). A failed save fails the installation and the request |
| `POST /prefetch`   | admin         | starts the prefetch (C) and answers it once the disk space is checked. Never refused: a running or done prefetch is answered as is, and the downloads are shared with an installation                                                                                                                                                               |
| `POST /connect`    | authenticated | 409 when busy, then runs init inside the request (L); may start an `update` (G)                                                                                                                                                                                                                                                                     |
| `POST /disconnect` | authenticated | 409 when busy, then disables the integration                                                                                                                                                                                                                                                                                                        |
| `POST /reset`      | admin         | 409 when busy, then resets the integration                                                                                                                                                                                                                                                                                                          |
| `POST /mqtt/start` | authenticated | 409 when busy; 400 when the MQTT accounts were never generated (no setup saved)                                                                                                                                                                                                                                                                     |
| `POST /z2m/start`  | authenticated | 409 when busy; 400 when no coordinator of the adapter mode is configured                                                                                                                                                                                                                                                                            |
| `GET /status`      | authenticated | carries `installation` and `prefetch`                                                                                                                                                                                                                                                                                                               |

### E.2 Job

`service-zigbee2mqtt-install` (`JOB_TYPES.SERVICE_ZIGBEE2MQTT_INSTALL`, in Settings > Tasks), whose
body is `runInstallation(jobId)`: `init(true)` then `waitForZigbee2mqtt()`. Its progress is
`installation.progress`, updated only when it changes. It succeeds when Zigbee2mqtt answers, or with
an external broker as soon as Gladys is connected to it, and fails with the error of the
installation. A job that fails to start fails the installation with its error. An `update` has no job.

## F. Image downloads

`IMAGES` lists the image of each container descriptor (`koenkk/zigbee2mqtt:2.14.2`,
`eclipse-mosquitto:2.0.15`). `pullImage(image)`:

- **Present: nothing to do.** Checked first (`system.imageExists`), so that no registry is needed:
  an installation whose images are there works offline.
- **One download per image.** The installation and the prefetch wait for the same download, and both
  follow its progress (phase `pull_*`, `prefetch.progress`).
- **Disk check before each download**, not only by the prefetch: refused with
  `NOT_ENOUGH_DISK_SPACE` when the available space is below `IMAGE_SIZE_IN_BYTES[image]` +
  `DISK_SPACE_MARGIN_IN_BYTES` (500 MB kept for the databases of Gladys). Downloaded anyway when the
  free space is unknown (no `df`). The space is measured on the disk of the Gladys container, not
  always the one where Docker stores its images.
- **Other versions removed when the space lacks.** Before refusing, the other tags of the same
  repository (`koenkk/zigbee2mqtt:*`, `eclipse-mosquitto:*`, compared without the Docker Hub
  prefixes `docker.io/` and `library/` that a runtime may add) are removed with
  `system.removeImage`, never forced, then the space is measured again: Gladys kept the image of
  every earlier version. An image that a container uses, running or stopped (the version in place,
  a container of the user), stays: Docker declines to remove it, or only removes one of its tags
  when it has several. Best effort: a failure to list or remove leaves the refusal as it was. An unused image of these repositories pulled by the user goes too. The
  prefetch only measures (C): its warning stays, the installation removes them as it downloads. Its
  warning gives the figures only when they show the lack of space (not when the disk filled up
  during the download).
- **Disk filled during the download.** A download that fails on Docker's `no space left on device`
  fails with `NOT_ENOUGH_DISK_SPACE`, like the check.
- **Stall timeout.** Given up after 5 min without progress; an event that repeats the same position
  (containerd image store) is no progress.
- Its phase is `done` on success, `failed` on failure.

`pullMissingImages(failures)` downloads `IMAGES` in parallel and rejects at the first failure, the
other download going on. The error of each failed download is written in the table it is given. Only
init gives one, its own (`imagePullFailures`), forgotten when it ends: during that init, a container
to create fails at once on the kept error instead of downloading again; a download that fails after
init ended, or a failed prefetch, leaves nothing for a later call, which downloads again.

`IMAGE_SIZE_IN_BYTES` gives the size on disk (layers extracted, `docker image ls`) of each image of
`IMAGES`: measured again when a descriptor changes its image.

## G. Update at start-up

An init with a usable coordinator (which forces the local broker) runs, in order:

1. **Update or not.** When no installation runs, an `update` starts if a container of ours exists
   whose stored version is set and differs from `DEFAULT`. A container without a stored version was
   left by a first installation that failed: recreated, but not shown as an update. Checked again
   just before starting, a setup having maybe started an installation meanwhile.
2. **Download first.** `pullMissingImages()`, the running containers keeping on meanwhile.
3. **Failed download.** `checkForContainerUpdates()` is skipped: the stored versions stay the old
   ones and the update is tried again on the next start. An `update` ends `failed` at once, the
   containers in place are kept and Gladys connects to them. In an installation launched by the
   setup, the failed pull phases go back to `pending` and the installation goes on: a container to
   create fails on the kept error, a container in place is kept. Either way, `configureContainer`
   then writes the `configuration.yaml` of the new code for the old image: it must stay compatible
   with the previous image, or be skipped when the new images are not downloaded (to decide at the
   next bump that changes both the image and the configuration format, like 1.x to 2.x).
4. **Replace.** `checkForContainerUpdates()` removes the outdated containers (the broker with its
   anonymous volumes), stores the new versions and returns the images of the removed containers.
5. **Install.** Broker then Zigbee2mqtt (H); Gladys connects once the broker runs. Then the images of
   the replaced containers are removed (`system.removeImage`, never forced): Docker declines when a
   container still uses one, the new container of a version that kept the same image, or a container
   of the user. Best effort: never fails the update. The configuration is then saved.
6. **Outcome.** An `update` is then followed without blocking the start of the service: `done` when
   Zigbee2mqtt answers, `failed` otherwise.

A container recreated for another reason, a new coordinator or a changed adapter type, gets its
image before the old container is stopped and removed: a missing image fails the installation with
the old container still in place. The same USB dongle under a new path is not a new coordinator: its
container is kept without the image (K.1). On a changed adapter type, whose configuration is already
written, the container in place is restarted first, so that it runs the new adapter on its image.

## H. MQTT broker

- **Accounts saved first.** In local mode, init generates the missing accounts (`gladys` and `z2m`,
  20 random characters) and the default URL, and saves them before the broker is created: saved at
  the end of init only, they were lost when the installation failed after the broker was created,
  which then refused every later try (`BAD_CREDENTIALS`).
- **Written hashed before the first start.** On creation only, `mosquitto.conf` and
  `mosquitto.passwd` are written in `<base path>/zigbee2mqtt/mqtt`, both accounts hashed in Node in
  the Mosquitto 2 format (`$7$101$<salt>$<hash>`, PBKDF2-SHA512, `utils/hashMosquittoPassword.js`).
  The container is created, then started once: no `mosquitto_passwd` exec, no restart, no fixed
  wait. An existing broker is neither recreated nor given a new password file. `mosquitto.passwd`
  is readable by its owner only (`0600`, set again over the file of a replaced broker): the
  entrypoint of the image gives the folder to the `mosquitto` user as it starts (`chown`).
- **Ready when it answers.** `waitForBroker` tries an MQTT connection every 250 ms (2 s per attempt)
  for up to 30 s; any answer, even a refusal of the credentials, means ready. Without one, an
  `install` or a `switch` fails on `start_mqtt`; at start-up or during an update, Gladys goes on and
  its MQTT client connects later.
- No fixed wait after a restart of Zigbee2mqtt either.
- Removing the broker container (disable, reset, update) also removes its anonymous volumes
  (`/mosquitto/data`, `/mosquitto/log`, unused: the broker persists in its configuration folder).

## I. Concurrency

The integration is busy while an installation is `running` or `runningOperations > 0`: the count of
inits, disconnects, resets (which run a disconnect) and ezsp fallbacks in progress, each counted
from its first line.

| Caller                                                                          | While an installation runs                        | While an operation runs               |
| ------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------- |
| `POST /setup`, `/connect`, `/disconnect`, `/reset`, `/mqtt/start`, `/z2m/start` | 409                                               | 409                                   |
| `POST /prefetch`                                                                | accepted                                          | accepted                              |
| start of the service (Gladys start, Settings > Services)                        | does nothing: the installation starts Zigbee2mqtt | runs init (shared route, not refused) |
| stop of the service (Settings > Services)                                       | waits for its end                                 | waits for their end                   |
| update at start-up                                                              | not started: the installation follows this init   | —                                     |

- `refuseWhileInstalling` refuses with a message that ends with `while an installation is running`
  or `while the integration is busy`: the setup page reads these endings (J).
- `refuseWhileInstalling` is called with no `await` between the check and what it guards
  (`startInstallation`, or the operation that counts itself): two requests cannot both pass.
  `startInstallation` refuses a second running installation as a last guard.
- The stop waits for `installationEnd`, and for `runningOperations` to reach 0 (checked every 250 ms),
  both checked again after each wait: a setup can start another installation, and the init of an
  update whose download failed goes on after its installation ended. A second stop waits for the
  first. Then it disconnects.
- The logs of a replaced installation (another coordinator saved meanwhile) are ignored: they neither
  fail the running installation nor trigger an ezsp fallback.

## J. Setup page (consumer)

`front/src/routes/integration/all/zigbee2mqtt/setup-page/`, temporary on purpose (the wizard of the
next PR replaces it):

- `InstallationProgress.jsx`, while `running` or `failed`: title by kind, bar, current phase (the
  next pending one between two), "you can leave this page"; on failure, the failed phase and its
  error, which the `z2mContainerError` / `mqttConnectionError` alerts of the page then do not
  repeat (an error of the status that differs is still shown). A failure is hidden once
  `zigbee2mqttConnected`. An installation that the page followed until `done` ends with a success
  alert by kind and its `durationMs` ("Zigbee2MQTT installed in 23 s"), until the page is left or
  the installation is cleared.
- The controls are disabled while an installation runs. In local mode, the link to the Zigbee2mqtt
  interface is hidden until its port is saved: the first installation that succeeds chooses it (an
  existing installation keeps its port), the default `8080` would be wrong meanwhile. A 409 on save
  shows that an installation runs or the integration is busy. On the enable switch or the reset,
  only a refusal of `refuseWhileInstalling` (its message ends with "while an installation is
  running" or "while the integration is busy", I) says that the integration is busy, to try again
  once it ends; another 409, like a container of the user carrying our name, shows the generic
  error. These warnings go at the end of an installation, when the configuration is read again
  (port of the interface, generated accounts).
- **Prefetch trigger.** `POST /prefetch` is sent on the first local-mode choice, a USB dongle
  selected (a detected dongle that the page preselects counts) or a network coordinator URL entered,
  and only while nothing is configured yet, the server runs in Docker with the host network
  (`dockerBased`, `networkModeValid`) and no installation runs. The external broker mode never
  prefetches. `PrefetchStatus.jsx` shows its progress, its end or the disk space warning next to the
  save button, until something is configured or an installation starts.
- **USB ports.** While the local form is shown in USB mode, `GET /usb/port` is asked again every 3 s,
  30 s after a failure (only the answer of the last request is kept, none once the form is gone; an
  unchanged list changes nothing; skipped while a list asked by hand loads, while the page is hidden
  or while the form is disabled): a dongle plugged in shows up without a click, and the only recognized one is
  chosen when no dongle is. A port is offered by its `stablePath` (K.1); the stored dongle, by its
  port or its link, is selected, and choosing it again keeps its model. The 400 `DONGLE_NOT_FOUND`
  of a save tells that the dongle is not plugged in and that nothing was saved. `dongleMissing`
  (K.3) shows that the dongle cannot be found, that Zigbee2mqtt starts again once it is plugged
  back, and to choose it again when it is already plugged into another port.

## K. USB dongle

USB mode only; a network coordinator is neither checked nor watched (findings C5, C6, X7, X10 of the
audit).

### K.1 Stable path

- `GET /usb/port` gives each serial port its `stablePath`: its `/dev/serial/by-id/<pnpId>` link when
  the link is on the disk of Gladys and no other port carries the same `pnpId` (identical adapters
  without serial number share one name, and udev points its single link at one of them), its `path`
  otherwise (serial port of the machine, GPIO or HAT dongle, `/dev` not shared). `path` is unchanged.
- Docker resolves a `PathOnHost` link each time it starts the container: a dongle that moves to
  another port (another USB-serial adapter plugged in, a restart) is found again. `PathInContainer`
  and the `serial.port` of `configuration.yaml` stay `/dev/ttyACM0`.
- The stored dongle is found among the ports listed (`findConfiguredPort`): the port at its path,
  the port whose `pnpId` is the name of its link, or else the only port with the same serial number
  (8 characters or more) and the same interface (`-ifNN[-portN]`): a link renamed. When several
  ports carry the name of the link (an identical adapter plugged in after the link was stored), the
  port the link leads to, which Docker uses; none when the link cannot be read.
- **Migration, at each init.** A dongle stored by its port moves to its link when its USB fingerprint
  is the only dongle plugged in of the configured driver family (ember and ezsp count as one); a
  dongle found by its serial number moves to its new link. The variable is saved and the container
  created again on the new path, data kept (about 16 s of downtime, once). Left on its port: a dongle
  not recognized, of another family, or next to a second dongle of the same family (another
  USB-serial adapter, or that dongle, may have taken its number at this start).
- The same dongle under a new path is not a new coordinator (G): without the image to create the
  container again (an update postponed), the container in place keeps running when both paths lead
  to the same device, its restart policy set to `always` as for any container kept (K.3 relies on
  it), and a later init creates it again.
- Going back to a version without this section: it does not know the link, sees the dongle as
  detached and does not connect to the broker (Zigbee2mqtt keeps running); saving the dongle again
  on its setup page fixes it.

### K.2 Check on save

`POST /setup` in USB mode with the local broker: the dongle given by the setup, or the stored one
when the setup gives none, must be plugged in (with none at all, which the setup page never sends,
the same), else
`400 { status: 400, code: 'BAD_REQUEST', message: 'DONGLE_NOT_FOUND' }`: nothing is saved nor
started, a configuration that works stays in place. Checked after a first 409 check and before the
second one (I). A dongle chosen by its port is saved by its `stablePath`; the stored dongle saved
again under its link is not a `switch` (B.1). Without the `usb` service (its native module failed
to load): 400 `SERVICE_NOT_CONFIGURED`. The stored path sent back as is follows the rule of the
migration (K.1): a port that another USB-serial adapter may have taken at this start, or a link
already stored, is kept; the ports are listed once. The `DONGLE_NOT_FOUND` of the installation (B.4) is left to
an init.

### K.3 Watch

Zigbee2mqtt stops when its dongle is unplugged. Docker starts a crashed container again by itself
(restart policy `always`), but not when the start itself fails: the device of the dongle is missing,
and the container stays `exited`, even once the dongle is plugged back.

- **Lifecycle.** Armed by each init once it checked the dongle (USB mode, broker not external),
  found or not; replaced by the next init; stopped, its timer cleared, by disconnect and reset. A
  check in progress when it stops, or when an operation starts, has no effect.
- **Every 10 s**, unless an installation or an operation runs (I):

  | Zigbee2mqtt answers | Dongle     | Zigbee2mqtt container                            | Then                                                        |
  | ------------------- | ---------- | ------------------------------------------------ | ----------------------------------------------------------- |
  | yes                 | not listed | —                                                | `dongleMissing` false, starts forgotten                     |
  | no                  | not found  | —                                                | `dongleMissing` true, starts forgotten                      |
  | no                  | found      | `running`, `restarting`, ...                     | `dongleMissing` false; left to Docker and the health check  |
  | no                  | found      | `exited` or `dead` by hand (`State.Error` empty) | `dongleMissing` false; left stopped                         |
  | no                  | found      | of the user, carrying our name                   | `dongleMissing` false; left to init, which tells about it   |
  | no                  | found      | `exited` / `dead` with `State.Error`             | `dongleMissing` false; init, when the spacing allows        |
  | no                  | found      | none or `created`, the dongle lost               | `dongleMissing` false; init, when the spacing allows        |
  | no                  | found      | none or `created`, the dongle not lost           | `dongleMissing` false; left to the installation that failed |

- **Failed start.** Docker fills `State.Error` when it fails to start a container ("error gathering
  device information" for a missing device) and clears it on each successful start: a container
  stopped by hand, the dongle flashed from the host for instance, stays stopped, as Docker leaves it.
  A start of Gladys starts it all the same.
- **Same dongle.** Found by init on a stored port (`/dev/ttyUSBx`), the dongle is remembered by its
  `pnpId`: another USB-serial adapter that takes its port once it is unplugged counts as the dongle
  not found; a device recognized as a dongle of the configured driver family counts as the dongle
  all the same (init may have found another adapter on that port: the dongle unplugged, or plugged
  elsewhere, at the start of Gladys). Stored by its link, or not found by init, any device at the
  stored path counts.
- **Dongle lost.** The watch remembers that the dongle is lost: not found by the init that armed it
  or by one of its checks, or a start by the watch in progress (the watch of the init it runs keeps
  it, so that a start that failed after it watched, a container removed and not created again, is
  tried again). Forgotten once Zigbee2mqtt answers. A container missing or never started is then the
  init that did not start Zigbee2mqtt without its dongle, or a start that failed half-way; otherwise
  it is an installation that failed for another reason (a download that stalls), left as it is
  instead of being run again.
- **Spacing.** The first start is at once, then 30 s, 1, 2 and 5 min after the end of the previous
  one, then none until the starts are forgotten (dongle not found, Zigbee2mqtt answers, disable): an
  unplugged dongle plugged back starts Zigbee2mqtt at once, even between two checks where it was
  never seen missing. "Given up" is logged once, by the check that still finds a start needed after
  the last one. An init that fails before it watched again leaves the watch armed on the same path,
  the dongle lost. This init may start an `update` (G).
- **`status.dongleMissing`**, also in `zigbee2mqtt.status-change`: true only when an init or the
  watch did not find the dongle, never with an external broker; the status is sent when it changes.

## L. Out of scope / follow-ups

- **Update waiting.** A postponed update ends `failed`, cleared once Zigbee2mqtt answers: no visible
  "update waiting" status yet (dashboard PR).
- **`POST /connect`** (enable switch) still runs init inside the request.
- **Gladys connects to the broker only once the containers are in place**: during the download of an
  update, the Zigbee network runs but Gladys does not receive its messages yet.
- **A stop of Zigbee2mqtt that keeps the integration enabled** (dashboard PR): a clean stop, which the
  watch of the dongle leaves stopped (K.3); a stop remembered across a start of Gladys is to design.
- The setup wizard and the dashboard: next PRs.
