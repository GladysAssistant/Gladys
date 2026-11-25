# Zigbee2mqtt installation in the background

> **Living specification — source of truth.** This document specifies how Gladys installs and updates
> the Zigbee2mqtt and MQTT broker containers: the `installation` and `prefetch` of the status, the
> `zigbee2mqtt.install-progress` WebSocket message, the setup and prefetch routes and their 409, the
> installation job, the image downloads, the update at start-up, the USB dongle: its stable path,
> its check on save and its watch (K), the setup wizard of a first installation (M) and the dashboard
> of a configured one (N). **Rule: any PR that changes one of these behaviors or contracts modifies
> this file in the same diff.**
>
> Status: **implemented** (PR #3351; USB dongle, K: PR #3395; setup wizard, M, stop / start /
> restart, E.4, and dashboard, N: PR #3402).

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

| Field        | Type                                                 | Meaning                                                  |
| ------------ | ---------------------------------------------------- | -------------------------------------------------------- |
| `state`      | `idle` \| `running` \| `done` \| `failed`            | `INSTALLATION_STATE`                                     |
| `kind`       | `install` \| `switch` \| `update` \| `start` \| null | `INSTALLATION_KIND`, `null` when idle (B.1)              |
| `phases`     | `[{ key, state, progress }]`                         | the five phases, in order (B.2); `[]` when idle          |
| `progress`   | integer 0–100                                        | weighted progress of the phases (B.2)                    |
| `error`      | `{ code, message }` \| null                          | why it failed (B.4)                                      |
| `durationMs` | number \| null                                       | from its start to its outcome; `null` while idle/running |

### B.1 Kinds

| Kind      | Launched by                                                                                          | When                                                                                                                                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `switch`  | `POST /setup`                                                                                        | a coordinator is stored and the setup saves another one. The coordinator is the URL in network mode, the USB dongle otherwise (its port and its link are the same dongle, K.2): a change of mode is a switch |
| `install` | `POST /setup`                                                                                        | any other setup: first one, the same coordinator saved again after a failure, another setting changed                                                                                                        |
| `update`  | an init outside an installation (start of the service, `POST /connect`, the watch of the dongle K.3) | a container of ours exists whose stored version (`DOCKER_MQTT_VERSION`, `DOCKER_Z2M_VERSION`) is set and differs from `DEFAULT` (G)                                                                          |
| `start`   | `POST /run/start`                                                                                    | the user starts Zigbee2mqtt again after a stop (E.4): an init as at the start of Gladys (not in setup mode), an update waiting for its images (G) runs then                                                  |

Only `install`, `switch` and `start` run in a job (E.2).

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

| Route               | Access        | Behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /setup`       | admin         | validates (400), 409 when busy, 400 `DONGLE_NOT_FOUND` when its USB dongle is not plugged in (K.2), starts the installation (`install` or `switch`), saves the variables (the dongle by its stable path, K.1), launches the job without waiting and answers the saved setup (as `GET /setup`). A failed save fails the installation and the request. A switch between the local broker and an external one erases the settings of the other mode that the setup does not send: the coordinator (adapter mode, dongle, network coordinator) for an external broker, the broker URL, the credentials of Gladys and the interface URL for the local one, which init generates again (limits in L) |
| `POST /prefetch`    | admin         | starts the prefetch (C) and answers it once the disk space is checked. Never refused: a running or done prefetch is answered as is, and the downloads are shared with an installation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `POST /connect`     | authenticated | 409 when busy, then runs init inside the request (L); may start an `update` (G)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `POST /disconnect`  | authenticated | 409 when busy, then disables the integration                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `POST /run/stop`    | admin         | 409 when busy; stops Zigbee2mqtt until it is started again (E.4). Under `run/`: `POST /start` and `POST /stop` are the routes of the core that start and stop the service (Settings > Services), which a route of the integration, registered first, would hide                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `POST /run/start`   | admin         | 409 when busy (an init running included, before `configured` is known), 400 when nothing is set up (`configured` false); forgets the stop and launches a `start` installation without waiting (E.4)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `POST /run/restart` | admin         | 409 when busy, 400 when stopped; restarts it, or starts it again (`start`) when Gladys has no client of the broker or a container of ours is missing (E.4)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `POST /reset`       | admin         | 409 when busy, then resets the integration                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `POST /mqtt/start`  | authenticated | 409 when busy; 400 while stopped by the user (E.4), or when the MQTT accounts were never generated (no setup saved)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `POST /z2m/start`   | authenticated | 409 when busy; 400 while stopped by the user (E.4), or when no coordinator of the adapter mode is configured                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `GET /status`       | authenticated | carries `installation` and `prefetch`, and `z2mVersion` / `deviceCount` (E.3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `GET /adapter`      | authenticated | the coordinator models, each with how the wizard shows it (E.3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `POST /permit_join` | authenticated | body `{ value }` (boolean, optional): `true` allows new devices to join for 254 s, `false` forbids it, no value toggles (from what Zigbee2mqtt last told; the front always sends a value); another value → 400; without a connection to the broker (not installed, disabled) → 400 `SERVICE_NOT_CONFIGURED`; Zigbee2mqtt not answering the health check → 400 `ZIGBEE2MQTT_NOT_ANSWERING`. Only publishes the request (`{ value, time }`: Zigbee2mqtt 1 needs `value`, 2 reads `time`): what Zigbee2mqtt answers (`bridge/response/permit_join`, `bridge/info`) is broadcast as `zigbee2mqtt.permit-join`, never the request itself                                                                              |

### E.2 Job

`service-zigbee2mqtt-install` (`JOB_TYPES.SERVICE_ZIGBEE2MQTT_INSTALL`, in Settings > Tasks), whose
body is `runInstallation(jobId)`: `init(true)` then `waitForZigbee2mqtt()`. Its progress is
`installation.progress`, updated only when it changes. It succeeds when Zigbee2mqtt answers, or with
an external broker as soon as Gladys is connected to it, and fails with the error of the
installation. A job that fails to start fails the installation with its error. An `update` has no job.

### E.3 For the wizard and the dashboard

- **Status.** `setupPending` tells a first setup not finished (M.1): set by a `POST /setup` saved while
  nothing was configured (variable `Z2M_SETUP_PENDING`), cleared once Zigbee2mqtt answers the health
  check and by `reset`; read by init. `stopped` and `stoppedAt` tell a stop of the user (E.4); `updatePending` tells an update
  waiting for its images (G); `serviceStarted` tells the service started: set by its start, cleared by
  its stop (even when a container could not be removed), false while Gladys has not started it yet and
  once it is stopped in Settings > Services, the only place that starts it. Until it is set,
  `POST /setup`, `/connect`, `/mqtt/start`, `/z2m/start`, `/run/start` and `/run/restart` are refused
  (400): they would run Zigbee2mqtt with the service saved stopped, which Gladys does not start again;
  the wizard and the dashboard send the user to Settings > Services instead. A start of the service while an
  init runs (Settings > Services while Gladys starts its services, the service shown not running yet)
  starts no second one. `configured` tells that a USB
  dongle or a network coordinator is saved, or the broker of a Zigbee2mqtt that runs elsewhere
  (`utils/isConfigured.js`): set by init from the saved configuration, by `POST /setup` once its
  variables are saved, false after `reset`; kept by `disconnect` (a disabled installation, a service
  stopped in the settings, is still configured); `null` (unknown) until init checked Docker and read
  the configuration: at the start of Gladys until the service starts, during an init, and as long as a
  service stopped before Gladys started is not started. The other tabs tell from it that Zigbee2mqtt
  is not installed (M.4), only when it is `false`.
  `z2mVersion` is the `version` of the last `bridge/info` when it is one as Zigbee2mqtt publishes it
  (`2.6.1`, `2.6.1-dev`), `null` otherwise: anyone who can publish on the broker writes it (the
  wizard shows it as a text anyway, never as markup). `deviceCount` is the number of
  devices of the last `bridge/devices` (unsupported ones included, the coordinator excluded); `null`
  until Zigbee2mqtt tells them, and again after init (the Zigbee2mqtt it connects to tells them
  again), `disconnect` or `reset`. `networkModeValid` is true only once init checked the host
  network of Docker: with an external broker, a machine where Gladys cannot install Zigbee2mqtt is
  still told. `bridge/info` also tells whether joining is permitted (Zigbee2mqtt 2 publishes it
  again when joining closes, and has no other message for it): a change sends
  `zigbee2mqtt.permit-join` (`{ allowed, remainingSeconds }`, [zigbee2mqtt-pairing.md](./zigbee2mqtt-pairing.md),
  B). A change of `deviceCount`
  sends a status; `bridge/info` sends one anyway (coordinator firmware).
- **Coordinator models** (`adapters/display.js`). `GET /adapter` gives each model of the list
  (`{ label, configKey }`, the label being what the setup stores) its `brand` (every model has one:
  the wizard groups them by brand), `displayName` (commercial name, the label when there is none),
  `modelCode` (printed on the dongle), `image` (name of its photo on
  `https://www.zigbee2mqtt.io/images/devices/<image>.png`, checked to exist, or `null`) and `aliases`
  (searched words). Each label is listed once: a model listed by two drivers (SLZB-Ultima, SMHUB)
  keeps the first, the one `configureContainer` installs it with. A `(legacy ezsp)` model is shown as its base model. `GET /usb/port` does not
  change: the front finds the recognized `adapter` of a port in this list by its label.

### E.4 Stop, start and restart (dashboard)

- **Stop** (`stop.js`). Remembered in the variable `Z2M_STOPPED` (its date, `stoppedAt`), saved first:
  Gladys disconnects from the broker (nightly backup, watch of the dongle, health check and last
  installation stopped too, as `disconnect` does), then our containers get the restart policy `no`
  (Docker starts a container of policy `always` again when the machine restarts, even stopped by
  hand) and are stopped, Zigbee2mqtt first, and **kept**. From the disconnection, whatever happens to
  the containers next, Gladys no longer tells Zigbee2mqtt answering nor starting, joining is told
  closed (`zigbee2mqtt.permit-join`), and the logs of the run it stops are ignored (`z2mRun`, below).
  A container that Docker cannot look up fails the stop (it may still run); a refused restart policy
  is only logged. With an external broker (the saved mode), Gladys only disconnects: containers of
  ours left by a former local installation (L) are neither stopped nor given another policy. While `Z2M_STOPPED` exists, init (start of
  Gladys, Settings > Services) starts and watches nothing: it ends once it knows the platform,
  `stopped: true`; `POST /z2m/start` and `POST /mqtt/start` are refused (400), and a command to a
  device (`setValue`) is refused (400 `SERVICE_NOT_CONFIGURED`) as long as Gladys has no client of the
  broker.
- **Start** (`start.js`). Refused while busy (an init included), then when nothing is set up
  (`configured` false). Forgets the stop (variable destroyed, then `stopped` false at once; restart
  policy `always` again, best effort, Docker failing to list the containers included; not with an
  external broker) and runs a `start` installation (B.1), followed on the page; a setup saved while
  stopped forgets the stop too. Reset destroys the variable.
- **Restart** (`restart.js`). Restarts the Zigbee2mqtt container through `restartZ2mContainer`, the
  same code as an installation: the starting window (`zigbee2mqttStarting`, 2 min) and the logs of
  the new run (0.2). The broker is restarted first when Gladys is not connected to it. Once Docker
  restarted it, the failure retried is forgotten (`z2mContainerError`, a failed installation): the
  dashboard shows the new run starting, and its logs tell their own error. A restart that Docker
  refuses changes nothing: the failure stays, and the starting window is closed at once. Without a
  client of the broker (the last init failed before connecting), restarting the containers would not
  connect Gladys again, and a container missing (the Zigbee2mqtt one, or the broker while Gladys is
  not connected to it: removed by a change of dongle whose installation failed, or by hand) cannot be
  restarted: the restart is a start (an installation `start`) instead, whose init creates what is
  missing.
- **Runs** (`z2mRun`). Counted by each restart of the container, before Docker stops the previous
  run, and by a stop: a reader of the logs of an older run (0.2), which ends with it, writes nothing,
  so the error of a run replaced or stopped never shows on the new one or on a stopped Zigbee2mqtt.
- **Without Docker** (an external broker only). Our containers are looked for through
  `utils/findOwnZ2mContainer.js`: on a machine where Gladys does not run in Docker there is none, so a
  stop only disconnects, a start or a reset (`disconnect`) go on without containers, and a restart is
  a start (no container) instead of failing on `SYSTEM_NOT_RUNNING_DOCKER`.

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
   ones and the update is tried again on the next start; `updatePending` tells it (E.3), until an init
   downloads the images. An `update` ends `failed` at once, the
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

| Caller                                                                                                         | While an installation runs                        | While an operation runs               |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------- |
| `POST /setup`, `/connect`, `/disconnect`, `/reset`, `/mqtt/start`, `/z2m/start`, `/stop`, `/start`, `/restart` | 409                                               | 409                                   |
| `POST /prefetch`                                                                                               | accepted                                          | accepted                              |
| start of the service (Gladys start, Settings > Services)                                                       | does nothing: the installation starts Zigbee2mqtt | runs init (shared route, not refused) |
| stop of the service (Settings > Services)                                                                      | waits for its end                                 | waits for their end                   |
| update at start-up                                                                                             | not started: the installation follows this init   | —                                     |

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

`front/src/routes/integration/all/zigbee2mqtt/setup-page/index.js` reads the status, then the
configuration, and shows the wizard of M when nothing is configured, else the dashboard of N. It
holds what both screens share:

- **Freshness.** A status or a progress message received while a request runs is more recent than
  its answer (a missing dongle, an installation and its prefetch included); only the answer of the
  last load or save of the configuration is applied. The configuration is read after the status: a
  status that tells the end of an installation comes with the configuration saved by it.
- **End of an installation.** The configuration is read again (port of the interface, generated MQTT
  accounts), and the 409 warnings of a save or a reset go: the installation that refused them is
  over. An installation that the page followed until `done` ends with a success alert by kind and its
  `durationMs` ("Zigbee2MQTT installed in 23 s"), until the page is left, the installation is
  cleared or another action of the dashboard runs (N.2); one already ended when the page opened is
  not told.
- **Refusals.** A 409 on save tells that an installation already runs. On the reset, only a refusal of
  `refuseWhileInstalling` (its message ends with "while an installation is running" or "while the
  integration is busy", I) says that the integration is busy, to try again once it ends; another 409,
  like a container of the user carrying our name, shows the generic error. A status that cannot be
  read shows an error instead of the page.
- **Prefetch trigger** (reached from the wizard only: a configured installation never prefetches).
  `POST /prefetch` is sent on the first local-mode choice, a USB dongle selected (a detected dongle
  that the wizard preselects counts) or a network coordinator URL entered, and only while nothing is
  configured yet, the server runs in Docker with the host network (`dockerBased`,
  `networkModeValid`) and no installation runs. The external broker mode never prefetches.
  `PrefetchStatus.jsx` shows its progress, its end or the disk space warning, until something is
  configured or an installation starts.
- **ezsp fallback.** A status that turns `ezspFallback` on reads the configuration again: Gladys saved
  the `(legacy ezsp)` model.

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
  found or not; replaced by the next init; stopped, its timer cleared, by disconnect, reset and a stop of the user (E.4), which no init arms again until the user starts Zigbee2mqtt.
- **State.** `dongleMissing` (the status); `dongleLost`, held by the watch: the dongle was found
  missing, or the watch was armed by a start of the watch, and Zigbee2mqtt has not answered since; the starts made by
  the watch (count, end of the last one).
- **Events.** A check runs every 10 s. Each line is one transition, tested in
  `watchDongle.test.js` / `init.test.js`; "—" leaves the value as it is.

  | Event                                                                   | `dongleMissing` | `dongleLost`                       | Starts    | Zigbee2mqtt                             |
  | ----------------------------------------------------------------------- | --------------- | ---------------------------------- | --------- | --------------------------------------- |
  | Init, dongle found                                                      | false           | false; true when the watch runs it | —         | started by init                         |
  | Init, dongle not found                                                  | true            | true                               | forgotten | not started                             |
  | Check, Zigbee2mqtt answers (ports not listed)                           | false           | false                              | forgotten | —                                       |
  | Check, an installation or an operation runs (I)                         | —               | —                                  | —         | left to it                              |
  | Check, dongle not found, or not the same dongle                         | true            | true                               | forgotten | —                                       |
  | Check, found; container `running`, `restarting`, ...                    | false           | —                                  | —         | left to Docker and the health check     |
  | Check, found; container `exited` / `dead` by hand (`State.Error` empty) | false           | —                                  | —         | left stopped                            |
  | Check, found; container of the user carrying our name                   | false           | —                                  | —         | left to init, which tells about it      |
  | Check, found; container `exited` / `dead` with `State.Error`            | false           | —                                  | +1        | init, when the spacing allows           |
  | Check, found; container none or `created`, the dongle lost              | false           | —                                  | +1        | init, when the spacing allows           |
  | Check, found; container none or `created`, the dongle not lost          | false           | —                                  | —         | left to the installation that failed    |
  | Check, what it read outdated once read                                  | —               | —                                  | —         | —                                       |
  | Start by the watch fails before init watched again                      | —               | true                               | —         | watch armed again, same path and dongle |
  | Start by the watch fails after init watched again                       | —               | true (the watch of that init)      | —         | tried again, when the spacing allows    |

- **Outdated read.** What a check reads (the ports, then the container) is dropped when, once read,
  the watch was replaced or stopped, an installation or an operation started, or Zigbee2mqtt
  answered: no missing dongle told from ports listed before Zigbee2mqtt answered, no start of a
  Zigbee2mqtt that answers.
- **Failed start.** Docker fills `State.Error` when it fails to start a container ("error gathering
  device information" for a missing device) and clears it on each successful start: a container
  stopped by hand, the dongle flashed from the host for instance, stays stopped, as Docker leaves it.
  A start of Gladys starts it all the same.
- **Same dongle.** Stored by its link, or not found by init, any device at the stored path is the
  dongle. On a stored port (`/dev/ttyUSBx`), which another USB-serial adapter takes once the dongle is
  unplugged: the device with the `pnpId` init found there; when init did not recognize that device as
  a dongle of the configured driver family (another adapter held the port at the start of Gladys), a
  device recognized as such is the dongle too. A second dongle of the same family that takes the port
  of a dongle init recognized is not.
- **Dongle lost.** A container missing or never started, the dongle lost, is the init that did not
  start Zigbee2mqtt without its dongle, or a start by the watch that failed half-way (a container
  removed and not created again); the dongle not lost, an installation that failed for another reason
  (a download that stalls), left as it is instead of being run again. Each init run by the watch
  arms its own watch with the dongle lost, or the watch is armed again lost when that init fails
  before watching; nothing sets it on a watch already armed, so a Zigbee2mqtt that answered meanwhile
  is not taken for lost.
- **Spacing.** The first start is at once, then 30 s, 1, 2 and 5 min after the end of the previous
  one, then none until the starts are forgotten (dongle not found by a check or by init, Zigbee2mqtt
  answers, disable): an unplugged dongle plugged back starts Zigbee2mqtt at once, even between two
  checks where it was never seen missing. "Given up" is logged once, by the check that still finds a
  start needed after the last one. An init run by the watch may start an `update` (G).
- **`status.dongleMissing`**, also in `zigbee2mqtt.status-change`: true only when an init or the
  watch did not find the dongle, never with an external broker; the status is sent when it changes.

## L. Out of scope / follow-ups

- **`POST /connect`** (enable switch of the API, no longer used by the page) still runs init inside the
  request; the page starts Zigbee2mqtt with `POST /run/start` (E.4).
- **Gladys connects to the broker only once the containers are in place**: during the download of an
  update, the Zigbee network runs but Gladys does not receive its messages yet.
- **A switch between the local broker and an external one** (B, `POST /setup`) erases the settings
  of the other mode, but leaves the containers: back to the local broker, a broker container created
  by an earlier local installation keeps its former accounts and refuses the ones init generates
  (`BAD_CREDENTIALS` until a reset); switched to an external broker, the local containers keep
  running.

## M. Setup wizard (first installation)

`setup-page/wizard/` (findings A1 to A3, D1 and X7 of the audit; design `design-lot1.md` of the
revamp). One container, two presentations (as `docs/specs/mobile-pages/README.md` B): `Wizard.jsx`
holds the state, the requests and the decisions and builds one view; `WizardDesktop.jsx` and
`WizardMobile.jsx` show it. Crossing the phone breakpoint keeps what was chosen.

### M.1 When

The page shows the wizard when its configuration, once loaded, has no USB dongle, no network
coordinator and no external broker (`isConfigured`). The choice is made once (`wizard` in
`setup-page/index.js`): the wizard saves the configuration on its second step and stays until the user
leaves it ("Later", "Finish"), for the dashboard (N); a reset chooses the
wizard again. A first installation not finished (`setupPending`, E.3: saved, Zigbee2mqtt never
answered) opens the wizard again when the page loads, even with a configuration: on step ② when the
status follows an installation (running, failed with its Retry, done and waiting for an external
Zigbee2mqtt), "Retry" saving the saved setup again (without the port of the interface); on step ①
with the saved choice filled in when nothing is followed any more (Gladys restarted since). Not once
the user stopped it (`stopped`): the dashboard tells it stopped. An external Zigbee2mqtt older than
1.21, which never answers the health check, keeps the wizard on its waiting screen, which tells to
update it. Leaving it
("Later"…) shows the dashboard until the next load. An installation set up before keeps the
dashboard: only a setup saved while nothing was configured sets `setupPending`. The dashboard reuses
step ① to change the dongle (N.3).

### M.2 Steps

Four steps: ① the dongle, ② the installation, ③ the network ready, ④ the first device (with an
external broker: connection, check, network, first device).

| Screen                | When                                                                                                                                                                                                                                                                                                                                                         | Way forward                                                                                                                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One dongle recognized | one port with a recognized `adapter` (`GET /usb/port`)                                                                                                                                                                                                                                                                                                       | Install                                                                                                                                                                                                                                                                                                    |
| Several               | two or more recognized, each with its port (two dongles of the same model)                                                                                                                                                                                                                                                                                   | Install, once one is chosen (none preselected)                                                                                                                                                                                                                                                             |
| Not recognized        | USB devices (`pnpId`), none recognized: the only one is preselected                                                                                                                                                                                                                                                                                          | Install, once a model is chosen                                                                                                                                                                                                                                                                            |
| No dongle             | no USB device; ports listed again every 3 s (an unchanged list is not set again), a dongle plugged in shows up with "just plugged in"                                                                                                                                                                                                                        | —                                                                                                                                                                                                                                                                                                          |
| By hand               | port (USB devices, every serial port on demand) and model, started from the detected dongle                                                                                                                                                                                                                                                                  | Install                                                                                                                                                                                                                                                                                                    |
| Network coordinator   | URL, and the type by chip: `ember`, `zstack`, `deconz`                                                                                                                                                                                                                                                                                                       | Install                                                                                                                                                                                                                                                                                                    |
| External Zigbee2mqtt  | broker URL, user, password, interface URL (optional)                                                                                                                                                                                                                                                                                                         | Connect                                                                                                                                                                                                                                                                                                    |
| Not installable       | `dockerBased` or `networkModeValid` false: the title and the steps are those of an external broker (connection, check…), the ports are not listed, nor listed again                                                                                                                                                                                          | Use my Zigbee2mqtt (external) only                                                                                                                                                                                                                                                                         |
| Service not started   | `serviceStarted` false (E.3): Gladys has not started it yet, or it was stopped in Settings > Services; the server refuses the setup until then                                                                                                                                                                                                               | Open Settings > Services                                                                                                                                                                                                                                                                                   |
| Status unknown        | the status not read yet (a loader), not readable (the error of the page) until a status message tells it, or `configured` `null`: init has not read the configuration, Docker not checked yet (a loader)                                                                                                                                                     | —                                                                                                                                                                                                                                                                                                          |
| ② running             | the installation of the status, phases of B.2 (external broker: `connect_adapter` only); "you can leave this page" (not on a failure nor while waiting)                                                                                                                                                                                                      | —                                                                                                                                                                                                                                                                                                          |
| ② failed              | a short title by error code (B.4), a text of the wizard (no Save button in it; `ADAPTER_NO_RESPONSE`: unplug the dongle, or restart the network coordinator, as chosen), the raw message folded (shown in clear for `INVALID_CONFIGURATION`, the refused settings); step ② of the stepper marked failed (large screens), the ring smaller on a phone         | Retry (same configuration, with the `(legacy ezsp)` model or the `ezsp` type Gladys switched to) · Change the dongle or model (back to ①, by hand, with what was chosen)                                                                                                                                   |
| ② waiting             | external broker: Gladys connected to it (the installation `done`), Zigbee2mqtt not answering yet: check that it runs and that its base topic is `zigbee2mqtt`, or, when its `bridge/info` tells a version older than 1.21 (no health check), that it is too old; the broker lost meanwhile (Gladys disconnected from it), with its error; follows the status | Change the connection                                                                                                                                                                                                                                                                                      |
| ③ ready               | the installation `done` (local), or Zigbee2mqtt answering (`zigbee2mqttConnected`, also once a failure is cleared); kept once shown                                                                                                                                                                                                                          | Pair my first device · Later                                                                                                                                                                                                                                                                               |
| ④ first device        | the pairing window ([zigbee2mqtt-pairing.md](./zigbee2mqtt-pairing.md), D), which asks for joining as the step opens: countdown, tips while no device joined, one row per device, a ready one added from there                                                                                                                                              | Finish                                                                                                                                                                                                                                                                                                     |

- **Models** (0.3b): the list of `GET /adapter` (E.3) without the `(legacy ezsp)` ones, grouped by
  brand, each by its commercial name, model code and photo (zigbee2mqtt.io, an icon without
  Internet). The search, ignoring case, accents and punctuation, keeps the models whose model
  code or one of whose aliases it is ("skyconnect": the SkyConnect and the Connect ZBT-1), or, from
  4 characters with a digit or a dash, whose model code starts or ends with it or whose name ends
  with it ("dongle-p": ZBDongle-P, not the Dongle Plus-E; "slzb-06": every SLZB-06; "mg24"); else
  the whole text found in one of their names or aliases ("sonoff e", "conbee"), or else each of its
  words. The model chosen is recalled above the list ("Selected model"), whose scroll area opens on it
  (large screens; on a phone the list has none).
- **Install** saves the configuration (`POST /setup`, the USB dongle by its `stablePath`, no port of
  the interface: the installation chooses it). Refused (400 `DONGLE_NOT_FOUND`, 409 busy, another 400):
  the wizard stays on ①, says why, nothing is saved.
- **The previous installation.** Until a new installation shows up in the status, the one it holds
  is the previous one (a failure, before Retry or a change of dongle): the wizard compares the status
  with the installation it saw when Install was clicked, and shows ② starting meanwhile; it forgets
  it as soon as the status shows another installation (the idle installation of a first one comes
  back when a failure is cleared).
- **Prefetch** (C, J): asked once a coordinator is chosen (a dongle Gladys preselects counts, a
  network URL entered), never for an external broker nor before the server tells that it can install
  (`dockerBased`, `networkModeValid`); its progress and the disk space warning show above Install,
  which stays enabled.
- ③ sums up the driver (the `configKey` of the saved model, `ezsp` after a fallback, with a notice),
  the coordinator firmware (`coordinatorFirmware.revision`) and the duration; with an external
  broker, the broker, `z2mVersion` and `deviceCount`.

### M.3 On a phone

A focus page (mobile-pages C.1): its navigation bar back to the integrations, "Step 1 of 4" above a
segmented bar, one decision per screen, the way forward in the bottom bar (two actions one above the
other after ①; none while waiting for a dongle or while the installation runs; the change of
connection while an external broker waits for Zigbee2mqtt; "Finish" at ④), where a refused setup is
told, with a close button; a refused joining is told under the header of the pairing window. The detected dongle shows in large; the other
choices (by hand, network coordinator, existing Zigbee2mqtt) open in a sheet, so does the port of a
dongle chosen by hand; the models are rows with photos, without a scroll area of their own; "Back"
in the bottom bar returns to the detected dongle. The installation turns a ring around the dongle,
its phases folded under it. No leave guard: nothing is lost, the installation goes on without the page.

### M.4 Not installed, elsewhere

The Devices and Discover tabs tell "Zigbee2mqtt is not installed" with a button to the setup tab when
the status says `configured: false` (E.3), instead of the messages of a Zigbee2mqtt that does not
answer; that banner only (not the warning about the interface URL), and "Pair a device" of the
Discover tab disabled. Stopped by the user (`stopped`, E.4), they tell that Zigbee2mqtt is stopped, with the link to
the setup tab where it is started, instead of blaming the broker that Gladys left on purpose.

### M.5 Tests

Cypress, `front/cypress/e2e/routes/integration/zigbee2mqtt/setup/`: `Zigbee2MqttWizard.cy.js` (every
screen of M.2, the payloads, the previous installation hidden on Retry and forgotten once cleared,
the refusals, the ezsp fallback and its Retry, the external broker waiting for Zigbee2mqtt, step ④
showing the pairing window, the status not readable, the downloads in the background; the window
itself in `Zigbee2MqttPairing.cy.js`), the reset to the
wizard in `Zigbee2MqttDashboardSettings.cy.js` and `Zigbee2MqttWizardMobile.cy.js` (`iphone-x`: the focus
page, the bottom bar, the sheets, the breakpoint crossed), fixtures in `wizardFixtures.js`;
`Zigbee2MqttStatus.cy.js` for the not-installed banner.

## N. Dashboard (configured installation)

`setup-page/dashboard/` (findings 1.9 and 1.10 of the audit; design `design-lot1.md` of the revamp):
the state of Zigbee2mqtt and the action to take, its coordinator, the actions, and the rare settings on
a screen of their own. `dashboardState.js` decides from the status and the configuration;
`Dashboard.jsx` holds the screen and the requests; the cards only show. It replaces the page of the
previous versions (enable switch, mode cards, configuration form), removed.

### N.1 State

The status card shows the first state that applies:

| State           | When                                                                                                                                                                                                                                                                                            | Primary action                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `installing`    | `installation.state` is `running`: title by kind (B.1), bar, current phase (B.2)                                                                                                                                                                                                                | —                                                                                 |
| `inactive`      | `serviceStarted` false (E.3): Gladys has not started the service yet (it starts its services one after the other), or it was stopped in Settings > Services, which removes the containers; before a stop of the user                                                                            | Open Settings > Services, the only place that starts it (no start button here)    |
| `pending`       | started, but `configured` null: init has not read the configuration yet (what it tells, a stop or a failure, is not known meanwhile), or failed before: "if it stays so, check the service in Settings > Services"                                                                              | —                                                                                 |
| `stopping`      | the request of a stop runs: the server tells `stopped` before its containers are stopped (about 10 s)                                                                                                                                                                                           | —                                                                                 |
| `stopped`       | `stopped` (E.4): "since <stoppedAt>, it does not start again with Gladys"; with an external broker, "disconnected from your Zigbee2MQTT", which keeps running                                                                                                                                   | Start (with an external broker: Connect)                                          |
| `dongleMissing` | `dongleMissing` (K.3): Zigbee2mqtt starts again once it is plugged back, on any port                                                                                                                                                                                                            | —                                                                                 |
| `failed`        | the error of the last installation if it failed, else `z2mContainerError`; none once Zigbee2mqtt answers                                                                                                                                                                                        | Restart and "Change the dongle or model" (N.3), none with an external broker      |
| `mqttError`     | Gladys not connected to the broker, with `mqttConnectionError` (explained by code, else the raw message; a code without a text of its own too); with an external broker, whenever Gladys is not connected to it (after `stopped`), the error of the last installation when the client told none | Restart; with an external broker, "Change the connection" (the advanced settings) |
| `online`        | `zigbee2mqttConnected` (with an external broker too): the number of devices (`deviceCount`)                                                                                                                                                                                                     | Pair a device                                                                     |
| `starting`      | `zigbee2mqttStarting` (2 min after a start or a restart)                                                                                                                                                                                                                                        | —                                                                                 |
| `notAnswering`  | none of the above: Gladys gets no answer from Zigbee2mqtt; with an external broker, Gladys connected to it but Zigbee2mqtt not answering, as the wizard waits for it (M.2): what to check, and a version older than 1.21 told                                                                   | Restart (none with an external broker)                                            |

- **Devices to add.** Online, a link to the Discover tab counts the devices of the network not added
  to Gladys (`GET /discovered` with `filter_existing: false`, those without `id`), counted again on
  each `zigbee2mqtt.discover` message and read again when Zigbee2mqtt answers again; only the answer
  of the last request counts, and a message is more recent than a request still running. "No device in
  the network" for none.
- **Pair** opens the pairing window on a screen of its own ([zigbee2mqtt-pairing.md](./zigbee2mqtt-pairing.md),
  D), which asks for joining as it opens; Close leads back to the dashboard, joining going on by
  itself. Step ④ of the wizard shows the same window.
- **A status that cannot be read** shows an error instead of a state guessed from an empty status.
- **Alerts.** An update waiting for its images (`updatePending`, G), the ezsp driver note (the saved
  model runs the `ezsp` driver, after a fallback), the success of an installation followed (J), not
  with an external broker, where nothing is installed (its state tells the connection).

### N.2 Actions

- **Tiles**: Restart (Gladys runs the containers; not without the dongle, Zigbee2mqtt starts again once
  it is plugged back, nor when it is already the primary action), Stop (not "Disconnect" from an
  external broker Gladys is not connected to), and the Zigbee2mqtt interface once its URL is known; none while an
  installation runs, during a stop, once stopped, or while the service is not started or its
  configuration not read yet (`inactive`, `pending`); once stopped, Stop again while a container of
  ours still runs (Docker refused to stop it), until Gladys restarts (its init, stopped, no longer looks at the containers). In local
  mode, the interface is hidden until its port is saved: the first installation that succeeds chooses
  it, the default `8080` would be wrong meanwhile. "Change" is disabled while an installation runs,
  while init has not read the configuration (`configured` null: step ① needs what it tells) and
  while the service is not started, as the saves of the advanced settings (the server refuses them, E.3).
- **Stop** asks for a confirmation (Zigbee2mqtt stays stopped, Gladys restart included, until it is
  started again; given up when the user goes to another screen or the state changes), then sends
  `POST /run/stop`. With an external broker it is "Disconnect": only Gladys disconnects, the words of
  the tile, of the confirmation and of the stopped state say that Zigbee2MQTT keeps running. **Start**
  sends `POST /run/start`, **Restart** `POST /run/restart` (E.4). The status sent by the server tells
  the outcome: the page does not guess it. An action hides the success of the last installation, told again for the next one.
- **Refusals.** A 409 (`refuseWhileInstalling`, I) tells that an installation runs or the integration
  is busy, until the installation that refused the action ends or the state of Zigbee2mqtt changes
  (an operation, which runs no installation, refused it); another error says that Gladys could not do
  it. A stop that fails keeps its confirmation open.

### N.3 Coordinator and change of dongle

- **The card** shows the dongle by its photo, commercial name and model code (E.3), or the network
  coordinator by its URL; its driver (`configKey` of the saved model, or the network type; "ezsp"
  with its note), the coordinator firmware (`coordinatorFirmware.revision`) and `z2mVersion`. With an
  external broker: the broker URL, `z2mVersion` and `deviceCount`, no change.
- **Change** (disabled while an installation runs) opens step ① of the wizard (M.2) in change mode:
  no steps, the saved dongle marked "current", a warning when the chosen coordinator runs another
  driver family (Silicon Labs `ember` / `ezsp`, Texas Instruments `zstack`, `deconz`: a new network,
  devices to pair again), "Use this dongle" and "Cancel". "Use this dongle" saves as the wizard does
  (`POST /setup`, refusals told on ①, never the refusal of a save made before ① opened), without the
  port of the interface, which keeps its stored value; once saved, the dashboard follows the
  installation (`switch` for another coordinator, `install` for another model of the same dongle).
  Cancel goes back without saving. From an external broker, a local installation is reached through
  the reset (N.4), which opens the wizard again.

### N.4 Advanced settings

A screen of its own, back to the dashboard by "Configuration":

- **Interface port** (local mode): a number from 1 to 65535, saved alone (`POST /setup` with
  `Z2M_TCP_PORT` only: a variable missing from the setup keeps its stored value), which installs again
  with the new port (Zigbee2mqtt restarted, its container kept). A setup writes the port of Gladys over
  the one of the Zigbee2mqtt configuration file; a start of Gladys keeps the port of the file (set
  before Gladys saved one, or changed by hand). The port saved by the end of an installation replaces
  the field unless the user is typing another one. Link to the interface once the port is saved. The
  interface is enabled when the file does not say (`frontend.enabled: true`, without which
  Zigbee2mqtt 2 does not serve it); an `enabled: false` set by hand is kept, and the other settings of
  `frontend` too. An installation written before gets it at the next start of Gladys, Zigbee2mqtt
  restarted once.
- **Interface password** (local mode, always on): an init that installs Zigbee2mqtt generates it when
  Gladys has none (20 characters, as the MQTT accounts), and `configureContainer` writes it as
  `frontend.auth_token`; `Z2M_FRONTEND_AUTH_TOKEN` saves it once the file is read, before Zigbee2mqtt
  restarts with it (not before: the file may hold another one). A password written by hand in the file
  wins, and Gladys keeps it at its next start; a reference to another file (`'!secret.yaml auth_token'`)
  is left as is, and Gladys knows no password then. A reference is told as Zigbee2mqtt tells it
  (`parseValueRef` of its settings, `/!(.*) (.*)/`): a "!" followed further by a space, so that a
  password written by hand such as `!MyPassw0rd` stays a password. An installation without one gets it at the next start
  of Gladys, Zigbee2mqtt restarted once (`auth_token` needs a restart). `GET /setup` gives it
  (`Z2M_FRONTEND_AUTH_TOKEN`, never saved by `POST /setup`); the links to the interface (dashboard,
  advanced settings, device and Discover pages, where the page of a device follows the query:
  `?token=…#/device/…`) carry it as `?token=`, which the interface of Zigbee2mqtt 2 (Windfront) reads to
  open without asking for it, except the first time it opens in a browser: Windfront reads `?token=` only
  once a first refusal told it that the interface asks for a password, so it shows its login screen, and
  opens at once when the page is reloaded. Said next to the link of the dashboard (under the tiles, on the
  row of the interface on a phone): reload the page, or copy the password from the advanced settings. The
  password in the address of the links shows in the status bar of the browser and stays in its history:
  accepted for an interface of the local network (the only one Gladys links with its password). The
  advanced settings show it under the label "Interface password" (apart from the one of the MQTT access),
  revealed for 5 s and copied in one click, by the Clipboard API on HTTPS and by the selection of the
  browser (`document.execCommand('copy')`) on the plain-HTTP local address, the value selected at once for a
  copy by hand; a copy the browser refuses reveals it, until hidden again; "Copied" is announced
  (`aria-live`). With these words, for that first time and for an interface opened outside Gladys (a
  bookmark, another device); without a link to the interface (Gladys Plus, no port yet), it only says to
  paste it. With a reference to another file, the screen says nothing of the password: Gladys does not
  tell it from no password yet (the variable is erased in both cases), and the user who wrote the reference
  knows where the password is. An external Zigbee2mqtt is not touched: its interface URL may carry `?token=`
  itself. Erased by the reset.
- **External broker**: its form, as the wizard words and orders it (URL, user and password, interface
  URL), "Save" as the primary button and "Cancel" (back to the saved values) once something changed;
  saved the same way, with the payload of the wizard on every screen size (URL trimmed, an empty user,
  password or interface URL sent `null`, which erases it); a field the user did not change follows a
  configuration saved meanwhile (the end of an installation). Going back to the dashboard with a port
  or a broker not saved asks first, on a large screen as on a phone (save and leave, leave without
  saving, keep editing).
- **MQTT access** for other applications (local mode), the state of each component (Gladys connected
  to the broker, the broker, Zigbee2mqtt answering).
- **Reset** of the integration, once confirmed (J for its refusals); the wizard follows. With an
  external broker, its words say that it forgets the connection, not the Zigbee2mqtt that runs
  elsewhere nor its network.
- A save refused here is told here (409: an installation already runs; 400 `DONGLE_NOT_FOUND`: the
  dongle is not plugged in, nothing saved; another error), not a refusal of the wizard.

### N.5 On a phone

Below 992 px the cards of a large screen stack in one column, state first. **Below 768 px** (the phone
breakpoint of `docs/specs/mobile-pages/README.md`, B) the dashboard is a list page of the mobile kit
(`DashboardMobile.jsx`, `AdvancedSettingsMobile.jsx`), with the same view and actions as the large
screen layout (`Dashboard.jsx` and `AdvancedSettings.jsx` keep the state and the requests):

- **Main screen**: the state as the first row of a group (its tile tinted by state, the devices to add
  as a row to the Discover tab), the progress of an installation, the alerts as notices, the primary
  action as a full-width button (with "Change the dongle or model" on a failure); then the coordinator
  as rows (its facts as values, "Change the dongle" as a row); then Restart, Stop and the interface
  (opened in another tab, with the words about its password as the subtitle of its row, N.4) as rows; then
  "Advanced settings". **Stop and Restart are confirmed in a
  sheet** (mobile-pages C.5: nothing restarted on a single tap; the primary Restart of a failure is not,
  nothing runs to interrupt).
- **Advanced settings**: a focus page, back to "Configuration" from its navigation bar; the port, or
  the fields of the external broker (the password with its reveal button), saved from the bottom bar
  shown once something differs, where a refused save is told; the state of each component as pills;
  the password of the interface as a row, revealed for 5 s and copied in one tap (also on plain HTTP; revealed
  when the browser refuses the copy), its words apart from the row below; the MQTT access as
  rows, each value copied in one tap and the password revealed for 5 s; the reset
  as a red row confirmed in a sheet. Leaving with something not saved, by the navigation bar or the
  system "back", asks first (save and leave, leave without saving, keep editing).
- **Change of dongle**: the focus page of the wizard (M.3), its navigation bar back to "Configuration"
  instead of the integrations, without "Step 1 of 4".

### N.6 Tests

Cypress, `front/cypress/e2e/routes/integration/zigbee2mqtt/setup/`: `Zigbee2MqttDashboard.cy.js` (each
state, the devices to add, the actions and their refusals, the installations followed),
`Zigbee2MqttDashboardSettings.cy.js` (change of dongle, advanced settings, external broker, reset) and
`Zigbee2MqttDashboardMobile.cy.js` (`iphone-x`: the rows, the confirmations in sheets, the advanced
settings saved from the bottom bar and their leave guard), fixtures in `dashboardFixtures.js`.
