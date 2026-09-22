# Thermostat: weekly schedules, virtual or on a real thermostat

## Context

Gladys can already _read and command_ real thermostats (Netatmo, Matter, Zigbee, Z-Wave) through the `thermostat` device feature category. Two things are missing, and this integration fills both.

**It cannot _be_ the thermostat.** Turning a plain temperature sensor plus a plain switch — a relay, a smart plug, a boiler contact — into a regulated heating zone with a weekly programme is the most common French setup: an electric or hydronic heater driven by a contact, a separate sensor in the room, no branded thermostat anywhere. Today the answer is a hand-written scene per temperature threshold, with no schedule, no hysteresis and no anti-short-cycling.

**It cannot _programme_ the thermostats it already reads.** A Netatmo or a Zigbee thermostat regulates itself perfectly well, but nothing in Gladys drives its setpoint on a weekly schedule: the programme lives in the vendor's app, out of reach of scenes and of the rest of the house.

The two needs share everything except the last step. The schedule, the presets, the manual override, the widget and the window handling are the same; only the final act differs — Gladys either actuates a switch itself, or writes a setpoint onto a device that actuates its own. Hence one integration with **two device types**, `virtual` and `external`, and a single code path that branches once, at the end of the regulation pass.

## A. Device model

One device per heating zone, created by the integration. `THERMOSTAT_TYPE` says which of the two kinds it is; a device saved before the param existed has none, and is a virtual one — so **no migration is needed**.

### A.0 Virtual and external

A **virtual** thermostat carries four features, in the `DEVICE_FEATURE_CATEGORIES.THERMOSTAT` category, because Gladys _is_ the thermostat and its whole state has to live somewhere: `target-temperature`, `preset`, `mode` and `operating-state`. Section B is what each one carries and why.

A virtual thermostat is a thermostat, and must be indistinguishable from a Netatmo one to the rest of Gladys (scenes, MQTT, Gladys Plus, the device pages). One new **type** is introduced, `preset`, for a notion the branded integrations already have and could not express (B.2); no new category.

Every feature is resolved **by category and type**, never by `device.features[0]`: feature order is not a contract, and with four features an index would be a silent mis-target of the regulation loop.

An **external** thermostat carries **two features of its own, `preset` and `mode`** (B.3), and nothing else: its setpoint and its operating state belong to the real device. The setpoint is a feature of the real device — a Netatmo, a Zigbee TRV, a Matter thermostat, an MQTT climate entity — named by `THERMOSTAT_TARGET_FEATURE`. Creating a mirror feature here would give the house two setpoints that drift apart, and the whole point is that the real device stays the authority on its own state. The widget's `thermostat_feature` therefore names that **external** selector, and a client writing a setpoint writes it on the real feature, through the same generic route as anywhere else (D).

### A.0.1 What real thermostats actually expose

The design is constrained by what integrations publish today, which is much less than the core defines:

| Integration           | `target-temperature`                                       | `operating-state`                          | `mode` |
| --------------------- | ---------------------------------------------------------- | ------------------------------------------ | ------ |
| Netatmo               | yes                                                        | no — a boiler contact as `switch`/`binary` | no     |
| Zigbee2MQTT           | yes, **up to five** (heating/cooling, occupied/unoccupied) | no                                         | no     |
| Matter                | yes, **two** (heating, cooling)                            | no                                         | no     |
| MQTT / Home Assistant | yes, when the discovery declares it                        | no                                         | no     |

Three consequences, each of which is a rule the code follows:

- **No auto-discovery of the target.** A Matter or Zigbee device exposes several setpoints and only the user knows which one drives their heating, so the three selectors are picked by hand in the edit form, out of _every_ device in the house.
- **The state feature accepts two shapes.** `thermostat`/`operating-state` (0 idle / 1 heating / 2 cooling) _and_ a read-only `switch`/`binary` boiler contact. Accepting only the standard type would leave every thermostat available today with no heating indication at all. It also accepts **nothing**: the widget then shows the setpoint without a heating halo.
- **The mode feature is optional.** No integration produces one. Requiring it would make the feature unusable for everybody.

### A.0.2 No loops

The feature pickers exclude devices owned by this service. Pointing an external thermostat at a virtual one would make Gladys write its own setpoint back to itself, once a minute, for ever.

### A.1 Configuration lives on the device

Everything the control loop needs is a `THERMOSTAT_*` device param:

| Param                                              | Meaning                                                                                                                                                                           |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `THERMOSTAT_TYPE`                                  | `virtual` or `external`; absent means `virtual`                                                                                                                                   |
| `THERMOSTAT_TEMPERATURE_FEATURE`                   | the sensor the loop regulates on (virtual); displayed only (external)                                                                                                             |
| `THERMOSTAT_HUMIDITY_FEATURE`                      | optional, displayed only                                                                                                                                                          |
| `THERMOSTAT_SWITCH_FEATURE`                        | **virtual only** — the actuator the loop drives                                                                                                                                   |
| `THERMOSTAT_TARGET_FEATURE`                        | **external only** — the real device's setpoint, written by the loop. Required                                                                                                     |
| `THERMOSTAT_STATE_FEATURE`                         | **external only**, optional — `operating-state` or a binary boiler contact, read to show whether the equipment runs                                                               |
| `THERMOSTAT_MODE_FEATURE`                          | **external only**, optional — the real device's operating mode, if it has one                                                                                                     |
| `THERMOSTAT_WINDOW_FEATURE`                        | optional opening sensor; cuts the switch when open (virtual) or writes the frost setpoint (external) — whatever the mode, so a running air conditioner is suspended like a heater |
| `THERMOSTAT_MODE`                                  | `heating` or `cooling`                                                                                                                                                            |
| `THERMOSTAT_CONTROL_TYPE`                          | `hysteresis` or `tpi`                                                                                                                                                             |
| `THERMOSTAT_MIN_TEMP` / `_MAX_TEMP`                | bounds of the setpoint feature and of the widget dial                                                                                                                             |
| `THERMOSTAT_TEMP_UNIT`                             | `C` or `F`                                                                                                                                                                        |
| `THERMOSTAT_MANUAL_DURATION`                       | how long a manual hold lasts, in minutes, when it is not set to run until the next transition (E.3)                                                                               |
| `THERMOSTAT_MANUAL_SETPOINT` / `_MANUAL_UNTIL`     | the hold itself: the held setpoint and its expiry, absent when no hold is armed                                                                                                   |
| `THERMOSTAT_PRESET_*`                              | the five preset setpoints (`off` has no setpoint)                                                                                                                                 |
| `THERMOSTAT_HYSTERESIS_START` / `_STOP`            | hysteresis band, in degrees of **difference**                                                                                                                                     |
| `THERMOSTAT_TPI_CYCLE_TIME` / `_PROPORTIONAL_BAND` | TPI tuning, clamped by the regulation loop to 5-120 min and 0.5-10 degrees                                                                                                        |

Which schedule a thermostat follows is **not** in this list: it is a relation, held by `t_thermostat_schedule_device` (E.1).

`createDevice` accepts only this list plus, on a virtual thermostat, its four features; anything else in the request body is dropped rather than persisted. Every field the edit form offers is in that list: a field the filter dropped would silently need a second store, which is exactly what this section forbids.

On an external device `createDevice` keeps only the `preset` and `mode` features (B.3) and refuses a payload with no `THERMOSTAT_TARGET_FEATURE`: a thermostat with nothing to drive would sit in the integration page doing nothing, with no way to tell why. Switching a device back to `virtual` clears the three external params, so a stale selector can never keep driving a real thermostat.

The hysteresis, TPI and switch params are meaningless on an external device — the real thermostat runs its own heuristic — and the edit form hides them there rather than offering settings that do nothing.

The defaults for all of these live in `server/utils/thermostatConstants.js`, imported by the regulation loop, the widget and the edit form alike, so a device saved without a param is regulated exactly as the form displayed it.

### A.2 Runtime state is on the features

The current preset, the current mode and the heating state are the `last_value` of the features described in B — not variables, not a dashboard document, not a client-side store. There is exactly one `THERMOSTAT_*` service datum left that is neither configuration nor a feature: the manual hold and its expiry, kept as device params, because a hold is bookkeeping of this regulation loop and not a property of the equipment.

The previous revision kept all of it in `t_variable` under `THERMOSTAT_<FEATURE_KEY>_<SUFFIX>`, with the ownership check, the `postDelete` cleanup and the `/state/:variable_key` route that came with it. All of that goes: a feature is deleted with its device, and read by everything that reads devices.

**Not on the dashboard.** See `docs/specs/dashboard-flexible-layout-and-widgets.md` E2: the widget carries `thermostat_feature` and nothing else. A control loop that actuates real heaters must not read its settings from a per-user dashboard document.

## B. Presets and modes are features of the device

The integration exposes six presets — `schedule`, `frost`, `away`, `eco`, `night`, `comfort` — and `off`, which is **not** one of them but a mode.

### B.0 Why they are not variables

An earlier revision of this integration kept the current preset, its non-off fallback, and the manual hold in `t_variable`, under `THERMOSTAT_<FEATURE_KEY>_<SUFFIX>`. That was wrong on three counts, and all three are user-visible:

- **Scenes could neither read nor set a preset.** Only a numeric setpoint was expressible, and it became a 30-minute hold. "Everybody has left → Away" — the first automation anyone writes for heating — could not be written at all.
- **MQTT, HomeKit, Google and Alexa saw neither preset nor mode.** HomeKit renders a thermostat with no heating state; the others expose a bare number.
- **The widget rebuilt that state with four to five requests at mount**, because no single object carried it.

A preset is _state of the thermostat_, and state of a device belongs on a feature. So: **the preset and the mode are device features, and the current preset is the feature's `last_value`.** Everything that reads Gladys devices — scenes, the generic device API, MQTT, Gladys Plus, the connectors — gets them for free, and the widget reads one device.

The manual hold and its expiry stay service data — a device param, not a variable named after a selector. A hold is not a property of the equipment, it is bookkeeping of this regulation loop.

### B.1 Preset and mode compose, they do not compete

