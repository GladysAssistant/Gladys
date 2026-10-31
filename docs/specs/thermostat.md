# Thermostat: weekly schedules, virtual, on a real thermostat or on a pilot-wire heater

## Context

Gladys can already _read and command_ real thermostats (Netatmo, Matter, Zigbee, Z-Wave) through the `thermostat` device feature category. Two things are missing, and this integration fills both.

**It cannot _be_ the thermostat.** Turning a plain temperature sensor plus a plain switch — a relay, a smart plug, a boiler contact — into a regulated heating zone with a weekly programme is the most common French setup: an electric or hydronic heater driven by a contact, a separate sensor in the room, no branded thermostat anywhere. Today the answer is a hand-written scene per temperature threshold, with no schedule, no hysteresis and no anti-short-cycling.

**It cannot _programme_ the thermostats it already reads.** A Netatmo or a Zigbee thermostat regulates itself perfectly well, but nothing in Gladys drives its setpoint on a weekly schedule: the programme lives in the vendor's app, out of reach of scenes and of the rest of the house.

The two needs share everything except the last step. The schedule, the presets, the manual override, the widget and the window handling are the same; only the final act differs — Gladys either actuates a switch itself, or writes a setpoint onto a device that actuates its own. Hence one integration with **two device types**, `virtual` and `external`, and a single code path that branches once, at the end of the regulation pass.

A third, `pilot-wire`, came with the French pilot-wire heaters (C.1.1): a heater that regulates on its own thermostat and takes an order rather than a setpoint. It drives no real setpoint, so it runs the virtual thermostat's path, and stops at step 4 like an external one.

## A. Device model

One device per heating zone, created by the integration. `THERMOSTAT_TYPE` says which of the three kinds it is; a device saved before the param existed has none, and is a virtual one — so **no migration is needed**.

### A.0 Virtual and external

A **virtual** thermostat carries four features, in the `DEVICE_FEATURE_CATEGORIES.THERMOSTAT` category, because Gladys _is_ the thermostat and its whole state has to live somewhere: `target-temperature`, `preset`, `mode` and `operating-state`. Section B is what each one carries and why.

A virtual thermostat is a thermostat, and must be indistinguishable from a Netatmo one to the rest of Gladys (scenes, MQTT, Gladys Plus, the device pages). One new **type** is introduced, `preset`, for a notion the branded integrations already have and could not express (B.2); no new category.

Every feature is resolved **by category and type**, never by `device.features[0]`: feature order is not a contract, and with four features an index would be a silent mis-target of the regulation loop.

A **pilot-wire** thermostat (`pilot-wire`) is a heater on a French pilot wire that regulates on its own thermostat: Gladys only sends it the order each preset is set to (C.1.1). It drives no real setpoint, so it carries the four features of a virtual thermostat. A pilot-wire heater regulated by Gladys is a virtual thermostat whose actuator is a pilot wire.

An **external** thermostat carries **two features of its own, `preset` and `mode`** (B.3), and nothing else: its setpoint and its operating state belong to the real device. The setpoint is a feature of the real device — a Netatmo, a Zigbee TRV, a Matter thermostat, an MQTT climate entity — named by `THERMOSTAT_TARGET_FEATURE`. Creating a mirror feature here would give the house two setpoints that drift apart, and the whole point is that the real device stays the authority on its own state. The widget's `thermostat_feature` therefore names that **external** selector, and a client writing a setpoint writes it on the real feature, through the same generic route as anywhere else (D).

### A.0.1 What real thermostats actually expose

The design is constrained by what integrations publish today, which is much less than the core defines:

| Integration           | `target-temperature`                                       | `operating-state`                          | `mode`                                                                                                                               |
| --------------------- | ---------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Netatmo               | yes                                                        | no — a boiler contact as `switch`/`binary` | no                                                                                                                                   |
| Zigbee2MQTT           | yes, **up to five** (heating/cooling, occupied/unoccupied) | no                                         | no                                                                                                                                   |
| Matter                | yes, **two** (heating, cooling)                            | no                                         | no                                                                                                                                   |
| MQTT / Home Assistant | yes, when the discovery declares it                        | no                                         | no                                                                                                                                   |
| Air conditioners      | yes, as `air-conditioning`/`target-temperature`            | no                                         | yes, as `air-conditioning`/`mode` (`AC_MODE`) — no `off` value; the unit is stopped by its `air-conditioning`/`binary` power feature |

Air conditioners and heat pumps (MELCloud, Tuya, Sensibo, external integrations…) do not publish the `thermostat` category at all: their setpoint, their mode and their power live in `air-conditioning` (A.0.3). Offering only `thermostat`/`target-temperature` as a target left every heat pump out of the picker, with nothing to tell the user why.

Three consequences, each of which is a rule the code follows:

- **No auto-discovery of the target.** A Matter or Zigbee device exposes several setpoints and only the user knows which one drives their heating, so the selectors are picked by hand in the edit form, out of _every_ device in the house (A.3 narrows the list to the thermostat's room by default, it never hides the rest).
- **The state feature accepts two shapes.** `thermostat`/`operating-state` (0 idle / 1 heating / 2 cooling) _and_ a read-only `switch`/`binary` boiler contact. Accepting only the standard type would leave every thermostat available today with no heating indication at all. It also accepts **nothing**: the widget then shows the setpoint without a heating halo.
- **The mode feature is optional.** No integration produces one. Requiring it would make the feature unusable for everybody.

### A.0.2 No loops

The feature pickers exclude devices owned by this service. Pointing an external thermostat at a virtual one would make Gladys write its own setpoint back to itself, once a minute, for ever.

### A.0.3 Air conditioners as external thermostats

An `air-conditioning` device is driven like any external thermostat — Gladys writes its setpoint and leaves the regulation to it — with three differences, all of them in what the features accept:

- **The target** may be an `air-conditioning`/`target-temperature` feature as well as a `thermostat` one. Nothing else in the loop changes: the unit conversion, the step snap, the clamp to the feature's `min`/`max` and the echo handling (C.0.1) apply as they are.
- **The mode** may be an `air-conditioning`/`mode` feature. Its values are `AC_MODE`, not `THERMOSTAT_MODE` — `HEATING` is `2` there and `1` here — so the value is **translated** on write: heating → `AC_MODE.HEATING`, cooling → `AC_MODE.COOLING`, auto → `AC_MODE.AUTO`. `AC_MODE` has no `off`: an `OFF` write on such a feature is skipped, never sent as `0`, which is `AC_MODE.AUTO` and would start the unit instead. The `max` clamp of C.0 is a `THERMOSTAT_MODE` rule and does not apply to an `AC_MODE` feature, whose `max` describes another enum.
- **The stop** goes through the unit's power, `THERMOSTAT_POWER_FEATURE` (A.1): a writable `binary` of the `air-conditioning` or `switch` category. Stopping writes `0` on it, starting writes `1` — see C.0 for the order. The power is also read back: a unit switched off from its remote stops the thermostat — until the programme's next point when it follows one — and switched on again starts it (C.0.1). Two thermostats may drive one unit, one per mode or one per setpoint of a reversible device (G): a stopped one leaves the power to the one running, which switches it. On a unit with no power, the shared feature is its mode, and a stopped thermostat leaves that mode the same way — writing `off` on it every pass, it fought the running one, which wrote its own mode back. It is optional and may name the power of any external thermostat, not only an air conditioner, but an air conditioner without it can only be "stopped" by the setpoint, which a heat pump in heating mode clamps to its own minimum (often 16 °C) and keeps heating to.

Picking an `air-conditioning` target in the edit form pre-fills the mode and the power with the `air-conditioning`/`mode` and `air-conditioning`/`binary` features **of the same device**, when the fields are empty. This is a suggestion, not discovery: the fields stay editable, and a device has only one of each, so there is nothing for the user to disambiguate — unlike the several setpoints of A.0.1. Picking the setpoint of another device then drops a mode or a power that belongs to the previous one: left behind, every pass would keep switching a unit the thermostat no longer drives. With an `air-conditioning` setpoint and no power, the form warns that nothing will stop the unit; it does not refuse the save, since a heat pump driven by its setpoint alone is a legitimate if limited choice. On a virtual thermostat, an actuator list with nothing to pick explains that an air conditioner, or any appliance that regulates itself, is set up as a real thermostat. The section that holds the sensors is titled after the use, Heating or Cooling, and the state feature is the _operating_ state, which reads the same in both.

### A.1 Configuration lives on the device

Everything the control loop needs is a `THERMOSTAT_*` device param:

| Param                                              | Meaning                                                                                                                                                                                                                 |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `THERMOSTAT_TYPE`                                  | `virtual`, `external` or `pilot-wire`; absent means `virtual`; `external` with a pilot wire reads `pilot-wire`                                                                                                          |
| `THERMOSTAT_TEMPERATURE_FEATURE`                   | the sensor(s) the loop regulates on (virtual); displayed only (external, pilot-wire). One or several (A.1.1): the loop uses their **average**                                                                           |
| `THERMOSTAT_HUMIDITY_FEATURE`                      | optional, displayed only                                                                                                                                                                                                |
| `THERMOSTAT_SWITCH_FEATURE`                        | **virtual only** — the actuator the loop drives                                                                                                                                                                         |
| `THERMOSTAT_PILOT_WIRE_FEATURE`                    | **virtual or pilot-wire** — a writable `heater` / `pilot-wire-mode` feature, driven by an order (C.1.1)                                                                                                                 |
| `THERMOSTAT_PILOT_WIRE_ORDER_<PRESET>`             | **pilot-wire only** — the order the preset sends (a `PILOT_WIRE_MODE`), default in C.1.1                                                                                                                                |
| `THERMOSTAT_TARGET_FEATURE`                        | **external only** — the real device's setpoint, written by the loop. Required                                                                                                                                           |
| `THERMOSTAT_STATE_FEATURE`                         | **external only**, optional — `operating-state` or a binary boiler contact, read to show whether the equipment runs                                                                                                     |
| `THERMOSTAT_MODE_FEATURE`                          | **external only**, optional — the real device's operating mode, if it has one: `thermostat`/`mode` or `air-conditioning`/`mode` (A.0.3)                                                                                 |
| `THERMOSTAT_POWER_FEATURE`                         | **external only**, optional — the real device's power, a writable `air-conditioning` or `switch` `binary`: `0` to stop it, `1` to start it (A.0.3, C.0)                                                                 |
| `THERMOSTAT_WINDOW_FEATURE`                        | optional opening sensor(s); one or several (A.1.1). **Any** of them open cuts the switch (virtual) or stops the real thermostat (external) — whatever the mode, so a running air conditioner is suspended like a heater |
| `THERMOSTAT_WINDOW_DELAY`                          | how long an opening sensor has to stay open before the heating is suspended, in seconds, from `0` to `3600`; `60` when absent, `0` cuts at once (C, step 1)                                                             |
| `THERMOSTAT_PRESENCE_FEATURE`                      | optional presence or motion sensor(s); one or several (A.1.1). **All** of them seeing nobody for the delay lowers the thermostat to the absence preset (A.4)                                                            |
| `THERMOSTAT_PRESENCE_DELAY`                        | how long every presence sensor has to see nobody before the room is taken as empty, in minutes, from `1` to `1440`; `30` when absent (A.4)                                                                              |
| `THERMOSTAT_PRESENCE_PRESET`                       | the preset an empty room is regulated on: `eco`, `night`, `away` or `frost`; `eco` when absent or anything else (A.4)                                                                                                   |
| `THERMOSTAT_MODE`                                  | `heating` or `cooling`                                                                                                                                                                                                  |
| `THERMOSTAT_CONTROL_TYPE`                          | `hysteresis` or `tpi`                                                                                                                                                                                                   |
| `THERMOSTAT_MIN_TEMP` / `_MAX_TEMP`                | bounds of the setpoint feature and of the widget dial                                                                                                                                                                   |
| `THERMOSTAT_TEMP_UNIT`                             | `C` or `F`                                                                                                                                                                                                              |
| `THERMOSTAT_MANUAL_DURATION`                       | how long a manual hold lasts, in minutes, when it is not set to run until the next transition (E.3)                                                                                                                     |
| `THERMOSTAT_MANUAL_SETPOINT` / `_MANUAL_UNTIL`     | the hold itself: the held setpoint and its expiry, absent when no hold is armed                                                                                                                                         |
| `THERMOSTAT_SCHEDULE_STOP`                         | a stop the service made on a programme's Off point (E.6), `true` until a mode is written or a programme lifts it                                                                                                        |
| `THERMOSTAT_REMOTE_STOP_UNTIL`                     | a stop made on the unit itself: when it ends, the programme's next point as a timestamp, or `unit` with no programme (C.0.1); cleared by any mode write                                                                 |
| `THERMOSTAT_MODULE_STOP`                           | a stop pressed on a pilot-wire module (C.1.1), `true` until a mode is written; only this stop is lifted by an order the module reports                                                                                  |
| `THERMOSTAT_PRESET_*`                              | the five preset setpoints (`off` has no setpoint)                                                                                                                                                                       |
| `THERMOSTAT_HYSTERESIS_START` / `_STOP`            | hysteresis band, in degrees of **difference**                                                                                                                                                                           |
| `THERMOSTAT_TPI_CYCLE_TIME` / `_PROPORTIONAL_BAND` | TPI tuning, clamped by the regulation loop to 5-120 min and 0.5-10 degrees                                                                                                                                              |

#### A.1.1 Several sensors in one param

A living room has several windows, and an open-plan ground floor is one volume for two rooms: the salon's French window and the kitchen's door both have to stop the heating. A large room has several temperature probes, and regulating on one corner of it is regulating on the wrong number. One motion sensor sees the sofa but not the desk. `THERMOSTAT_WINDOW_FEATURE`, `THERMOSTAT_TEMPERATURE_FEATURE` and `THERMOSTAT_PRESENCE_FEATURE` therefore name **one or several** features.

**Format.** The value is either a single selector — the format every device saved so far carries — or a JSON array of selectors, `["salon-window","kitchen-door"]`. A single sensor is always written as a plain selector, so a device with one sensor is byte-for-byte what it was, and **no migration is needed**. Every reader goes through one parser (`parseSelectorList`, server and front alike), which accepts both and drops empty and duplicate entries; a value that starts with `[` but is not valid JSON is read as a single selector rather than throwing, so a malformed param degrades into "sensor not found" instead of stopping the loop. No other `*_FEATURE` param takes a list: the switch, the target, the state, the mode and the power each name one feature of one appliance.

**Windows: any open stops.** The loop checks every listed sensor and suspends the heating as soon as one has read `0` for `THERMOSTAT_WINDOW_DELAY` seconds (C, step 1); the `NEW_STATE` listener reacts to any of them. Each sensor counts from its own opening and has its own pending check, so closing one leaves the other's count running. It resumes only when all are closed. A sensor that cannot be read is ignored — it is not taken as open, which would stop the heating for good on a sensor with a flat battery.

**Temperature: the average.** The loop regulates on the arithmetic mean of the listed sensors that carry a value, each converted into the thermostat's unit first (C.3), so a Celsius probe and a Fahrenheit one average correctly. A sensor with no value is left out of the mean rather than counted as 0; when none has a value, the pass behaves as it did for one silent sensor — no switch decision. A sensor whose last report is more than an hour old — the window the core's room average (`getTemperatureInRoom`) accepts — is left out too while a fresher one reports: a probe on a flat battery or a lost Zigbee route keeps its last value for ever, and pulled the mean towards a temperature the room left long ago. When every sensor is that old they are all kept, as a single sensor always was: a stale reading still beats regulating on nothing, and a probe that only reports its changes may be silent for an hour in a steady room. The widget displays the same mean, rounded for display only. A min/max choice was considered and left out: an average needs no setting, and a house that wants the coldest corner picks that one sensor.

**A pilot-wire heater Gladys regulates (C.1.1)** reads its room the same way: it is sent comfort or frost protection on the average of its probes, and frost protection once any of its windows has been open for the delay — an order pressed on its module from then on is sent back at once.

Which schedule a thermostat follows is **not** in this list: it is a relation, held by `t_thermostat_schedule_device` (E.1).

`createDevice` accepts only this list plus, on a virtual thermostat, its four features; anything else in the request body is dropped rather than persisted. Every field the edit form offers is in that list: a field the filter dropped would silently need a second store, which is exactly what this section forbids.

**The state features are named after the device's `external_id`, never its selector.** `createDevice` is the same route for a create and for every later save, and the selector does not exist yet on the first one — it is derived from the payload afterwards. Keying these features on the selector renames them between the two, and since a save rebuilds the feature set, the renamed ones are deleted and recreated: the preset and the mode the user had set go back to `null`, their history is dropped, and a scene written against them breaks. The `external_id` is the one identifier the client carries unchanged across both saves.

On an external device `createDevice` keeps only the `preset` and `mode` features (B.3) and refuses a payload with no `THERMOSTAT_TARGET_FEATURE`: a thermostat with nothing to drive would sit in the integration page doing nothing, with no way to tell why. Switching a device back to `virtual` clears the external params (target, state, mode, power), so a stale selector can never keep driving a real thermostat.

The hysteresis, TPI and switch params are meaningless on an external device — the real thermostat runs its own heuristic — and the edit form hides them there rather than offering settings that do nothing.

The `*_FEATURE` params name a feature of another device by its selector. Migrating that device to a replacement integration rewrites them to the destination feature (`device-migration.md` B.3), as it rewrites the scenes and the dashboards: left on the source selector, the loop would find no sensor, no switch or no target once the source is deleted. Inside a list (A.1.1) only the migrated entry is replaced, in place.

The defaults for all of these live in `server/utils/thermostatConstants.js`, imported by the regulation loop, the widget and the edit form alike, so a device saved without a param is regulated exactly as the form displayed it. The preset temperatures default by use (`defaultPresetTemps`): frost 7, away 16, night 17, eco 18 and comfort 21 °C in heating, and 30, 28, 25, 26 and 24 °C in cooling, where frost protection is the heat the room must never reach. Comfort at 21 °C was a cold surprise on the first tap of an air conditioner. Switching the use in the form carries the presets along while they still hold the previous use's defaults; a temperature someone typed stays.

### A.2 Runtime state is on the features

The current preset, the current mode and the heating state are the `last_value` of the features described in B — not variables, not a dashboard document, not a client-side store. There are exactly two `THERMOSTAT_*` service data left that are neither configuration nor features: the manual hold and its expiry, and the mark of a stop the service made itself (E.6). Both are device params, because they are bookkeeping of this regulation loop and not properties of the equipment, and both are carried over when the edit form saves the device, which knows nothing of them.

The previous revision kept all of it in `t_variable` under `THERMOSTAT_<FEATURE_KEY>_<SUFFIX>`, with the ownership check, the `postDelete` cleanup and the `/state/:variable_key` route that came with it. All of that goes: a feature is deleted with its device, and read by everything that reads devices.

**Not on the dashboard.** See `docs/specs/dashboard-flexible-layout-and-widgets.md` E2: the widget carries `thermostat_feature` and nothing else. A control loop that actuates real heaters must not read its settings from a per-user dashboard document.

### A.3 The feature pickers start from the thermostat's room

A house has hundreds of features, and the pickers listed every one of them: choosing the salon's sensor meant scrolling past the bedrooms' and the garage's. Each picker therefore lists, by default, **the features of the devices in the room chosen for the thermostat**. A "Show the devices of every room" switch widens all of them at once, for the cases where the room is not the boundary — an open-plan salon and kitchen heated as one, a boiler contact in the cellar, a heat pump whose device sits in another room. Widening is a display choice, not a setting: it is not saved.

Narrowing never hides a choice already made. A feature saved on the thermostat that lives in another room is still listed, so opening a thermostat configured with the kitchen's door does not silently blank that field; it carries its room in its label, so it cannot be taken for a device of the thermostat's room. Once widened, every entry carries its room in its label (`Room - Device - Feature`), since two rooms often have devices of the same name. With no room chosen yet, nothing narrows the lists.

### A.4 Presence sensors

A room nobody is in needs no comfort, and a weekly programme cannot know that the office stays empty on a day off or that everybody went to bed early. `THERMOSTAT_PRESENCE_FEATURE` names the room's motion or presence sensors — `motion-sensor` or `presence-sensor` features of the `binary` type, `1` for someone and `0` for nobody. The `push` types only say that something happened, never that it stopped, so they cannot tell an empty room and are not offered. The pickers follow the room like every other one (A.3), and the loop checks the category and the type again: a feature of any other kind named in the param — by a client writing it directly, or a sensor re-typed since — is left out.

**Empty is when all of them see nobody.** The reverse of the windows (A.1.1): one sensor seeing someone is enough for the room to be occupied, and the room is taken as empty once every sensor that reports has read `0` for `THERMOSTAT_PRESENCE_DELAY` minutes, counted from the **last** one to go quiet. The count runs from the moment the `NEW_STATE` listener saw a sensor go to `0`, for the reason the window delay gives (C, step 1): `last_value_changed` moves on every report, and a sensor re-reporting "nobody" would restart it each time. A sensor found on `0` with nothing recorded — after a restart — is taken as quiet since its `last_value_changed`, and that time is kept. A sensor that cannot be read, or has never reported, is left out; one whose value went back to none also forgets its time, so its next `0` starts a new count, while one whose lookup fails keeps it; with none left the room is **never** taken as empty — a motion sensor on a flat battery must not leave the house on eco for good. The default delay is half an hour, because a motion sensor does not see someone reading on the sofa; it is bounded from one minute to a day.

**What it changes is the preset regulated on, and only towards a saving.** At step 3 of the loop (C), the preset resolved — the programme's point, or a preset picked by hand — is replaced by `THERMOSTAT_PRESENCE_PRESET` (`eco` by default; `night`, `away` or `frost`) when that one is cooler in heating, or warmer in cooling, and left as it is otherwise: eco at 18 °C must not raise a bedroom whose programme is already on frost protection at night. A pilot-wire heater only heats, and is compared as heating. One that regulates itself (C.1.1) never gets a setpoint, so it is weighed on the orders the two presets are set to, from the least heat to the most: off, frost protection, eco, comfort −2 °C, comfort −1 °C, comfort. Since it all goes through the preset, it works the same on the three kinds of thermostat: a virtual one regulates on the lower setpoint, an external one is written it, a pilot-wire one is sent the preset's order.

- **Never over a setpoint set on the dial**, in the widget, on the device or by a scene: someone just asked for that temperature, in that room, and it lapses on its own (C, step 2). A preset picked by hand is lowered like the programme's point — Comfort picked for the evening keeps nobody warm once everybody is in bed — and it is told apart from a turn of the dial by its hold matching that preset's own setpoint, in the hold's unit (C.3).
- **The window and the stop outrank it**, being steps 1 and the stop before it: an open window still suspends the heating, a stopped thermostat stays stopped, and an `off` point stays off.
- **The `preset` feature is not written.** It keeps reading `schedule`, or the preset picked, and the dashboards are still told the programme's point: the programme and the choice come back by themselves when someone is seen. What is regulated on is what `active-preset` says (B.4), so a scene can start on "the salon went to eco".
- **Coming back is immediate.** A sensor seeing someone after it had been quiet for a delay runs a regulation pass at once, debounced like every other one. A motion sensor goes back to `0` a minute or two after each movement, so a sensor seeing someone *before* the delay ran out runs nothing: the room was never taken as empty. Going empty needs no timer of its own: the delay is in minutes, and the minute tick is soon enough.
- **The records are memory**, cleared when the service stops, like the window openings: someone may come and go meanwhile.

The widget reads the same sensors and shows a banner — "Nobody seen since 10:42 — Eco" — when the absence preset is the one regulated on, by the same rule. The gauge shows the lowered setpoint — in cooling too, whose preset bar only has Off and Comfort — and the preset bar keeps the preset picked or followed; on a heater regulating itself, the order the card waits for is the absence preset's. The card counts from what it reads itself, so the banner can come up to a minute before the pass that applies it, and after a reload it counts from the sensor's `last_value_changed` rather than the server's record.

A house-wide presence — everybody's phone gone — is a different input, kept for the house modes (G).

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

A virtual thermostat therefore carries **five** features, not one:

| Type                 | Unit                     | Written by                                              | Read by                   |
| -------------------- | ------------------------ | ------------------------------------------------------- | ------------------------- |
| `target-temperature` | `celsius` / `fahrenheit` | the loop, the widget, scenes                            | everything                |
| `preset`             | —                        | the widget, scenes, the loop (on a schedule transition) | everything                |
| `active-preset`      | —                        | the loop                                                | scenes, everything        |
| `mode`               | —                        | the widget, scenes                                      | everything                |
| `operating-state`    | —                        | the loop                                                | the widget's heating halo |

`operating-state` replaces the widget's inference from the switch state: a virtual thermostat knows whether it is currently heating, and saying so on a standard feature makes it visible to HomeKit and to the rest of the house, not only to this widget.

An **external** thermostat mirrors **none of the real device's features** (A.0): its setpoint and its operating state are features of the real device, and mirroring them here would give the house two sources that drift apart.

Two exceptions prove the rule, and both are Gladys's own state rather than the appliance's:

- its **`preset`** and **`active-preset`** — no real thermostat publishes Gladys's preset vocabulary, and the preset is genuinely this integration's state, not the device's;
- its **`mode`**, which carries one decision: whether Gladys has stopped this thermostat. "Stopped by Gladys" is not something the appliance knows — an external thermostat that heats on its own is doing what it was built to do, and `THERMOSTAT_MODE.OFF` here is what tells the loop to stop writing to it and the widget to show it stopped. It is distinct from `THERMOSTAT_MODE_FEATURE`, which names the **real device's** mode on the real device, and which this service writes when one exists (C.0). A device may have both, one, or neither.

These three features, and no others, are what an external thermostat carries.

### B.4 The preset in force

The `preset` feature is the standing choice, and while the thermostat follows its programme it reads `schedule` whatever the current point is. It has to: storing the point the loop resolved would read as a deliberate choice on the next pass, and the thermostat would stop following its programme for good (C). The consequence is that the feature does not change when the programme moves from `comfort` to `frost`, so no `NEW_STATE` is emitted and **a scene listening to it never starts on a programme change** — only on a preset picked by hand. The dashboards were never affected, because the loop announces the point in force over the WebSocket (`thermostat.preset-updated`), but that message does not reach the scene engine.

`DEVICE_FEATURE_TYPES.THERMOSTAT.ACTIVE_PRESET` carries the preset in force instead, read-only and written by the loop through `saveState`, so a scene trigger sees it change. Its `THERMOSTAT_ACTIVE_PRESET` enum takes `THERMOSTAT_PRESET`'s integers for the five temperatures, and `0` — `schedule` there, which is never in force — means stopped:

| Value   | Name                | Written when                                                                                          |
| ------- | ------------------- | ----------------------------------------------------------------------------------------------------- |
| `0`     | `OFF`               | the mode is `off` (stopped by hand), or the programme's point is `off`                                |
| `1`–`5` | `FROST` … `COMFORT` | that preset is in force: the programme's point, or a preset picked by hand (with or without its hold) |

It is written only when its value changes, so the minute loop starts no scene on its own. The scene editor offers the presets by name for this feature, not the raw number: nobody should have to know that Comfort is `5`. The write is a report only, made before the actuation on every path: one that fails is logged and the pass goes on. Three cases leave it as it is: an open window, which interrupts the heating but not the preset; a hold taken on the dial, which names no preset; and a programme with no point in force, which keeps its setpoint (C).

Thermostats created before this feature get it from the migration `20261023000000-add-thermostat-active-preset-feature`, with the external_id `createDevice` builds (`<external_id>:active-preset`), so their next save from the edit form matches it rather than adding a second one. It is created without a value, and the loop writes it within the minute.

## C. Regulation loop

A single `setInterval` in the service ticks every 60 s and calls `applySchedules`, which regulates every thermostat device in parallel and isolates a failing device from the others.

**Order of decisions**, per device. Steps 1 to 3 are identical for every device type — that is the whole point of the design; only steps 4 and 5 differ.

1. **Window open** — if window sensors are configured and **any** of them has read `0` for `THERMOSTAT_WINDOW_DELAY` seconds (A.1.1), the pass stops after suspending the heating: the switch is cut or the pilot-wire heater is sent `FROST_PROTECTION` (virtual, C.1.1), or the device is stopped (external — `OFF` on its mode feature when it has one and it is a thermostat mode, an `air-conditioning` mode having no `off` (A.0.3); then its power off when it has one; otherwise the stop setpoint: frost protection when it heats, the top of its range when it cools, C.0). Until the delay has run out, the thermostat regulates as if the window were closed. A `NEW_STATE` listener applies the same cut without waiting for the next tick — at once with a delay of `0`, otherwise through a regulation pass run when the delay ends — on every kind of thermostat, and stops an external thermostat through the **same path** — mode, power, or stop setpoint. It does not look for a switch or a local setpoint feature first: an external thermostat has neither, and a listener requiring one would leave its heating running until the next tick.

   **The delay.** A door opened to come in and closed right behind should not cut the heating, so a sensor has to stay open a while first — one minute by default. The count runs from the **opening**, which the service records in memory when the listener sees a sensor go to `0`. The feature's `last_value_changed` cannot say when: it moves on every report, and a contact re-reporting "open" would restart the count each time, handing the heating back for a minute on every report. A sensor found open with no opening recorded — after a restart, or an event missed — is taken as open since its `last_value_changed`, and that time is recorded so that its next reports do not move it. A sensor that closes drops its opening, and the next one starts a new count. A thermostat watching several sensors (A.1.1) waits on each of them apart, and the delay also decides who wins elsewhere: a press on a pilot-wire module, or an air conditioner switched on from its remote during an `off` point, is only refused once a window has suspended the heating. The widget shows the "window open" banner on the same delay, once any of its sensors has been open that long, counted from the opening it knows of, and bounded like the server's. A widget loaded while a window is already open only has `last_value_changed`, so for a sensor that re-reports "open" its banner can come up to one delay after the server's cut — at most an hour, and only until the page next sees the window close.

2. **Manual hold** — if a hold is armed and has not expired, the loop regulates on the held setpoint — unless it is a preset picked by hand and the room is empty (A.4), which goes on to step 3 on that preset. On expiry it clears the hold, writes `schedule` back on the `preset` feature and falls through to the schedule.
3. **Target preset** — when the `preset` feature reads `schedule`, the last transition point at or before now (E.3), which is broadcast to the dashboards without being written on the feature (E.3); otherwise the preset the feature carries. When the room is empty (A.4), the absence preset replaces it if it saves energy, and that is what is regulated on and written on `active-preset`. With the feature on `schedule` and **no point in force** — no schedule followed, or one with no point — the thermostat keeps the setpoint it has: a virtual one regulates on its setpoint feature, nothing is written to an external one, and the preset is still pushed to the widgets when a hold has just ended. Resolving `schedule` as a preset fell back on the 20 °C default and heated a room nobody had asked to heat.
4. **Setpoint** — on a virtual thermostat, saved on this service's own `target-temperature` feature when it changed, alongside `operating-state`. On an external one, **written onto the real device** through the core, which routes it to the owning integration, preceded by its **power** and then its **mode** when the device exposes them (section C.0). A pilot-wire heater that regulates itself (a `pilot-wire` thermostat) stops here too, like an external thermostat: it is handed the preset's order and regulates alone (C.1.1).
5. **Actuator** — **virtual only**: the switch, actuated only when its state differs from the computed one, or a pilot-wire heater Gladys regulates, sent comfort or frost protection on the same hysteresis — never TPI (C.1.1).

### C.0 An external thermostat stops at step 4

There is no step 5, and no hysteresis or TPI computation at all: the real thermostat runs its own heuristic off the setpoint it was given, and a second control loop would fight it. This is the entire difference between a virtual and an external thermostat; a `pilot-wire` one stops at step 4 for the same reason (C.1.1).

Stopping has no setpoint of its own. On an external device it is expressed two ways at once, and which one the thermostat actually obeys depends on the device:

- **`THERMOSTAT_MODE.OFF` on `THERMOSTAT_MODE_FEATURE`**, when the real device exposes a mode. This is the actual stop, and it is written **first**. The setpoint alone leaves such a thermostat in `heating`: it stops aiming at 21 °C, but it fires again as soon as the room drops below 7 °C, and its own screen still reads "heating". An `air-conditioning` mode has no `off` and is left untouched here (A.0.3);
- **`0` on `THERMOSTAT_POWER_FEATURE`**, when one is configured — the stop of a device whose mode cannot say `off`, an air conditioner first of all (A.0.3). Written right after the mode, and **last**: no setpoint follows a power cut. Most air-conditioning stacks take a setpoint command as "turn on and aim at this", and MELCloud rebuilds each write from a snapshot of the unit that may still read powered on — the setpoint would undo the stop. A power that cannot be cut — its feature gone, or the write failing — is no stop: any other device falls back on the setpoint below, while an air conditioner still gets none, and the stop is retried by the next pass, which writes the power again;
- otherwise the **frost-protection setpoint** — the fallback for a device with no power feature, written after the mode when there is one, and the only way to say "stop heating" that every thermostat understands. A **cooling** thermostat is given the top of its range instead (`THERMOSTAT_MAX_TEMP`, clamped to the device's own maximum): the frost setpoint asked an air conditioner to cool as hard as it could, which it did whenever it had no mode feature or the mode write failed.

**The order matters in both directions.** Stopping writes the mode, then the power — or, with no power configured, the setpoint; starting writes the power, the mode, then the setpoint — a unit that is powered off ignores a mode as surely as a setpoint. Writing the frost setpoint first to a thermostat still in `COOLING` asks it to cool the room to 7 °C until the mode write lands — and to keep doing so if that write fails on an expired token or the 5 s budget, which is the opposite of suspending it. Symmetrically, a device still switched off takes a new setpoint and does nothing with it. In both directions the mode precedes the setpoint, because the mode is what the machine obeys; on a start the power precedes the mode.

The mode is handed back to `heating` (or `cooling`, from `THERMOSTAT_MODE`) as soon as a heating preset takes over. The same applies to a manual setpoint, whether it comes from the widget dial, a scene or the device API, and to a start written on the thermostat's own `mode` feature, which writes the real device's mode at once (D.0) rather than at the next pass: the widget sends its setpoint right behind the start, straight to the real device's feature, and left to the pass the mode reached the appliance two seconds after it. Like the setpoint, a mode write is skipped when the device already carries it, and clamped to the feature's `max`: a heating-only thermostat declares `max = 1` and would reject `COOLING`. An `air-conditioning` mode is translated into `AC_MODE` instead of clamped (A.0.3). The power is handed back (`1`) at the same moments as the mode, right before it, and skipped the same way when the device already reads `1`.

Four properties of that write, each one required by a different vendor:

- **Converted into the target feature's unit.** A thermostat configured in celsius pointing at a fahrenheit device would otherwise write `21` where the device reads 21 °F. MQTT/Home Assistant takes its unit from the discovery payload, so the mismatch is reachable in practice. The converted value is rounded to what a device in that unit displays — a whole degree Fahrenheit, half a degree Celsius: 21 °C is 69.8 °F, a device echoes back `70`, and an unrounded value would never compare equal to it.
- **Snapped to the feature's `step`** when it declares one. A device only takes multiples of its step and reports the multiple it settled on; without the snap the skip below never matches, the setpoint is re-written every minute, and its echo looks like a change made on the device (C.0.1).
- **Clamped to the feature's own `min`/`max`.** Netatmo advertises 5-30, Zigbee 5-40, Matter -100-200. A value outside the range is rejected or silently clamped by the integration; clamping here is where it can be logged.
- **Skipped when the value already matches.** Several of these integrations call a cloud API on every write, and re-sending an unchanged setpoint once a minute would burn the rate limit for nothing.

A write that fails — an unreachable integration, an expired cloud token, an external integration that does not acknowledge the command within the core's 5 s budget — is logged and swallowed: one dead thermostat must not stop the others, and the next tick retries it anyway since the value still differs.

### C.0.1 The device is a second writer, and wins

A real thermostat has its own dial, its vendor app and often its own internal programme: Gladys is **not** the only thing that writes its setpoint. Left alone, the loop would re-apply the stored preset on the next tick and silently undo whatever was set on the device — once a minute, for ever. From the outside this reads as an unstable thermostat: a value set on the vendor app reverts a moment later, sometimes before the app has even finished sending it.

A setpoint change observed on a driven thermostat is therefore held exactly like a turn of the widget dial: the hold is armed (`THERMOSTAT_MANUAL_SETPOINT` and `THERMOSTAT_MANUAL_UNTIL`), and the loop stops imposing the schedule. With a schedule the hold lasts `THERMOSTAT_MANUAL_DURATION` when the device sets it, or runs to the next transition when it does not (E.3), and the programme then resumes; without a schedule it is permanent, like on a physical thermostat (section D).

**Telling our own write apart from a real one.** Gladys's own write comes back as the same `NEW_STATE` event. Taken at face value it would arm a manual hold on _every scheduled write_, so the schedule would suspend itself the moment it applied.

Consuming **one** echo per write is not enough, and this is a real failure mode rather than a theoretical one. Zigbee2MQTT reports periodically and Netatmo is polled every two minutes, both re-emitting the value **unchanged**. The first report is consumed as the echo; the second, identical, is taken for a setting made on the device, which arms a hold and rewrites the same value to the equipment — a cloud call per poll — whose own echo is then consumed, and the next report starts again. The visible result is a thermostat stuck in "manual" for ever, schedule transitions delayed by the hold duration, and exactly the API burn C.0 exists to avoid.

**A change is therefore what differs from the previous report**, not what arrives after our own write. Two marks serve this, both in memory:

- the last value this service **wrote** on each selector. It is kept rather than consumed, and compared against: an identical report is ours however many times it repeats. The "already at X" branch of the setpoint write records it too — nothing goes on the wire there, but that value is still the one Gladys stands behind, and an integration re-reporting it must not look like a turn of the dial.
- the last value **observed** on each selector, whatever wrote it. A hold is armed only when a report differs from it.

The second is what a restart needs. Both maps live in memory, and the written-value one is empty when the process starts — the observed one is seeded from the database, see below. The integration then reconnects and re-reports the setpoint the schedule had already applied. On the first mark alone that unchanged value reads as a setting made on the device, so **every update, reboot or power cut left an external thermostat in "manual" until the next slot**, with nobody having touched anything. Worse, when the write at startup failed because the integration was not connected yet, the appliance still carried an older value, and that stale setpoint was the one held — for hours, a whole night across a schedule point.

The observed value is recorded **before** the written-value check, not after: a report that check swallows is still a report, and leaving the reference unset there would make the next genuine turn of the dial look like a first report and go unheld.

**The reference is seeded at service start from the setpoint feature's own `last_value`**, before the `NEW_STATE` listener is attached. That stored value is what Gladys last knew the device to be at, which is exactly what a report has to be compared against. It is seeded again whenever a thermostat is updated (`postUpdate`): a target re-pointed in the edit form, or by a device migration, would otherwise have no reference, and the first turn of the new appliance's dial would only establish one — the next pass then wrote the scheduled setpoint back over it. The references of a selector no thermostat targets any more are dropped at the same time.

Treating an absent reference as "record this report and arm nothing" is not enough, and is a bug of its own: the first genuine change after a restart _is_ that first report. A setpoint turned on the thermostat seconds after a restart was then dropped, and the next regulation pass overwrote it. On a device that only reports its changes — as Zigbee ones do — no further report would ever come to establish the reference, so the first change after **every** restart was lost.

Seeding covers both restart cases the marks exist for: an appliance still at the scheduled value reports that same value and arms nothing, and one left on an older value while Gladys was down reports the value the database also holds, so nothing is held and the minute loop writes the scheduled setpoint back. A change made _during_ the downtime does differ from the stored value and is adopted as a hold, which is the right answer — nobody else asked for it.

It has to be seeded rather than read when a report arrives: `device.saveState` persists that report on the same event, so a read from the listener races the write and may come back already carrying the new value, which would compare equal to itself and never arm a hold. A thermostat added after the service started has no seeded reference, and its first report establishes one.

**Holding a change costs nothing on the wire.** The hold is armed directly — the param is written and the websocket sent — rather than routed through the setpoint write path. The device already carries this value, since it is what it just reported: writing it back would be a cloud call or a Zigbee message per turn of the dial, and the write path hands the running mode back first (C.0), kicking a thermostat that was in `auto`, `off` or its own vendor programme (G) into heating or cooling. The value is stored in the feature's own unit, which is the unit a hold on an external thermostat is stored in (C.3).

**The power is a second writer too.** Every air conditioner has an off button on its remote, and the loop hands the power back (`1`) on every pass while a heating preset or a hold is in force (C.0): a unit switched off from its remote came back on within a minute. A power report is therefore followed with the same two marks, kept per power selector — but **not seeded**: the first report after a start establishes the reference. A whole house losing power restarts Gladys and the unit together, and the unit comes back off; compared with the stored `1`, that report read as the unit switched off from its remote, and stopped the heating. Missing a remote press made while Gladys was down costs one pass powering the unit on again. The mark of a power write that fails is **kept**: the core gives up after 5 s, and a cloud like MELCloud may obey after that, so the report of that cut must still read as this service's. A write that got nowhere leaves the unit as it was, and its reports then match the reference. A report that differs is followed this way:

- a power switched **off** on the device, during an `off` point of the programme the thermostat follows, undoes what kept the unit on: the hold goes (a unit switched on from its remote then, see below), or the preset picked by hand goes back to `schedule`, and the `off` point keeps the unit off. Stopping the thermostat there left it stopped past that point: Comfort at 06:00 never started, then or any day after;
- a power switched **off** on any other point stops the thermostat **until the programme's next point**: `OFF` is written on the thermostat's own `mode` feature through `setValue` (D.0), which drops the hold, then `THERMOSTAT_REMOTE_STOP_UNTIL` records that point, and the first pass past it writes the running mode back and regulates. A report of a cut is also what a write that timed out after the unit obeyed, or a unit coming back off after a power cut, looks like: kept like the widget's Off, that stop left the house without heating until someone noticed. Any mode written in the meantime, from Gladys or from the remote below, lifts it sooner. The running mode is written before the end is cleared, so a write that fails leaves the end for the next pass to retry; and a stop whose end cannot be recorded — tried twice — starts the thermostat again rather than leave it off with nothing to start it. On a thermostat that follows no programme, or one with no point, there is no next point: the stop is kept like the widget's, until someone starts it again, and `THERMOSTAT_REMOTE_STOP_UNTIL` reads `unit` — no end, but still the mark of a stop the unit made. When the stop is lifted at the next point, a thermostat on a programme is handed back to it: its preset goes back to `schedule` and any hold is dropped. A preset picked by hand before the stop lost its hold with it, and left on the feature it read as a standing choice: the thermostat never followed its programme again, and the next `off` point kept the unit on at 21 °C;
- a power switched **on** on the device starts again the thermostats **the unit stopped** — those carrying the `THERMOSTAT_REMOTE_STOP_UNTIL` mark, with or without an end — and leaves alone one stopped from Gladys, whose stop clears that mark. A heating thermostat stopped by hand for the season was otherwise started by every remote press on the air conditioner its cooling twin runs, and the two then wrote the unit's mode in turn on every pass. A unit only one thermostat drives is the exception: the press can only be meant for it, and left stopped it would switch the unit straight back off. To start one, the running mode (`heating` or `cooling`, from `THERMOSTAT_MODE`) is written on that `mode` feature, the same way. It starts **on the setpoint the unit carries** when that setpoint is not the last one Gladys wrote: a remote sends its whole state with each press, so switching the unit off with 21 °C on the remote reports the power cut and the new setpoint in the same poll, and the stop drops the hold that setpoint had just armed — in whichever order the two land. The unit keeps the setpoint, since an air conditioner is stopped through its power and no setpoint follows, so it is held (`THERMOSTAT_MANUAL_SETPOINT`, in the feature's own unit, C.3) before the start, whose regulation pass would otherwise write the preset's setpoint over it. A unit still on the setpoint Gladys wrote starts on the preset or hold in force, and with no mark — the service restarted since — nothing is held.

**A trade-off on integrations that only report changes.** The power reference is not seeded (above), so after a restart the first report establishes it. An integration that polls the unit, like MELCloud, reports the power at once and the next press is followed. One that only reports a change, as most Zigbee ones do, sends nothing until the unit moves: the first switch-off from the remote after a restart then only establishes the reference, the next pass powers the unit on again, and only the second press is followed. That costs one press, once per restart. Seeding the reference from the stored value would avoid it, but turns a whole house's power cut into a stopped thermostat, which is the worse failure.

The mark records the power Gladys stands behind, not only the writes that went on the wire: a power already in the wanted state is marked too, or a unit Gladys found already off and then powered on from its remote would match a stale mark and go unnoticed. A unit powered on from its remote during an `off` point of the programme the thermostat follows is a decision, like a turn of its dial: the setpoint the unit carries is held until the next point (D), and the pass that runs at once keeps the unit on rather than cutting it within the minute. A hold already armed, and a preset picked by hand, are left as they are. A unit powered on with a window open is still not followed: the window wins, and the next pass powers it off again.

The setpoint marks apply to external thermostats, and to the order of a pilot-wire heater (C.1.1), which has a button and often an app of its own; the power marks to external thermostats only. A virtual thermostat otherwise has no second writer — Gladys owns its setpoint feature — so its own writes must never arm a hold.

The selectors driven by this service are cached and rejected cheaply, in the same pass that builds the window-sensor set: `NEW_STATE` fires for every feature in the house, and neither check may cost a query.

### C.0.2 The setpoint must be written on the owning device

`gladys.device.setValue` routes on `device.service.name`. An external write therefore has to be handed **the device that owns the feature**, resolved from the selector — never this service's own thermostat device, which would route the write straight back into this integration's `setValue` and loop for ever.

### C.1 Timezone

Schedules are wall-clock times **in the house**. `getCurrentDayAndMinutes` therefore reads the day and minute in the timezone from `SYSTEM_VARIABLE_NAMES.TIMEZONE` (default `Europe/Paris`), like scenes, DuckDB and the energy jobs do — the official Docker image runs in UTC, so relying on the process timezone would fire a 07:00 comfort transition at 08:00 or 09:00 in France.

**Every reader falls back on the same default.** The setting only exists once it is saved in Settings › System — onboarding does not create it. The loop and `holdExpiry` fell back on `Europe/Paris` while the schedule API fell back on the process timezone, so on any server not running in Paris the widget showed one point while the thermostat applied another, and a detach or a deleted schedule left the thermostat on the wrong one. All of them use the shared `DEFAULT_TIMEZONE` of `server/utils/constants.js`.

The matching lives on the **server only**. The widget is handed `current` and `next` already computed (E.5) and never reads the timezone, so there is nothing to keep in agreement between two implementations — and no reason for a schedule helper to be importable from the frontend build. The interval algebra that used to be shared (`applySlotToDay`, `mergeIntoSlots`) does not survive the move to transition points (E.0); what is left is "the last point at or before now", which the loop does once per tick.

This is also what removes the class of bug where a phone abroad, or a laptop left on another zone, displayed a preset other than the one actually heating the house.

### C.1.1 Pilot-wire heaters

A French pilot-wire heater is the most common case after the relay, and it is not a switch: it keeps its own thermostat and takes **one of six orders** on a command wire — off, frost protection, eco, comfort, and the two derived comforts a heater computes itself. Cutting its supply is not how it is stopped.

It is therefore a second kind of actuator in the same slot. An order carries no temperature: on eco or comfort the heater regulates on a setpoint of its own, set on its body, and ignores the one Gladys shows.

**Who regulates is said by the thermostat type** (A.0), and each type shows its own settings: a virtual thermostat offers a switch **or** a pilot wire as its actuator, and a `pilot-wire` thermostat its pilot wire and an order per preset. A real thermostat (`external`) stays what it was — a setpoint, a state, a mode — and never carries a pilot wire: a connected thermostat or a heat pump is not a pilot-wire heater.

Two earlier attempts were dropped. A separate "who regulates?" setting repeated the type. Offering the pilot wire on a real thermostat, in place of its setpoint, hid the setpoint fields as soon as a pilot wire was left in the form, with no word of why. Before both, a room sensor configured meant Gladys regulated — but a sensor may be wanted for display alone. A real thermostat saved with a pilot wire during those attempts is read, shown and saved again as `pilot-wire`.

**A `pilot-wire` thermostat — the heater regulates (`heater`).** The thermostat stops at step 4 like an external thermostat (C.0): each preset sends the order it is set to (table below), and the heater regulates alone on its own setpoint. A room sensor, if any, is only displayed. Eco is eco. It is not "external" for the rest of this spec (`isExternal` is false): it drives no real setpoint, owns its `target-temperature` feature and carries the state features of a virtual thermostat. `createDevice` clears `THERMOSTAT_TARGET_FEATURE`, `THERMOSTAT_STATE_FEATURE`, `THERMOSTAT_MODE_FEATURE` and the switch on it, and requires its pilot wire and the setpoint feature a virtual thermostat requires.

**A virtual thermostat with a pilot wire — Gladys regulates (`gladys`).** It needs a room sensor, as any virtual thermostat does: the form requires a sensor and an actuator, a switch or a pilot wire. Gladys regulates at step 5 like a switch, on the setpoint the thermostat carries (or the held one, below), and **the wire is used as a switch**:

- below `setpoint − THERMOSTAT_HYSTERESIS_START`, `COMFORT` is sent, whatever the preset — `off` aside, which has no setpoint and always sends `OFF`;
- above `setpoint + THERMOSTAT_HYSTERESIS_STOP`, `FROST_PROTECTION` is sent — the standby that still guards the room against frost;
- in between, the heater keeps doing what it does: it counts as heating when it carries an order other than `OFF` or `FROST_PROTECTION`.

Comfort whatever the preset: the preset only sets the temperature Gladys aims for. Sending `ECO` to heat would hand the decision back to the heater's own thermometer — the one this mode exists to set aside — three and a half degrees below its comfort, and a room under eco's setpoint could stay cold. The heater's own comfort setpoint is set high (24 °C, say): the heater then obeys Gladys, and that value remains a safety ceiling should Gladys stop while comfort is sent. The edit form says so. This is how Versatile Thermostat drives a pilot wire in Home Assistant (`over_switch`: comfort on, frost protection off), and it means eco picked in a room above 18 °C puts the module on frost protection: the widget says why in a banner under the gauge ("Standby: setpoint reached" / "Heating").

A virtual thermostat saved without a sensor (through the API — the form refuses it) has nothing to regulate on, and is read as `heater`. A sensor that is gone, cannot be read or has no reading falls back on the preset's order for that pass, rather than leaving the room unheated.

A pilot-wire heater only heats, so the bands are always the heating ones, whatever `THERMOSTAT_MODE` says. TPI is not used: switching orders within a cycle is Zigbee traffic for a heater whose own thermostat already smooths the output. The edit form does not offer it once a pilot wire is picked, switches a TPI already chosen back to hysteresis, and saves hysteresis for a pilot-wire thermostat; it hides the tuning section on a `pilot-wire` thermostat, as it does on a real one, and the use and temperature-range fields too: such a heater only heats, and takes no setpoint for a range to bound. It is saved as heating. **Cooling is held the same way**: the form does not offer it with a pilot wire, switches a cooling mode back to heating, and saves `heating`. `createDevice` applies both rules to any thermostat carrying a pilot wire, so a client writing the params directly cannot save a cooling or TPI pilot-wire thermostat either.

Under `heater`, a heater takes no temperature, so the presets table of the edit form sets an **order** per preset instead of a temperature, saved as `THERMOSTAT_PILOT_WIRE_ORDER_<PRESET>`. A value that is not a `PILOT_WIRE_MODE` falls back on the default:

| Preset    | Default order      |
| --------- | ------------------ |
| `off`     | `OFF` (fixed)      |
| `frost`   | `FROST_PROTECTION` |
| `away`    | `FROST_PROTECTION` |
| `eco`     | `ECO`              |
| `night`   | `ECO`              |
| `comfort` | `COMFORT`          |

`away` is frost protection, as Home Assistant's pilot-wire climate does: nobody is home. `night` is eco, the order a heater's own programme gives the night. Comfort -1 and -2 stay on offer in the table; a user who wants night to differ from eco picks one. The preset setpoints stay stored — a hold is still keyed by them, below — but the form does not show them. The presets themselves stay Gladys's, not the six orders: a schedule belongs to the house and is shared by every thermostat in it, virtual, real or pilot-wire, and scenes pick presets too. The banner under the widget's gauge names the order the module carries, which is what links the two vocabularies (below).

**The widget** has no setpoint to offer under `heater`: the gauge draws no setpoint arc and no knob, and takes no drag, arrow key or + / − press. The room temperature takes the middle, where the setpoint would be, and the ring is drawn whole, in the colour of the order the module confirms (the derived comforts in comfort's). Under it, a banner drawn like the card's others names that order ("Order: Comfort"). Until the module confirms the order the lit preset is set to — a few seconds on Z-Wave — the banner says it is on its way instead, greyed ("Sending the Comfort order…"): a ring in one preset's colour under another preset's lit button read as a wrong order. The order expected is the one actually sent: off when stopped, window open or not, frost protection with a window open, and an order the module does not take as `supportedPilotWireOrder` turns it; any comfort the module carries counts for comfort. A preset held from the card already has its banner, "Comfort until 06:30": the order banner is then left out while it would only repeat it, and stays for an order on its way or one other than the preset's own (comfort -1 pressed on the module). The presets are the only control, each sending its order. The thermostat's card on the integration page shows "Regulation: by the heater" in place of a setpoint it does not have.

Like every other write, an order already carried is skipped: several of these heaters are Zigbee, and re-sending an unchanged order once a minute is traffic for nothing. A stop by hand sends `OFF`, and a window opening sends `FROST_PROTECTION`, rather than actuating a switch the thermostat does not hold — on a window, at once from the `NEW_STATE` listener as well as on the next pass, like the switch and external paths. Frost protection rather than off on a window, as the external path writes the frost setpoint: `OFF` also turns the heater's own frost guard off, for a window left open on a winter night. A heater **stopped** already keeps its `OFF` when a window opens: frost protection would only raise it, and the closing drop it back to off.

**A window closing runs a pass at once** (debounced like every other trigger), for every kind of thermostat: waiting for the next tick left the heating off for up to a minute, and a pilot-wire card said its order was on its way all that time. Only a closing the listener saw open does: a contact re-reports its state, and every report of a window closed for hours would otherwise run a pass. Nor does a window that closes while a delay check is still waiting on it (C, step 1): closed before its delay ran out, it cut nothing. A window that opened before the service started is closed by the next tick.

**A manual hold** (D) is a setpoint, and the wire takes no temperature. Under `gladys`, the hold is regulated on the held setpoint itself, so a turn of the dial to 19.5 °C means 19.5 °C rather than the nearest preset's. Under `heater`, the hold is turned into the order of the preset it stands for. Picking a preset by hand holds that preset's own setpoint, so the preset the thermostat carries is the answer whenever its setpoint equals the held one — even when another preset shares that value. A setpoint held from a scene (the widget offers no dial there) becomes the order of the nearest of `frost`, `eco` and `comfort`, a tie going to the warmer one: 19.5 °C between eco at 18 and comfort at 21 asks for warmth. `off` is never held (it stores no setpoint), so it goes through the preset path.

**The comfort the heater carries is kept while comfort is held**, whenever the order is the preset's rather than Gladys's regulation — under `heater`, and under `gladys` while the room sensor cannot be read and the heater regulates alone. `COMFORT`, `COMFORT_1` and `COMFORT_2` are all comfort chosen on the module itself (below): writing the order comfort is set to over another one would undo that choice within a minute — plain `COMFORT` over a `COMFORT_1` pressed, or `COMFORT_1` over a plain `COMFORT` pressed when comfort sends `COMFORT_1`. When Gladys regulates on the sensor, comfort only means "heat" and the temperature is Gladys's to decide: plain `COMFORT` is written.

**Only an order the module takes is sent.** A module may declare the orders it takes in its feature's `supported_options`; a 4-order one refuses `COMFORT_1` and `COMFORT_2`. Written anyway, the order was refused, written again on every pass, and the widget said it was on its way for ever. A derived comfort the module does not take is sent as `COMFORT` when it takes that, and `FROST_PROTECTION` is sent as `OFF` — both are standby, and a module that cannot hold frost protection would otherwise be left on comfort with a window open, or above the setpoint when Gladys regulates. Any other order it does not take is not sent, and the heater keeps the order it carries (`supportedPilotWireOrder`). The presets table of the edit form only offers the orders the module declares, and the widget expects the order actually sent. A feature that declares no option is sent every order. Not every integration fills `supported_options` yet — Zigbee2MQTT's `pilot*wire*mode` does not — so a 4-order module behind one of them is still sent comfort -1 or -2 when a preset is set to it, refused, and sent again on every pass: pick an order the module takes in the presets table for such a heater.

**An order changed on the module is taken as that preset picked by hand.** The change can come from the heater's button, the vendor app or the module's own scene. It is a decision by whoever made it, and the loop would otherwise undo it at the next pass. It goes through the same write path as the widget (D.0): the preset is saved on the `preset` feature and a hold is armed on its setpoint. Which preset an order stands for depends on who regulates (`presetForPilotWireOrder`):

- under `heater`, it is **the preset set to send that order** in the presets table. When several send it, the one named after it wins, in this order: `frost`, `eco`, `comfort`, `night`, `away` — frost protection is `frost` rather than `away`, eco is `eco` rather than `night`. With night set to `COMFORT_2`, a press of comfort -2 is `night`;
- an order no preset sends, and every order under `gladys` — where the module only ever carries comfort or frost protection from Gladys, and comfort only means "heat" — falls back on the fixed vocabulary: `FROST_PROTECTION` is `frost`, `ECO` is `eco`, and `COMFORT`, `COMFORT_1` and `COMFORT_2` are `comfort`. A derived comfort is a heater-side variant of comfort, not a temperature Gladys knows. The hold expires like every hold: after `THERMOSTAT_MANUAL_DURATION` when the device sets it, otherwise at the next transition point, and never without a schedule (D).

Holding the setpoint alone is not enough. A pilot-wire heater's eco and comfort temperatures are set on the heater itself, and Gladys's preset setpoints are nominal values. With eco and comfort at the same value, the loop could not tell which order was pressed, and a preset picked earlier in the widget would win over the module. Saving the preset is what makes the press stick.

The detection is the one of C.0.1, keyed by the pilot-wire selector:

- the **two marks**: the last order this service wrote, kept rather than consumed, and the last order observed. The "already carried" branch of the write records its order too, and a failed write drops its mark. A report counts as a change only when it differs from the previous report and is not the order Gladys stands behind;
- the observed reference is **seeded from the feature's `last_value`** at service start and on `postUpdate`, for the same restart reasons;
- the pilot-wire selectors join the cached set of driven selectors, so `NEW_STATE` still rejects every other feature without a query.

A report that takes a preset the thermostat already carries, with a hold already on its setpoint, is not taken again: `COMFORT_1` then `COMFORT_2` is the same choice twice, and taking it again would only push the hold's expiry forward.

**`OFF` on the module is a stop, not a preset.** It is applied as a stop by hand: `THERMOSTAT_MODE.OFF` written on the thermostat's own `mode` feature, which holds until someone starts the thermostat again — from Gladys, or from the module — exactly as the widget's stop button does. The stop is marked as the module's (`THERMOSTAT_MODULE_STOP`), after the mode is written: any mode written on the thermostat clears the mark, whoever writes it. Holding the frost setpoint instead would write `FROST_PROTECTION` over the `OFF` that was just pressed.

**Another order pressed on a thermostat stopped from the module starts it again, on that preset.** The module's button is how the heater is switched on in the room: the preset is taken as above, then the running mode is written on the `mode` feature, in that order so that the regulation pass the start triggers finds the preset pressed rather than the programme's point. Writing `OFF` back over the press, as the first version did, left only the Gladys widget able to start the heater, with nothing on the module to say why. `OFF` pressed on a heater already stopped changes nothing.

**A stop made from Gladys is not lifted by the module.** The widget's stop button, a scene, the programme's Off carried over (E.6): none carries the mark, and an order the module reports then is answered with `OFF`, written back by a pass run at once. A report Gladys did not write is not always a press: a module that reboots reports the order it starts on, and a vendor programme left on changes the order by itself — either would have started a heater someone stopped on purpose, and held it for good with no schedule. The trade-off is a press on the module of a heater stopped from Gladys, which is undone: it is started from Gladys. A stop pressed on the module and followed by a reboot of the module is still lifted by the order it reboots on; nothing tells the two apart.

**Nothing but `OFF` is taken while a window is open.** It outranks a press in the order of decisions (C, step 1), stopped thermostat or not. The module already carries the order pressed then, so the listener writes the window's `FROST_PROTECTION` over it at once — `OFF` on a stopped thermostat, as the pass does — marked as this service's own, so its echo is not taken for another press, rather than leaving the heater on until the next pass; and a hold armed behind the window would resurface later as a manual mode nobody remembers. `OFF` pressed is still a stop, and the pass it triggers keeps the heater on `OFF`, window open or not. An order that is not a `PILOT_WIRE_MODE` value is ignored.

**No periodic resend.** An order already carried is never written again, and nothing re-sends it on a timer. A module that says it carries an order it does not actually carry is therefore never corrected. That can be a module that reports nothing by itself, or an integration that updates the state before the module confirms it. Fixing it with a resend every few minutes would add traffic to every heater to cover a fault in a few of them. The requirement is on the integrations instead: a `pilot-wire-mode` feature **reports the order confirmed by the module, never the one requested**. A module that cannot confirm is polled by its integration.

**`schedule` with no point in force** names no order, just as it names no temperature (C.1): under `heater`, the heater keeps the order it carries, and nothing is written. Under `gladys`, Gladys regulates on the setpoint the thermostat kept, as it does for a switch.

**The operating state** says what Gladys decided. Under `gladys` it reads `heating` when the loop asks for heat, `idle` otherwise, and `idle` on a pass that fell back for want of a reading. Under `heater` it is not written: the wire gives no feedback, the heater regulates on a temperature Gladys does not know, and reading `ECO` as heating lit the flame in a room already 3 °C above the setpoint. `OFF` reads `idle` either way. The state follows the order the heater carries afterwards. A write that fails leaves the previous order in force, so the heater is said to heat only if the loop asks for heat **and** that order is neither `OFF` nor `FROST_PROTECTION`; otherwise it reads `idle`, which also clears a state left by an earlier pass. An order that cannot be read leaves the state untouched. The widget's heating halo reads this `operating-state` when Gladys regulates, with a line under the gauge saying heating or standby. When the heater does, the widget lights no halo and names the order in a banner instead (above). One claim is retracted there, once: a `heating` left by a pass under Gladys, before the thermostat was turned into one the heater regulates, is written over with `idle` — scenes, MQTT and HomeKit would otherwise keep seeing a flame Gladys no longer stands behind — and the state is left alone after that — on every pass that writes nothing else, `schedule` with no point in force included.

A heater is driven by one actuator or the other, never both. The edit form empties the switch when a pilot wire is picked and the reverse, and saves the switch empty whenever a pilot wire is set; the loop, the window listener and the hold all take the pilot-wire branch first.

`THERMOSTAT_PILOT_WIRE_FEATURE` names another device's feature, so a device migration rewrites it like the other `THERMOSTAT_*_FEATURE` params (`device-migration.md` B.3).

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

**On `mode`** — `off` stops the thermostat: the switch is cut (virtual), or the mode is written to the real device with the frost setpoint as a fallback (external, C.0). Any other mode starts it again on whatever the preset or the hold currently says; on an external thermostat with a mode feature, the real device's running mode is written at once (C.0). Whoever writes the mode owns the stop or the start: a stop the service made on a programme's Off point (E.6) loses its mark, and the next programme attached no longer lifts it. The mark is cleared in the database, not read from the device the write hands over: for the widget, the API and scenes that is the in-memory device, whose params the core's `setParam` never refreshes.

**On an external thermostat**, none of these are merely saved: they are written onto the **real device** through the core, on the device that owns the feature (C.0.2). Persisting locally would refresh every Gladys screen while the thermostat itself only heard about it on the next tick, up to a minute later.

### D.1 The widget writes values, and nothing else

`ThermostatBox.jsx` becomes a renderer: it displays the device's features and writes values on them. It holds no state machine of its own — the previous revision wrote up to five times for one release of the dial, and each of those writes was a chance for the widget's idea of the thermostat and the server's to diverge. That whole class of race disappears when the server is the only place the state machine exists.

A single `NEW_STATE` per feature tells the widget what happened, whoever caused it: the dial, a scene, the vendor app, or the schedule.

**A preset picked elsewhere replaces a hold set on the card.** A scene or the API picking a preset arms that preset's own hold in the same write, so the card shows that preset, lit, on its temperature — even while it displays a setpoint its own dial held. Keeping that override left the card on "21.5 · Manual mode" and swallowed the preset's setpoint until a reload. The card's own pick is told apart by its value for a few seconds, since its echo can land after the write's response.

**A hold is compared with a preset in the setpoint feature's unit.** The hold is stored in that unit (C.3) and the preset in the thermostat's: Comfort at 21 °C is held as 70 on a Fahrenheit appliance, so the preset's temperature is converted the way the server converts it before the two are compared — on a reload too, once the feature's unit is known. Compared as they were, a preset picked on such a device never lit.

**A stopped thermostat stays drawn as stopped, whatever is written on its other features.** A preset written while it is off — by a scene or the API — is stored, and arms a hold, but the loop skips a stopped thermostat: nothing is applied until its mode is handed back. The widget therefore does not take that preset's event, nor the hold's, as a change of what the machine does: it re-reads the device, keeps Off lit, and shows the stored preset outlined as the one it will start back on. A hold carried by a stopped thermostat is likewise ignored on a reload. A `NEW_STATE` on the `mode` feature made outside the card — a scene, the API, another dashboard — rebuilds the card the way a reload does; the card's own mode writes are recognised by their value and skipped. A mode write comes back **twice** — the service saves the state, and so does the core, which saves it itself for a feature without feedback — so the value is remembered for a few seconds rather than for one event: the second echo otherwise rebuilt the card from a device read taken before the writes that followed had landed. Each value written is remembered on its own, so Off then Comfort tapped before the first echoes arrived does not take Off's echoes for a stop made elsewhere. Starting a stopped thermostat from its banner rebuilds it the same way, so the preset and hold it starts on light up without a reload.

**The card's own mode write is pending from the tap.** It is held as `pendingMode`, read by `isStopped()` before the device's mode, from the tap until a reload of the device carries it; a failed write, or a mode change made elsewhere, drops it. The banner, the gauge and the event handlers therefore follow a stop and a start at once, in both directions, and a reload already in flight when the user tapped cannot bring the old mode back. A way out of a stop lights what the thermostat starts on at the same moment: the programme's point in force for "Back to the schedule", the preset it carries for "Start the thermostat". Leaving them for the reload showed a running thermostat on Off — and "Back to the schedule ▶" next to the preset just picked, whose tap then discarded it.

**Leaving a stop from the dial or the + and − buttons is three writes, in order:** the mode, the preset it was last on, then the setpoint. The preset arms a hold on its own setpoint, so a setpoint sent alongside it could land first and be replaced — the card showed 21.5 °C in manual mode while the server held Comfort's 21 °C. A tap that follows before the preset has landed waits for it too, and so does a release of the dial. The preset is a named one: `schedule` names no temperature to start on, so a thermostat stopped while following its programme restarts on Comfort.

**On a programme point on Off, the dial and + and − set a hold, as on any other point.** The thermostat is following its programme, not stopped: the preset stays `schedule`, the loop regulates on the hold — it takes precedence over the point — and the programme takes the thermostat back at its next point. Restoring a preset there wrote a named preset, which took the thermostat off its programme for good. While such a hold is in force, the gauge shows its setpoint rather than Off.

**Stopped is read from the mode, never from the preset.** A programme point on `off` lights Off too, but the thermostat is following its programme: the server cuts the switch, or stops the real device, and leaves the thermostat's own `mode` alone. The banner names that point like any other — "Off until 06:30" — and offers no way back to a programme it never left. Deriving the stopped banner from the preset showed "Back to the schedule" on every `off` point, the gaps of a new schedule included, and the button then did nothing.

**A setpoint set by hand on a preset's temperature shows as that preset.** When the card shows a hand-set setpoint (`manualSetpointOverride`) and it equals a preset's temperature — converted to the setpoint feature's unit, as for `holdMatchesPreset` — that preset's button lights and the banner names it instead of "Manual mode". It is display only: the server still holds a manual setpoint, `THERMOSTAT_MANUAL_SETPOINT`, which expires like any other, and the preset feature does not move. Two presets on the same temperature light the first in bar order; a stopped thermostat lights nothing.

**The gauge travels to a new setpoint instead of jumping to it.** Whatever moves the setpoint — a preset picked, a scene, a hold expiring, the schedule, + and − — the arc and its knob glide to the new value over about 450 ms (ease-out) in `CircularGauge.jsx`, and the number counts there in steps of 0.5 — the step a setpoint is set in — before landing on the target: counting in tenths showed values the user can never set, 21.1 to 21.4 on a single + tap. A new value arriving mid-way starts from where the arc is, so a burst of + clicks is one movement. It is display only: what is written, and what a screen reader announces (`aria-valuenow`), is the target, never an intermediate frame. Nothing is animated while the dial is dragged — the arc must stay under the finger — nor when the system asks for reduced motion (`prefers-reduced-motion`), nor on a change of mode, which remounts the gauge, nor before the card's first load has settled the setpoint: on a °F feature under a °C thermostat the gauge is first drawn on the unconverted value, and its correction once the feature's unit is read is no change of setpoint. A read-only gauge — a pilot-wire heater regulating itself (C.1.1) — draws no setpoint and shows the room temperature, which does not travel.

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

**A preset resolved from the programme is broadcast, never stored on the `preset` feature.** The feature keeps reading `schedule`, because that is the standing intention; the resolved point is what that intention currently means, and it is already served by `current` (E.5), which is what the widget reads. Storing it would make the next pass read a deliberate choice, take the thermostat off its programme (B.2) and freeze it on the first point it ever applied. The `preset` feature is written only when a preset is _chosen_ — by the widget, a scene, or the loop handing the thermostat back to `schedule` when a hold expires.

**The broadcast is sent when the point in force changes, not on every pass.** While the feature reads `schedule` it never equals the resolved preset, so comparing the two announced — and logged — the same preset once a minute for every thermostat on a programme. The service keeps, in memory, the preset it last announced for each thermostat, and broadcasts only when the resolved point differs from it, or when a hold has just expired. Leaving the programme forgets the entry, so following it again announces its point. After a restart the map is empty and each thermostat's point is announced once, which is harmless.

**A day with no point of its own is not an idle day, and the UI must say so.** The rule above is what the editor's day bars, the week miniature on the schedule list and the screen-reader summary all have to draw: a day starts on the last point before it, and that point may be **several days** earlier. A schedule whose only point is Saturday 08:00 Comfort applies Comfort all week, and an office schedule with no weekend point keeps its Friday evening preset through Sunday. Showing those days as empty, hatched or "Off" says the opposite of what the heating does. The wrap can land on the day's _own_ point, and that is still an inheritance: on a schedule whose only point is Saturday 08:00, Saturday midnight runs on that very point, carried from the week before — which is what the server applies at Saturday 03:00. Rejecting it because the day numbers matched drew those first eight hours blank. Only a schedule with **no point at all** is genuinely empty — and even then a thermostat following it keeps the setpoint it already has (C, step 3), which is what the empty-schedule warning states. Looking back a single day is not enough, and one shared helper answers this for both views so they cannot disagree.

A `PATCH` replacing a schedule's points, or a thermostat newly attached to one, triggers a regulation pass through the existing debounce. There is no dedicated route for it (D).

**Attaching a thermostat hands it to the programme.** The loop reads a programme only while the preset feature reads `schedule` (C, step 3), so attaching writes `schedule` on it, the way a person picking it does: a thermostat left on a named preset — by a detach, a deleted schedule, or a choice made while it followed none — would otherwise ignore the schedule just attached, for good, and a hold taken before the attach ends with it (D.0) rather than keeping the thermostat off the programme for another half hour. A preset feature never written reads `null`, which is not `schedule`: the write is not skipped on a new thermostat. A stop the previous programme left behind (E.6) is lifted: the thermostat starts again on its running mode, and the new programme's point applies. Only Gladys's own mode is written: the regulation pass that follows applies the point to the appliance, power, mode then setpoint (C.0), so one whose new point is Off is never switched on in between. A stop made by hand is left as it is: it outranks any programme — a thermostat stopped for the summer stays stopped when its programme is changed — and the widget offers the way back. The widgets are told to reload, as on a detach. Attaching a thermostat to the schedule it already follows changes nothing, so a preset picked since is not taken back.

Because a transition point has a known successor, a manual hold can offer **"until the next transition"** alongside the fixed `THERMOSTAT_MANUAL_DURATION`. That is the Tado and Netatmo default, and `next` (E.5) gives the widget the timestamp for free.

**The choice is stored as the absence of the param**, not as a second one: `THERMOSTAT_MANUAL_DURATION` set asks for that fixed duration, and unset asks for the next transition. So `manual_duration` is `null` on a device that does not set it — the config must carry the absence through rather than filling in the default, or the next-transition branch becomes unreachable — and the callers that need a number apply `DEFAULT_MANUAL_DURATION_MINUTES` themselves. The edit form offers the two as a choice, defaults to the next transition, and omits the param on it.

**The expiry lands on the point's own minute.** It names a transition point, so it is measured from the top of the current minute rather than from the instant the hold was taken: carrying those seconds put it at 08:30:47 for a point at 08:30, and with a 60 s regulation loop the return to the programme arrived up to another minute late — while the widget displayed 08:30 all along.

**Resolving that next point is subject to C.1 like every other read of the week**: the points are wall-clock times in the house, so `holdExpiry` reads them in the Gladys timezone rather than the one the process runs in — UTC in the official image. Reading them in the process timezone armed the expiry on the wrong point, an hour or two off, or on the other side of midnight.

**The expiry lands on the point's wall-clock time across a change of the clocks.** The distance to the next point is counted in minutes of the week, which are wall-clock minutes; elapsed time differs from them by an hour across the night the clocks change. Added to now as they were, a hold taken on Saturday noon ended at 13:00 on the Sunday the clocks go back, for a point at 14:00 — and at 15:00 in March. `nextTransitionTimestamp` moves the result by the change of the timezone's offset between now and then. A point inside the hour skipped in March has no instant of its own. It is in force from the jump — the wall clock reads 03:00 there, past a 02:30 point — so the hold ends on the jump: keeping the later candidate instead ended it up to 59 minutes late, at 03:30.

**The banners name the day of a return that is not today.** "Comfort until 13:00" for a hold ending at 13:00 tomorrow read as today. The hold banner and the programme banner both say "until tomorrow 13:00", or the weekday further ahead. The programme banner takes the count from `next.days_ahead` (E.5), worked out by the server from the house's today (`daysUntilPoint`): counted from the phone's, a phone in another timezone named the wrong day. The hold banner shows the expiry instant in the phone's own time, and names the day in that same time (`calendarDaysAhead`). A point a week ahead falls on today's weekday, and reads "until next Monday 06:30". **Both stay true past midnight**: the widget's minute tick draws the hold banner again when the phone's day changes, and loads the schedule again at `next.refresh_at` (E.5). Without that, a wall panel nothing else redrew still said "until tomorrow 06:30" at 03:00, when the point is today.

**A hold running to the next point follows the points when they change.** Its expiry is the time of the next point when the hold was taken: saving the programme's points afterwards (`updateSchedule`) moves it onto the new next point — a point added before the old one is no longer skipped, and the widget announces its time (`MANUAL_MODE_UPDATED`). Only a hold whose end is exactly the old programme's next point, resolved before the points are replaced, is moved. A hold of a fixed `THERMOSTAT_MANUAL_DURATION`, a permanent one, and one given the shared duration while the programme had no point name none and are left as they are — aimed at the new next point, a 30-minute hold could run for days, and saving an empty programme again does not renew it; a rename touches no hold. A hold whose end is already past ends before that point, so it is left to the regulation pass that follows, which clears it and applies the new points: re-armed, it would aim past them. A programme left with no point gives the hold the shared duration, as a hold taken on it would get. When its last point was Off, its stop has already dropped the holds of the followers it stopped; a follower stopped beforehand keeps its hold, which gets the shared duration too rather than aiming at a point that is gone.

### E.4 API

Every route is authenticated, under `/api/v1/service/thermostat`. The schedule's selector is generated by the server on creation, like a scene's. Houses and devices are named by their selector, as everywhere else in the API.

| Route                                                | Body                           | Effect                                                                                             |
| ---------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `GET /schedule?house=:house_selector`                |                                | All schedules, filtered by house when the parameter is given.                                      |
| `GET /schedule/:selector`                            |                                | One schedule.                                                                                      |
| `POST /schedule`                                     | `{ house, name, transitions }` | Creates a schedule in that house, with its points, in a transaction. `transitions` may be empty.   |
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
  "next": { "day_of_week": 0, "time": "08:30", "preset": "eco", "days_ahead": 0, "refresh_at": 1787553000000 }
}
```

`transitions` is sorted by day then time. `current` and `next` are computed **by the server**, in the Gladys timezone, read-only, and are `null` on a schedule with no point. The widget therefore no longer reads the timezone, and no longer recomputes the active point: it renders "Éco until 08:30" straight from `next`. `next.days_ahead` counts the days from the house's today to that point (0 to 7), so the widget names its day without reading the phone's date. That count holds until `next.refresh_at` (a timestamp): the house's next midnight, or the point itself when it comes first. The widget loads the schedule again then. That removes the last reason for the schedule-matching helper to be shared between the server and the frontend build (C.1).

**Deleting a range extends the one before it.** A gap between two ranges is not an absence: `rangesToTransitions` stores it as an `off` point, and the heating really stops there. Deleting a range therefore used to cut the heating for its whole span — removing a 08:30–17:00 eco range wrote `08:30 off` and left the house cold until 17:00 — while the editor drew hatching and the legend claimed the previous preset carried on. Stopping the heating is something the user asks for with the Off preset; it is never a side effect of a deletion, and that is the behaviour E.0 names (_"deleting a point extends the previous one"_) and that Tado has. The predecessor is found on the week's own timeline, so it may sit on an earlier day.

**Ranges of the same preset that touch are one range.** Two of them show as two identical rows — 06:30–17:00 Comfort, then 17:00–22:30 Comfort — while the points model stores a single stretch, so the editor would be saying something the schedule does not. The merge runs after every operation and on loading, not only after a deletion: an edit can bring two together just as well, and a schedule already stored may hold a pair. A chain of three merges in one pass, and a range is followed across midnight onto the next day.

**A stop is a range, not a hole.** `transitionsToRanges` used to drop `off` points, which left a gap the editor could only draw as hatching — and hatching reads as "nothing is set here" when it means "the heating is off here", the one state a programme imposes that nobody could see in a list or edit. An `off` point is now a range like any other: listed with its hours, coloured in the Off grey, named in the colour key, read out by screen readers, and editable. Every minute of the week is therefore covered by a range the user can see, and the editor needs no legend to explain a hole it no longer has.

An `off` range is not closed by a stop of its own: it already **is** the stop, and whatever follows opens its own point. Closing it added a second `off` that the next read turned into another range, so the schedule gained a row on every save.

**A range may not end where it starts.** The model reads an end at or before the start as running past midnight, so `10:00 → 10:00` covered a full 24 hours — the rest of that day and the next up to 10:00 — and was accepted in silence. It is refused on the row itself, where the click happened.

**Adding a range trims what it covers; it is not refused.** On a real schedule every minute of every day is already covered — the night runs into the next morning — so an overlap is the normal case, not an error. Refusing it made adding a range a dead end: "comfort from 12 to 14" had to be preceded by shortening the eco range by hand, and the editor's own default proposal fell on covered time and was rejected.

What the new range covers gives way: a range it sits inside is split in two, one it merely clips is shortened on that side, and one it swallows entirely disappears. A range crossing midnight is trimmed through the same day/minute spans the rest of the editor reasons in, so a night is cut on the day it is stored on. The range being edited never trims itself.

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

**Leaving a programme leaves the thermostat on the point that was in force.** Detaching a thermostat, or deleting the schedule it follows, would otherwise leave `schedule` on its preset feature with nothing to resolve — nothing the user could see, and at night, on an Off point, the heating starting again on the setpoint of the previous point. So: on a point naming a preset, that preset is written on the feature (the widget lights it, and it stays tied to the preset's temperature); on an Off point, the thermostat is stopped (the widget shows it, with the button that starts it again), and the stop is marked as the service's (`THERMOSTAT_SCHEDULE_STOP`), so the next schedule attached starts it again — a stop nobody chose would otherwise keep the next programme's morning point from ever applying; a hold running to the programme's next point becomes permanent, as any hold on a thermostat with no schedule is. A stopped thermostat, one on a preset of its own, and one whose schedule had no point in force are left alone. The widgets are told to reload, since which schedule a thermostat follows comes from the schedule list. A schedule is deleted even when one of its followers cannot be released — that follower is logged, and the deletion is not reported as a failure.

**Emptying a programme on an Off point stops its followers.** They still follow it, with no point in force, and so keep their setpoint (C, step 3) — on an Off point, the one the previous point left, since an Off point writes none: the heating started again. They are stopped instead, as a detach does, marked as the service's stops, and their preset still reads `schedule`. A hold over the Off point ends with the stop, a named preset's included — on a thermostat that follows a programme, a preset picked by hand is a hold to the next point too. Unlike on a detach it cannot become permanent or be left alone: on a thermostat that still follows a schedule it would be re-armed, expire into `schedule` with no point in force, and leave the heating running on its setpoint for good. When the programme has points again, the stops it made are lifted and its followers take its point; a stop made by hand stays. On any other point, the point's temperature is already on the setpoint feature. As on a deletion, the points are saved even when a follower cannot be stopped or started again: that follower is logged, and a regulation pass still runs.

The house is checked when a thermostat is **attached**, never when it is detached. A thermostat can be moved to a room of another house, or left with no room, while it follows a schedule; refusing to remove that link left it with no way out short of attaching another schedule or deleting this one. The link is kept on purpose: dropping it would take the thermostat off its programme without a word, for what is almost always a room being corrected. The edit form therefore keeps offering the schedule a thermostat follows when it belongs to another house, named with that house, rather than showing "No schedule" on a thermostat following one.

Name uniqueness is carried by the database as well, and the constraint violation returns the same `409`: two clients creating the same name at once must not depend on which one checked first.

`schedule` is excluded from the transition presets because a point saying "follow the programme" is the programme referring to itself.

### E.7 The integration page

The page lists schedules **by house**, and under each schedule the thermostats that follow it — the reverse query the link table makes possible. The editor's coloured bars are drawn exactly as before, and the form may keep showing a start and an end: the end is simply the next point. A gap between two ranges is stored as an Off point and drawn grey, so the legend under the bars is built from the points: it lists Off whenever a gap does, not only when an Off range was entered. Deleting a schedule asks for a confirmation that says what happens to the thermostats following it (E.6).

The times are the browser's native time inputs. On a touch screen a tap anywhere on the field opens the picker — Chrome on Android otherwise opens it from the clock icon only, and a tap on the time selects the hour without a picker or a keyboard. The gesture is read from the click (`pointerType`, with `(any-pointer: coarse)` for a click that carries none, such as one a label forwards), not from `(pointer: coarse)`, which describes the primary pointer only and misses a touchscreen laptop; the helper is `front/src/utils/openNativePicker.js`, for any native date or time input. In dark mode, every native date and time field carries a dark colour scheme (`dark-mode.css`): the app inverts inputs back to their real dark colours, and the browser's icon, drawn for a light field, was black on dark.

### E.8 Switching programmes from a scene

A house keeps several schedules — school term, school holidays, a week away — and the thermostats move between them with the calendar, not with someone editing the points each time. The scene action `thermostat.set-schedule` (`schedule`: a schedule selector, `devices`: thermostat selectors) is that move: for each thermostat it does exactly what `POST /schedule/:selector/device/:device_selector` does (E.4), so the point of the new schedule applies at once, a hold ends, a stop the previous programme made is lifted and a stop made by hand stays. A thermostat already on that schedule is left as it is.

One thermostat failing — deleted, moved to another house — is logged and leaves the others switched, like the light and switch actions; the action does nothing when the thermostat service is not running, or when no thermostat was picked. "Not running" is read from the service itself (`running`, set by its `start()` and `stop()`): every in-tree service sits in the stateManager whatever its status, so finding it there says nothing, and a scene run with the integration stopped attached the schedule and triggered a regulation pass that could switch a relay on with no minute loop left to switch it off. A stopped service runs no regulation pass at all, whatever its API is asked to write (`triggerApplySchedules`). The collapsed card names the schedule and the thermostats rather than their selectors. The scene editor offers thermostats once a schedule is picked, and only those of its house; picking a schedule of another house drops the thermostats already chosen that are not in it. The MCP `scene.create` tool lists the selectors of the Gladys thermostats — not the climate devices they drive — and of the existing schedules.

## F. The widget, on an external thermostat

The dashboard widget is the same in both cases; three details differ.

**It targets the real device's selector.** `thermostat_feature` holds the external selector, so the picker — which lists this service's devices — offers an external thermostat under its own name, resolved through `THERMOSTAT_TARGET_FEATURE`. Without that it would have no feature to show and could never be added to a dashboard.

**The heating halo reads `THERMOSTAT_STATE_FEATURE`** instead of the switch, normalising the two accepted shapes (A.0.1). `NEW_STATE` payloads carry no category or type, so the shape is taken from the feature read at mount and the value normalised against it. With no state feature configured, the widget falls back to estimating the state from the setpoint, as it already did for a thermostat with no switch. On a virtual thermostat there is nothing to normalise: the halo reads the device's own `operating-state` (B.3).

**The real device is a second source of truth.** A setpoint changed on the thermostat itself — its own dial, the vendor app, its internal programme — arrives as a `NEW_STATE` and is displayed, where a virtual thermostat holds its local manual setpoint instead. Only Gladys writes a virtual setpoint, so there is nothing to follow there; on an external one, holding it would leave the widget showing a value the thermostat no longer has. The short-lived hold that protects the user's own in-flight write (`expectedSetpoint`) still applies, so the dial does not jump while it is being turned.

**The preset bar stays visible on a scheduled thermostat.** The previous revision replaced it with the "following the schedule" banner as soon as a schedule was attached, which meant that "I am away for the weekend → Frost" required going to the integration page and detaching the programme. The bar is rendered **under** the banner instead: picking a preset there arms a hold, which is the normal way to step off a programme for an afternoon, and the banner says what the thermostat goes back to.

That hold offers **"until the next transition"** as well as the fixed duration, and defaults to it on a scheduled thermostat — the Tado and Netatmo behaviour, which `next` (E.5) makes a matter of reading a field.

**A hold un-highlights the preset only when the setpoint left it.** The preset bar shows which preset the setpoint comes from. A hold alone does not answer that, on either kind of thermostat: picking a preset arms one too. The test is the value — a hold sitting on the preset's own setpoint _is_ that preset being applied and stays highlighted, and a hold on any other value is a setpoint of its own, which no preset represents. That covers a turn of the dial and a setpoint set on the real thermostat, since neither lands on a preset's temperature.

The same rule applies to external thermostats. An earlier revision exempted them — reasoning that a manual setpoint never comes from a preset on a real device — and the result was that **no preset ever lit up on a Netatmo**, whether the button had just been pressed or the page had been reloaded, while the banner read "Manual mode".

**The rule is one rule, and both paths have to ask it the same question**: the live `MANUAL_MODE_UPDATED` event and the state restored on a page reload. Fixing only the reload left a preset picked on a real thermostat dark until the page was refreshed, since the live handler still forced the override on every external hold.

**And a hold armed by a preset is named as that preset, not as "Manual mode".** The banner says what the thermostat is doing: "Night until 11:30", with the preset's icon and colour. "Manual mode" is for a setpoint that no preset carries — a hand-set temperature, or one set on the device. Saying "Manual mode" while the Night button was lit told the user their choice had been replaced by something else.

The dial bounds come from the target feature's own `min`/`max` when it declares them, and fall back to `THERMOSTAT_MIN_TEMP` / `_MAX_TEMP` otherwise — the device knows its range better than the form does.

## G. Out of scope

- **House modes**: away tied to presence, holiday until a date, a global frost setting. A schedule owned by a house (E.1) is what makes an active schedule per house — followed by thermostats that made no explicit choice — expressible later with no schema change.
- **The gauge widget on any `thermostat` / `target-temperature` feature**, the schedule being an optional layer on top. Today, showing a Netatmo on a dashboard means creating an "external" thermostat device for it.
- **An external thermostat that keeps its own vendor programme.** Gladys's hold and the device's programme then take turns writing the setpoint (C.0.1). Until that is handled, the edit form says to disable the programme on the vendor side.
- **A pilot-wire module that keeps its own programme or thermostat mode** (Tuya's `program` / `thermostat` modes, Heatzy's `timer_switch`). As with an external thermostat's vendor programme, the module and Gladys then take turns writing the order, and every order the programme writes is taken as a change made on the module (C.1.1). Until that is handled, the edit form says to disable the programme on the module side, under the pilot-wire picker.
- Multi-zone grouping, open-window _detection_ by temperature drop (as opposed to a sensor).
- **Driving a second setpoint on an external thermostat.** A reversible Matter or Zigbee device exposes a heating _and_ a cooling setpoint; one `THERMOSTAT_TARGET_FEATURE` is written, and a house wanting both creates two thermostats. Additive.