`THERMOSTAT_MODE` (`off` / `heating` / `cooling` / `auto`) already exists, and Matter, Zigbee and Z-Wave map onto it. A preset is not a competing spelling of it. The two answer different questions, and both are needed:

- **the mode says what the machine does** — off, heating, cooling, auto. It is a property of the equipment;
- **the preset says which temperature to aim for** — 7 °C frost, 16 °C away, 21 °C comfort. It is a property of the programme.

They compose: a thermostat in `heating` mode follows a weekly programme whose 07:00 point is `comfort`. This is the `hvac_mode` / `preset_mode` split of Home Assistant, the `system_mode` / `preset` split of Zigbee TRVs, and the Netatmo/Tado vocabulary — which is also, in French, the vocabulary of every heating programmer sold for forty years (_confort / éco / hors-gel_). It is what makes a weekly schedule expressible at all: "heating" is not something you can put in a time slot.

Two consequences follow from the split:

- **`off` is a mode, not a preset.** It says the machine stops, not which temperature to aim for, and `THERMOSTAT_MODE.OFF` already carries it. It is accepted in a schedule transition (E), where it is applied as a mode write, but it is not a value of the preset feature.
- **`schedule` is a preset.** It means "follow the weekly programme", the way `preset: auto` does on Zigbee2MQTT and `mode: schedule` on Netatmo. Writing any other preset on the feature takes the thermostat off its programme and arms a hold; writing `schedule` back hands it to the programme again.

### B.2 The new feature type

`DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET`, with the `THERMOSTAT_PRESET` enum:

| Value | Name       | Meaning                               |
| ----- | ---------- | ------------------------------------- |
| `0`   | `SCHEDULE` | follow the weekly programme           |
| `1`   | `FROST`    | frost protection, the lowest setpoint |
| `2`   | `AWAY`     | nobody home                           |
| `3`   | `ECO`      | reduced                               |
| `4`   | `NIGHT`    | night-time reduced                    |
| `5`   | `COMFORT`  | the normal occupied setpoint          |

It is a **Gladys-wide** type, documented in `docs/specs/device-feature-categories.md` alongside the rest of the thermostat category, not a private notion of this service: Netatmo, Tado and Overkiz all publish the same thing, and an integration that gains it later must not have to invent a second spelling. Per `device-feature-categories.md`, a device that supports only some of these values declares what it supports in `supported_options` rather than getting a narrower enum.

**The values are integers, not strings.** `device-feature-categories.md` scopes string values to the `text` / `select` type, for lists that only exist on the appliance itself — installed TV apps, HDMI sources — and states that a capability standards do cover keeps its own type with integer values; `normalizeSupportedOptions` rejects a string value on any other feature type outright. A preset is exactly such a capability: Zigbee TRVs and Home Assistant both define the set. So `THERMOSTAT_PRESET` is an integer enum like `THERMOSTAT_MODE` and `WATER_HEATER_MODE`, the state lives in `last_value`, and the labels come from the `deviceFeatureValue` translations in every locale file.

The values are **append-only**, for the reason `WATER_HEATER_MODE` gives: an integer already written into device states and hard-coded in users' scenes can never change meaning.

### B.3 What a virtual thermostat carries

A virtual thermostat therefore carries **four** features, not one:

| Type                 | Unit                     | Written by                                              | Read by                   |
| -------------------- | ------------------------ | ------------------------------------------------------- | ------------------------- |
| `target-temperature` | `celsius` / `fahrenheit` | the loop, the widget, scenes                            | everything                |
| `preset`             | —                        | the widget, scenes, the loop (on a schedule transition) | everything                |
| `mode`               | —                        | the widget, scenes                                      | everything                |
| `operating-state`    | —                        | the loop                                                | the widget's heating halo |

`operating-state` replaces the widget's inference from the switch state: a virtual thermostat knows whether it is currently heating, and saying so on a standard feature makes it visible to HomeKit and to the rest of the house, not only to this widget.

An **external** thermostat mirrors **none of the real device's features** (A.0): its setpoint and its operating state are features of the real device, and mirroring them here would give the house two sources that drift apart.

Two exceptions prove the rule, and both are Gladys's own state rather than the appliance's:

- its **`preset`** — no real thermostat publishes Gladys's preset vocabulary, and the preset is genuinely this integration's state, not the device's;
- its **`mode`**, which carries one decision: whether Gladys has stopped this thermostat. "Stopped by Gladys" is not something the appliance knows — an external thermostat that heats on its own is doing what it was built to do, and `THERMOSTAT_MODE.OFF` here is what tells the loop to stop writing to it and the widget to show it stopped. It is distinct from `THERMOSTAT_MODE_FEATURE`, which names the **real device's** mode on the real device, and which this service writes when one exists (C.0). A device may have both, one, or neither.

These two features, and no others, are what an external thermostat carries.

## C. Regulation loop

A single `setInterval` in the service ticks every 60 s and calls `applySchedules`, which regulates every thermostat device in parallel and isolates a failing device from the others.

**Order of decisions**, per device. Steps 1 to 3 are identical for both device types — that is the whole point of the design; only steps 4 and 5 differ.

1. **Window open** — if a window sensor is configured and reads `0`, the pass stops after suspending the heating: the switch is cut (virtual), or the device is stopped (external — `OFF` on its mode feature when it has one, then the frost-protection setpoint). A `NEW_STATE` listener applies the same cut immediately, without waiting for the next tick, and takes the **same external branch**: an external thermostat carries no switch and no local setpoint feature, so a listener that requires either skips it entirely and leaves the heating running until the next tick.
2. **Manual hold** — if a hold is armed and has not expired, the loop regulates on the held setpoint. On expiry it clears the hold, writes `schedule` back on the `preset` feature and falls through to the schedule.
3. **Target preset** — when the `preset` feature reads `schedule`, the last transition point at or before now (E.3); otherwise the preset the feature carries. A device following no schedule with the feature on `schedule` regulates on nothing.
4. **Setpoint** — on a virtual thermostat, saved on this service's own `target-temperature` feature when it changed, alongside `operating-state`. On an external one, **written onto the real device** through the core, which routes it to the owning integration, preceded by the **mode** when the device exposes one (section C.0).
5. **Switch** — **virtual only**, actuated only when its state differs from the computed one.

### C.0 An external thermostat stops at step 4

There is no step 5, and no hysteresis or TPI computation at all: the real thermostat runs its own heuristic off the setpoint it was given, and a second control loop would fight it. This is the entire difference between the two types.

Stopping has no setpoint of its own. On an external device it is expressed two ways at once, and which one the thermostat actually obeys depends on the device:

- **`THERMOSTAT_MODE.OFF` on `THERMOSTAT_MODE_FEATURE`**, when the real device exposes a mode. This is the actual stop, and it is written **first**. The setpoint alone leaves such a thermostat in `heating`: it stops aiming at 21 °C, but it fires again as soon as the room drops below 7 °C, and its own screen still reads "heating";
- then the **frost-protection setpoint**, always written — the fallback for a device with no mode feature, and the only way to say "stop heating" that every thermostat understands.

**The order matters in both directions.** Stopping writes the mode then the setpoint; starting writes the mode then the setpoint too. Writing the frost setpoint first to a thermostat still in `COOLING` asks it to cool the room to 7 °C until the mode write lands — and to keep doing so if that write fails on an expired token or the 5 s budget, which is the opposite of suspending it. Symmetrically, a device still switched off takes a new setpoint and does nothing with it. In both cases the mode goes first because the mode is what the machine obeys.

The mode is handed back to `heating` (or `cooling`, from `THERMOSTAT_MODE`) as soon as a heating preset takes over. The same applies to a manual setpoint, whether it comes from the widget dial, a scene or the device API. Like the setpoint, a mode write is skipped when the device already carries it, and clamped to the feature's `max`: a heating-only thermostat declares `max = 1` and would reject `COOLING`.

Three properties of that write, each one required by a different vendor:

- **Converted into the target feature's unit.** A thermostat configured in celsius pointing at a fahrenheit device would otherwise write `21` where the device reads 21 °F. MQTT/Home Assistant takes its unit from the discovery payload, so the mismatch is reachable in practice.
- **Clamped to the feature's own `min`/`max`.** Netatmo advertises 5-30, Zigbee 5-40, Matter -100-200. A value outside the range is rejected or silently clamped by the integration; clamping here is where it can be logged.
- **Skipped when the value already matches.** Several of these integrations call a cloud API on every write, and re-sending an unchanged setpoint once a minute would burn the rate limit for nothing.

A write that fails — an unreachable integration, an expired cloud token, an external integration that does not acknowledge the command within the core's 5 s budget — is logged and swallowed: one dead thermostat must not stop the others, and the next tick retries it anyway since the value still differs.

### C.0.1 The device is a second writer, and wins

A real thermostat has its own dial, its vendor app and often its own internal programme: Gladys is **not** the only thing that writes its setpoint. Left alone, the loop would re-apply the stored preset on the next tick and silently undo whatever was set on the device — once a minute, for ever. From the outside this reads as an unstable thermostat: a value set on the vendor app reverts a moment later, sometimes before the app has even finished sending it.

A setpoint change observed on a driven thermostat is therefore held exactly like a turn of the widget dial: `MANUAL_MODE` is armed, and the loop stops imposing the schedule. With a schedule the hold lasts `THERMOSTAT_MANUAL_DURATION` and the programme then resumes; without one it is permanent, like on a physical thermostat (section D).

**Telling our own write apart from a real one.** Gladys's own write comes back as the same `NEW_STATE` event. Taken at face value it would arm a manual hold on _every scheduled write_, so the schedule would suspend itself the moment it applied.

Consuming **one** echo per write is not enough, and this is a real failure mode rather than a theoretical one. Zigbee2MQTT reports periodically and Netatmo is polled every two minutes, both re-emitting the value **unchanged**. The first report is consumed as the echo; the second, identical, is taken for a setting made on the device, which arms a hold and rewrites the same value to the equipment — a cloud call per poll — whose own echo is then consumed, and the next report starts again. The visible result is a thermostat stuck in "manual" for ever, schedule transitions delayed by the hold duration, and exactly the API burn C.0 exists to avoid.

**A change is therefore what differs from the last value this service wrote**, not what arrives after it. The mark is kept rather than consumed, and compared against: an identical report is ours however many times it repeats, and only a different value is a genuine change made on the device.

**Holding a change costs nothing on the wire.** The hold is armed directly — the param is written and the websocket sent — rather than routed through the setpoint write path. The device already carries this value, since it is what it just reported: writing it back would be a cloud call or a Zigbee message per turn of the dial, and the write path hands the running mode back first (C.0), kicking a thermostat that was in `auto`, `off` or its own vendor programme (C.0.3) into heating or cooling. The value is stored in the feature's own unit, which is the unit a hold on an external thermostat is stored in (C.3).

This applies to external thermostats only. A virtual one has no second writer — Gladys owns its setpoint feature — so its own writes must never arm a hold.

The selectors driven by this service are cached and rejected cheaply, in the same pass that builds the window-sensor set: `NEW_STATE` fires for every feature in the house, and neither check may cost a query.

### C.0.2 The setpoint must be written on the owning device

`gladys.device.setValue` routes on `device.service.name`. An external write therefore has to be handed **the device that owns the feature**, resolved from the selector — never this service's own thermostat device, which would route the write straight back into this integration's `setValue` and loop for ever.

### C.1 Timezone

Schedules are wall-clock times **in the house**. `getCurrentDayAndMinutes` therefore reads the day and minute in the timezone from `SYSTEM_VARIABLE_NAMES.TIMEZONE` (default `Europe/Paris`), like scenes, DuckDB and the energy jobs do — the official Docker image runs in UTC, so relying on the process timezone would fire a 07:00 comfort transition at 08:00 or 09:00 in France.

The matching lives on the **server only**. The widget is handed `current` and `next` already computed (E.5) and never reads the timezone, so there is nothing to keep in agreement between two implementations — and no reason for a schedule helper to be importable from the frontend build. The interval algebra that used to be shared (`applySlotToDay`, `mergeIntoSlots`) does not survive the move to transition points (E.0); what is left is "the last point at or before now", which the loop does once per tick.

This is also what removes the class of bug where a phone abroad, or a laptop left on another zone, displayed a preset other than the one actually heating the house.

### C.2 Hysteresis and TPI

**Virtual thermostats only** — see C.0.

- **Hysteresis** (default): heat below `setpoint - hysteresis_start`, stop above `setpoint + hysteresis_stop`, hold the current state in between. Both values are temperature **differences**, so converting a thermostat to Fahrenheit scales them by 9/5 with **no** 32° offset — the absolute-temperature conversion would turn a 0.5 °C hysteresis into 32.9 °F.
- **TPI**: the switch is on for a fraction of each cycle proportional to the error within the proportional band. Heating only — a cooling compressor cannot be pulsed that way, so cooling always falls back to hysteresis. An on-time below one minute is rounded down to off: the regulation step is one minute, and a shorter pulse is both useless and hard on the relay.
- **TPI phase.** The position inside the cycle is offset by a hash of the thermostat's feature selector. Without it, every thermostat sharing a cycle time switches on at the same wall-clock minute, stacking the loads.

### C.3 Sensor unit vs thermostat unit

This section is about the _reading_, and applies to a virtual thermostat, which compares it to the setpoint. On an external one the same conversion is applied for **display**, and the symmetrical conversion is applied to the setpoint on the way out (C.0).

The room sensor is a **separate device** from the thermostat, so nothing forces the two to share a unit: a Zigbee or Z-Wave probe reporting celsius next to a thermostat set to `THERMOSTAT_TEMP_UNIT = F` is a configuration the edit form allows. Comparing the raw reading to the setpoint would then put 68 against 20 and leave the heating permanently off — or, in cooling, permanently on.

The reading is therefore converted into the thermostat's unit before any comparison, from the sensor's declared `feature.unit`. A sensor with **no** declared unit is assumed to already be in the thermostat's unit: that is the pre-existing behaviour, and guessing would be worse than not converting.

The widget does the same on its side, and for the same reason — it renders the reading with the thermostat's unit symbol. The sensor unit is read once from the initial `GET /api/v1/device`; websocket `NEW_STATE` payloads do not carry it, so the value cached from that first read is what later events are converted with.

**The unit a manual hold is stored in** is the unit it was set in, and it differs by device type — which is why the write path is told rather than left to guess.

On a **virtual** thermostat the setpoint feature is this service's own, declared in `THERMOSTAT_TEMP_UNIT`: the hold is in the thermostat's unit, like a preset setpoint resolved from `THERMOSTAT_PRESET_*`.

On an **external** one the hold comes from the real device's own feature — the widget dial reads that feature's unit, and a setpoint changed on the appliance arrives in it. It is therefore stored in the _feature's_ unit, not the thermostat's, and `writeExternalSetpoint` is passed a null unit so it writes the value through untouched. Converting it as if it were in `THERMOSTAT_TEMP_UNIT` would command 158 °F for a 70 °F hold on a celsius-configured thermostat, or about −6 °C for a 21 °C one — and MQTT/Home Assistant takes its unit from the discovery payload, so the mismatch is reachable.

The mark that tells our own write apart from a real change (C.0.1) is in the feature's unit too, since it records exactly what was sent to the device.

## D. One write path: the generic feature value route

Once the preset and the mode are features (B), there is no reason left for this service to expose its own write API. **Everything a client does to a thermostat is a value written on one of its features**, through the route the whole of Gladys already uses:

```
POST /api/v1/device_feature/:selector/value
```

| Intent               | Feature              | Value                                      |
| -------------------- | -------------------- | ------------------------------------------ |
| Pick a preset        | `preset`             | `comfort`, `eco`, `away`, `night`, `frost` |
| Resume the programme | `preset`             | `schedule`                                 |
| Hold a temperature   | `target-temperature` | the number                                 |
| Stop the thermostat  | `mode`               | `off`                                      |
| Start it again       | `mode`               | `heating` / `cooling`                      |

The widget, scenes, MQTT, Gladys Plus and the connectors all take that one path. Three routes of the previous revision disappear with it: `POST /setpoint/:feature_selector`, `GET`/`POST /state/:variable_key`, and `POST /apply-schedules`. So does the ownership guard each of them needed — the generic route is already authenticated and already checks that the feature exists; it does not need to know that this particular feature belongs to a thermostat.

Only the schedule CRUD stays a service API (E). A weekly programme is not the value of a feature.

### D.0 What `setValue` does

`setValue` is the single entry point: `device.set-value` in a scene, the generic device API, the widget's dial and its preset bar all land there.

**On `target-temperature`** — persisting the value alone would not survive: the next regulation pass re-applies the scheduled preset and overwrites it within the minute. A write from outside the loop is therefore a **manual hold**: the setpoint is saved, the hold is armed, and a regulation pass is triggered.

The **expiry is armed only when the device follows a schedule** — that is the only case where something would otherwise take the setpoint back. With a schedule, the hold lasts `THERMOSTAT_MANUAL_DURATION` (30 min by default) or until the next transition (E.3), and the programme then resumes. Without a schedule the hold is **permanent**, like on a physical thermostat: arming a timer there would silently revert to the stored preset minutes later, with nothing on screen to announce it.

**On `preset`** — the value becomes the feature's state. `schedule` clears the hold and hands the thermostat back to its programme; any other preset arms a hold on that preset's setpoint, with the same expiry rule as above.

**On `mode`** — `off` stops the thermostat: the switch is cut (virtual), or the mode is written to the real device with the frost setpoint as a fallback (external, C.0). Any other mode starts it again on whatever the preset or the hold currently says.

**On an external thermostat**, none of these are merely saved: they are written onto the **real device** through the core, on the device that owns the feature (C.0.2). Persisting locally would refresh every Gladys screen while the thermostat itself only heard about it on the next tick, up to a minute later.

### D.1 The widget writes values, and nothing else

`ThermostatBox.jsx` becomes a renderer: it displays the device's features and writes values on them. It holds no state machine of its own — the previous revision wrote up to five times for one release of the dial, and each of those writes was a chance for the widget's idea of the thermostat and the server's to diverge. That whole class of race disappears when the server is the only place the state machine exists.

A single `NEW_STATE` per feature tells the widget what happened, whoever caused it: the dial, a scene, the vendor app, or the schedule.

## E. Weekly schedules: transition points, owned by a house

### E.0 Why not intervals

The previous revision stored **intervals**: a slot with a `start_time` and an `end_time`. The storage was clean and the matching correct, timezone included — the problem is the representation itself.

An interval cannot cross midnight, so a 22:30 → 06:30 night is two rows cut at midnight, which the editor glues back together by geometry (ends at midnight, next day starts at midnight, same preset) — while the server _also_ accepts a single row whose end precedes its start. Two encodings of the same night, and every operation of the editor has to redo the interval algebra: split, trim, extend the predecessor, propagate the overflow, delete the orphan half. That is `thermostatSchedule.js` (385 lines), 650 lines of tests, and the three review bugs on copying a day, deleting a slot and editing a night.

Intervals also allow **gaps**, which fall back on the last preset applied — so the effect of a programme depends on the thermostat's history — and **overlaps**, which the server does not refuse.

Netatmo and Tado store **transition points**: _from this day and this time, this preset, until the next point_, the last point of the week wrapping onto the first. No cut night, no gap, no overlap, no algebra. Copying a day is copying its points; deleting a point extends the previous one; matching is "the last point at or before now".

### E.1 A schedule belongs to a house

Two further changes to the model, both structural:

- **The schedule is attached to a house.** With two houses and ten thermostats each, twenty thermostats used to pick from one flat list, a name was unique across both houses, and nothing stopped a thermostat of house A from following a schedule of house B. Heating is precisely the domain where the house matters: presence and the alarm live there, and so will the future away and holiday modes.
- **The schedule → thermostat link is a table, not a param.** It used to be `THERMOSTAT_ACTIVE_SCHEDULE`, a free-text device param holding a selector. That is a relation between two entities, not configuration: it had no integrity and no cascade — hence `detachSchedule`, written by hand — and no reverse query, so "which thermostats follow this schedule?" could not be asked.

### E.2 Schema

```
t_thermostat_schedule
  id          UUID    PK
  house_id    UUID    NOT NULL, FK → t_house.id, ON DELETE CASCADE
  name        STRING  NOT NULL
  selector    STRING  NOT NULL, UNIQUE
  UNIQUE (house_id, name)

t_thermostat_schedule_transition
  id           UUID     PK
  schedule_id  UUID     FK → t_thermostat_schedule.id, ON DELETE CASCADE
  day_of_week  INTEGER  NOT NULL, 0 = Monday … 6 = Sunday
  time         STRING   NOT NULL, "HH:MM"
  preset       STRING   NOT NULL, a THERMOSTAT_PRESET value or "off"
  UNIQUE (schedule_id, day_of_week, time)

t_thermostat_schedule_device
  schedule_id  UUID  FK → t_thermostat_schedule.id, ON DELETE CASCADE
  device_id    UUID  FK → t_device.id,              ON DELETE CASCADE
  PRIMARY KEY (device_id)
```

The primary key on `device_id` alone is what enforces **one schedule per thermostat**. Deleting a schedule, a house or a thermostat cleans the link up with no code at all, which is what replaces `detachSchedule`.

`preset` is stored as a string rather than an ENUM: SQLite does not enforce ENUM anyway, and a column ENUM would mean a migration every time a preset is added. Validation stays in Joi and in the model.

**The column is a string although the feature is an integer** (B.2), and the two are not in conflict: a transition also accepts `off`, which is a mode and has no place in the preset enum, so the column's domain is "a preset name, or `off`" rather than the preset enum itself. Names also keep a hand-read schedule row meaningful, which matters more here than on a feature whose value is rendered through translations. The loop maps the name to its enum value when it writes the `preset` feature, and `off` to a mode write (B.1).

Migration `20260823000000` creates these tables. It has never run in production — this integration has not shipped — so it carries this schema directly rather than a first one replaced by a second: a `t_thermostat_schedule_slot` table nobody ever had is not worth a migration to drop.

### E.3 Application

The loop reads the schedule of every thermostat whose `preset` feature reads `schedule`, takes the **last transition at or before now** — in the Gladys timezone (C.1) — and applies its preset. When no point of the week precedes now, the last point of the week applies: the programme wraps, which is what removes the gap.

A `PATCH` on a schedule, or a thermostat newly attached to one, triggers a regulation pass through the existing debounce. There is no dedicated route for it (D).

Because a transition point has a known successor, a manual hold can offer **"until the next transition"** alongside the fixed `THERMOSTAT_MANUAL_DURATION`. That is the Tado and Netatmo default, and `next` (E.5) gives the widget the timestamp for free.

### E.4 API

Every route is authenticated, under `/api/v1/service/thermostat`. The schedule's selector is generated by the server on creation, like a scene's. Houses and devices are named by their selector, as everywhere else in the API.

| Route                                                | Body                           | Effect                                                                                             |
| ---------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `GET /schedule?house=:house_selector`                |                                | All schedules, filtered by house when the parameter is given.                                      |
| `GET /schedule/:selector`                            |                                | One schedule.                                                                                      |
| `POST /schedule`                                     | `{ house, name, transitions }` | Creates a schedule in that house. `transitions` is optional, empty by default.                     |
| `PATCH /schedule/:selector`                          | `{ name?, transitions? }`      | Renames and/or **replaces the points wholesale**, in a transaction. An absent field is left alone. |
| `DELETE /schedule/:selector`                         |                                | Deletes the schedule; the links go by cascade.                                                     |
| `POST /schedule/:selector/device/:device_selector`   |                                | Makes that thermostat follow this schedule, replacing the one it followed. Idempotent.             |
| `DELETE /schedule/:selector/device/:device_selector` |                                | The thermostat follows no schedule any more.                                                       |

Attaching is a `POST` rather than the `PUT` its idempotence would suggest:
neither the front's `HttpClient` nor the Gladys Plus gateway client sends `PUT`,
so such a route is unreachable from either.

`PATCH` replaces the whole set of points rather than editing them one by one: the editor always holds the complete programme of a schedule, and a partial protocol would need to express deletions, reorderings and a conflict policy for no gain.

### E.5 The schedule object

Returned by every route that returns a schedule:

```json
{
  "id": "…",
  "selector": "semaine",
  "name": "Semaine",
  "house": "maison-principale",
  "transitions": [
    { "day_of_week": 0, "time": "06:30", "preset": "comfort" },
    { "day_of_week": 0, "time": "08:30", "preset": "eco" },
    { "day_of_week": 0, "time": "22:30", "preset": "night" }
  ],
  "devices": [
    {
      "selector": "thermostat-salon",
      "name": "Thermostat salon",
      "room": "salon"
    }
  ],
  "current": { "day_of_week": 0, "time": "06:30", "preset": "comfort" },
  "next": { "day_of_week": 0, "time": "08:30", "preset": "eco" }
}
```

`transitions` is sorted by day then time. `current` and `next` are computed **by the server**, in the Gladys timezone, read-only, and are `null` on a schedule with no point. The widget therefore no longer reads the timezone, and no longer recomputes the active point: it renders "Éco until 08:30" straight from `next`. That removes the last reason for the schedule-matching helper to be shared between the server and the frontend build (C.1).

### E.6 Validation

In Joi, shared between the API and the model:

| Rule                                                                                                                          | Failure                            |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `house` is the selector of an existing house                                                                                  | `404 HOUSE_NOT_FOUND`              |
| `name` is a non-empty string, unique within the house                                                                         | `409 SCHEDULE_NAME_ALREADY_EXISTS` |
| `day_of_week` is an integer 0–6, `time` matches `HH:MM`, `preset` is a `THERMOSTAT_PRESET` value minus `schedule`, plus `off` | `400`                              |
| no two points share a day and a time                                                                                          | `400 DUPLICATE_TRANSITION`         |
| an attached device belongs to the thermostat service                                                                          | `400 NOT_A_THERMOSTAT`             |
| an attached device has a room, and that room is in the schedule's house                                                       | `400 DEVICE_NOT_IN_HOUSE`          |

Name uniqueness is carried by the database as well, and the constraint violation returns the same `409`: two clients creating the same name at once must not depend on which one checked first.

`schedule` is excluded from the transition presets because a point saying "follow the programme" is the programme referring to itself.

### E.7 The integration page

The page lists schedules **by house**, and under each schedule the thermostats that follow it — the reverse query the link table makes possible. The editor's coloured bars are drawn exactly as before, and the form may keep showing a start and an end: the end is simply the next point.

## F. The widget, on an external thermostat

The dashboard widget is the same in both cases; three details differ.

**It targets the real device's selector.** `thermostat_feature` holds the external selector, so the picker — which lists this service's devices — offers an external thermostat under its own name, resolved through `THERMOSTAT_TARGET_FEATURE`. Without that it would have no feature to show and could never be added to a dashboard.

**The heating halo reads `THERMOSTAT_STATE_FEATURE`** instead of the switch, normalising the two accepted shapes (A.0.1). `NEW_STATE` payloads carry no category or type, so the shape is taken from the feature read at mount and the value normalised against it. With no state feature configured, the widget falls back to estimating the state from the setpoint, as it already did for a thermostat with no switch. On a virtual thermostat there is nothing to normalise: the halo reads the device's own `operating-state` (B.3).

**The real device is a second source of truth.** A setpoint changed on the thermostat itself — its own dial, the vendor app, its internal programme — arrives as a `NEW_STATE` and is displayed, where a virtual thermostat holds its local manual setpoint instead. Only Gladys writes a virtual setpoint, so there is nothing to follow there; on an external one, holding it would leave the widget showing a value the thermostat no longer has. The short-lived hold that protects the user's own in-flight write (`expectedSetpoint`) still applies, so the dial does not jump while it is being turned.

**The preset bar stays visible on a scheduled thermostat.** The previous revision replaced it with the "following the schedule" banner as soon as a schedule was attached, which meant that "I am away for the weekend → Frost" required going to the integration page and detaching the programme. The bar is rendered **under** the banner instead: picking a preset there arms a hold, which is the normal way to step off a programme for an afternoon, and the banner says what the thermostat goes back to.

That hold offers **"until the next transition"** as well as the fixed duration, and defaults to it on a scheduled thermostat — the Tado and Netatmo behaviour, which `next` (E.5) makes a matter of reading a field.

**A hold taken on the device un-highlights the preset.** The preset bar shows which preset the setpoint comes from, and a value set on the thermostat itself no longer comes from one. The widget already dropped the highlight for a setpoint set on its own dial (`manualSetpointOverride`, which deliberately ignores holds armed by scenes); on an external thermostat a manual hold _always_ means the setpoint left the preset, whether it was armed here or on the device. This applies on the live event and on a page reload, which restores the same state from the database. Picking a preset clears the hold and lights it back up.

The dial bounds come from the target feature's own `min`/`max` when it declares them, and fall back to `THERMOSTAT_MIN_TEMP` / `_MAX_TEMP` otherwise — the device knows its range better than the form does.

## G. Out of scope

- Fil pilote heaters (`heater` / `pilot-wire-mode`): the actuator picker is `switch` / `binary` only. Additive when it comes, and the most common French case after the relay.
- **House modes**: away tied to presence, holiday until a date, a global frost setting. A schedule owned by a house (E.1) is what makes an active schedule per house — followed by thermostats that made no explicit choice — expressible later with no schema change.
- **The gauge widget on any `thermostat` / `target-temperature` feature**, the schedule being an optional layer on top. Today, showing a Netatmo on a dashboard means creating an "external" thermostat device for it.
- **An external thermostat that keeps its own vendor programme.** Gladys's hold and the device's programme then take turns writing the setpoint (C.0.1). Until that is handled, the edit form says to disable the programme on the vendor side.
- Multi-zone grouping, open-window _detection_ by temperature drop (as opposed to a sensor).
- **Driving a second setpoint on an external thermostat.** A reversible Matter or Zigbee device exposes a heating _and_ a cooling setpoint; one `THERMOSTAT_TARGET_FEATURE` is written, and a house wanting both creates two thermostats. Additive.
