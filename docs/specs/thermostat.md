# Thermostat: weekly schedules, virtual or on a real thermostat

## Context

Gladys can already *read and command* real thermostats (Netatmo, Matter, Zigbee, Z-Wave) through the `thermostat` device feature category. Two things are missing, and this integration fills both.

**It cannot *be* the thermostat.** Turning a plain temperature sensor plus a plain switch — a relay, a smart plug, a boiler contact — into a regulated heating zone with a weekly programme is the most common French setup: an electric or hydronic heater driven by a contact, a separate sensor in the room, no branded thermostat anywhere. Today the answer is a hand-written scene per temperature threshold, with no schedule, no hysteresis and no anti-short-cycling.

**It cannot *programme* the thermostats it already reads.** A Netatmo or a Zigbee thermostat regulates itself perfectly well, but nothing in Gladys drives its setpoint on a weekly schedule: the programme lives in the vendor's app, out of reach of scenes and of the rest of the house.

The two needs share everything except the last step. The schedule, the presets, the manual override, the widget and the window handling are the same; only the final act differs — Gladys either actuates a switch itself, or writes a setpoint onto a device that actuates its own. Hence one integration with **two device types**, `virtual` and `external`, and a single code path that branches once, at the end of the regulation pass.

## A. Device model

One device per heating zone, created by the integration. `THERMOSTAT_TYPE` says which of the two kinds it is; a device saved before the param existed has none, and is a virtual one — so **no migration is needed**.

### A.0 Virtual and external

A **virtual** thermostat carries exactly **one** feature, because Gladys *is* the thermostat and the setpoint has to live somewhere:

| | |
|---|---|
| Category | `DEVICE_FEATURE_CATEGORIES.THERMOSTAT` |
| Type | `DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE` |
| Unit | `celsius` or `fahrenheit` |

No new category or type is introduced: a virtual thermostat is a thermostat, and it must be indistinguishable from a Netatmo one to the rest of Gladys (scenes, MQTT, Gladys Plus, the device pages).

The feature is resolved **by category and type**, never by `device.features[0]`: feature order is not a contract, and a later added feature (mode, operating state) would otherwise silently retarget the regulation loop.

An **external** thermostat carries **no feature at all**. Its setpoint is a feature of the real device — a Netatmo, a Zigbee TRV, a Matter thermostat, an MQTT climate entity — named by `THERMOSTAT_TARGET_FEATURE`. Creating a mirror feature here would give the house two setpoints that drift apart, and the whole point is that the real device stays the authority on its own state. Everything that keys on a selector (the runtime variables, the widget's `thermostat_feature`, the `/setpoint/` route) therefore keys on that **external** selector, which is why the rest of the integration needed no second code path.

### A.0.1 What real thermostats actually expose

The design is constrained by what integrations publish today, which is much less than the core defines:

| Integration | `target-temperature` | `operating-state` | `mode` |
|---|---|---|---|
| Netatmo | yes | no — a boiler contact as `switch`/`binary` | no |
| Zigbee2MQTT | yes, **up to five** (heating/cooling, occupied/unoccupied) | no | no |
| Matter | yes, **two** (heating, cooling) | no | no |
| MQTT / Home Assistant | yes, when the discovery declares it | no | no |

Three consequences, each of which is a rule the code follows:

- **No auto-discovery of the target.** A Matter or Zigbee device exposes several setpoints and only the user knows which one drives their heating, so the three selectors are picked by hand in the edit form, out of *every* device in the house.
- **The state feature accepts two shapes.** `thermostat`/`operating-state` (0 idle / 1 heating / 2 cooling) *and* a read-only `switch`/`binary` boiler contact. Accepting only the standard type would leave every thermostat available today with no heating indication at all. It also accepts **nothing**: the widget then shows the setpoint without a heating halo.
- **The mode feature is optional.** No integration produces one. Requiring it would make the feature unusable for everybody.

### A.0.2 No loops

The feature pickers exclude devices owned by this service. Pointing an external thermostat at a virtual one would make Gladys write its own setpoint back to itself, once a minute, for ever.

### A.1 Configuration lives on the device

Everything the control loop needs is a `THERMOSTAT_*` device param:

| Param | Meaning |
|---|---|
| `THERMOSTAT_TYPE` | `virtual` or `external`; absent means `virtual` |
| `THERMOSTAT_TEMPERATURE_FEATURE` | the sensor the loop regulates on (virtual); displayed only (external) |
| `THERMOSTAT_HUMIDITY_FEATURE` | optional, displayed only |
| `THERMOSTAT_SWITCH_FEATURE` | **virtual only** — the actuator the loop drives |
| `THERMOSTAT_TARGET_FEATURE` | **external only** — the real device's setpoint, written by the loop. Required |
| `THERMOSTAT_STATE_FEATURE` | **external only**, optional — `operating-state` or a binary boiler contact, read to show whether the equipment runs |
| `THERMOSTAT_MODE_FEATURE` | **external only**, optional — the real device's operating mode, if it has one |
| `THERMOSTAT_WINDOW_FEATURE` | optional opening sensor; cuts the switch when open (virtual) or writes the frost setpoint (external) — whatever the mode, so a running air conditioner is suspended like a heater |
| `THERMOSTAT_ACTIVE_SCHEDULE` | selector of the weekly schedule to follow, empty for none |
| `THERMOSTAT_MODE` | `heating` or `cooling` |
| `THERMOSTAT_CONTROL_TYPE` | `hysteresis` or `tpi` |
| `THERMOSTAT_MIN_TEMP` / `_MAX_TEMP` | bounds of the setpoint feature and of the widget dial |
| `THERMOSTAT_TEMP_UNIT` | `C` or `F` |
| `THERMOSTAT_MANUAL_DURATION` | how long a manual override holds, in minutes |
| `THERMOSTAT_PRESET_*` | the five preset setpoints (`off` has no setpoint) |
| `THERMOSTAT_HYSTERESIS_START` / `_STOP` | hysteresis band, in degrees of **difference** |
| `THERMOSTAT_TPI_CYCLE_TIME` / `_PROPORTIONAL_BAND` | TPI tuning, clamped by the regulation loop to 5-120 min and 0.5-10 degrees |

`createDevice` accepts only this list plus, on a virtual thermostat, a single setpoint feature; anything else in the request body is dropped rather than persisted. Every field the edit form offers is in that list: a field the filter dropped would silently need a second store, which is exactly what this section forbids.

On an external device `createDevice` **drops any feature sent alongside** and refuses a payload with no `THERMOSTAT_TARGET_FEATURE`: a thermostat with nothing to drive would sit in the integration page doing nothing, with no way to tell why. Switching a device back to `virtual` clears the three external params, so a stale selector can never keep driving a real thermostat.

The hysteresis, TPI and switch params are meaningless on an external device — the real thermostat runs its own heuristic — and the edit form hides them there rather than offering settings that do nothing.

The defaults for all of these live in `server/utils/thermostatConstants.js`, imported by the regulation loop, the widget and the edit form alike, so a device saved without a param is regulated exactly as the form displayed it.

### A.2 Runtime state

Per-thermostat *runtime* state — current preset, its non-off fallback, the manual override and its expiry — stays in `t_variable` under `THERMOSTAT_<FEATURE_KEY>_<SUFFIX>`, scoped to this **service id** rather than written globally, and removed by the service's `postDelete` hook when the device is deleted. The suffix list is shared between the write path and the cleanup, so a new suffix cannot be left behind.

`<FEATURE_KEY>` is derived from the thermostat's setpoint selector: this service's own feature on a virtual device, the `THERMOSTAT_TARGET_FEATURE` param on an external one, which owns no feature. The ownership check that guards these keys resolves both, or every preset and manual hold of an external thermostat would be refused as "not owned by this service" — and `postDelete` cleans up both, since the real device's feature survives the deletion and only the variables must go.

Clients read and write it through `/api/v1/service/thermostat/state/:variable_key`, which accepts the runtime suffixes only. It is deliberately *not* mounted under `.../variable/...`: the core already mounts `/api/v1/service/:service_name/variable/:variable_key`, and that generic route would shadow it. Configuration keys are rejected there — the configuration lives on the device, and there is no `THERMOSTAT_CONFIG_*` variable any more.

**Not on the dashboard.** See `docs/specs/dashboard-flexible-layout-and-widgets.md` E2: the widget carries `thermostat_feature` and nothing else. A control loop that actuates real heaters must not read its settings from a per-user dashboard document.

## B. Presets, and why they are not `THERMOSTAT_MODE`

The integration exposes six presets: `off`, `frost`, `away`, `eco`, `night`, `comfort`.

These are **not** a competing spelling of the existing `THERMOSTAT_MODE` enum (`off` / `heating` / `cooling` / `auto`) that Matter, Zigbee and Z-Wave map onto. The two answer different questions:

- `THERMOSTAT_MODE` says **what the machine does** — is it heating, cooling, or idle. It is a property of the equipment.
- A preset says **which temperature to aim for** — 7 °C frost protection, 16 °C away, 21 °C comfort. It is a property of the schedule.

They compose rather than compete: a thermostat in `heating` mode follows a weekly programme whose 07:00 slot is `comfort`. This is the Netatmo/Tado vocabulary, and the vocabulary French heating programmers have used for decades (*confort / éco / hors-gel*), which is what makes a weekly schedule expressible at all — "heating" is not something you can put in a time slot.

The presets are stored as a device-scoped variable and as the `preset` column of a schedule slot; they are **not** exposed as a device feature. A scene that wants a specific temperature sets the setpoint (section D); mapping presets onto a standard feature category can be added later without changing this model.

> Open question for maintainers: whether a future `thermostat` / `preset` feature type should exist Gladys-wide, so branded integrations with the same notion (Netatmo, Tado, Overkiz) expose it uniformly. Out of scope here.

## C. Regulation loop

A single `setInterval` in the service ticks every 60 s and calls `applySchedules`, which regulates every thermostat device in parallel and isolates a failing device from the others.

**Order of decisions**, per device. Steps 1 to 3 are identical for both device types — that is the whole point of the design; only steps 4 and 5 differ.

1. **Window open** — if a window sensor is configured and reads `0`, the pass stops after suspending the heating: the switch is cut (virtual), or the frost-protection setpoint is written (external). A `NEW_STATE` listener applies the same cut immediately, without waiting for the next tick, using device params only (no dashboard read).
2. **Manual override** — if `THERMOSTAT_*_MANUAL_MODE` is `true` and its `_MANUAL_UNTIL` has not passed, the loop regulates on the manual setpoint. On expiry it clears the flag, broadcasts `MANUAL_MODE_UPDATED` and falls through to the schedule.
3. **Target preset** — the active schedule's slot for the current day and minute; failing that, the current preset variable; failing that, nothing is regulated.
4. **Setpoint** — on a virtual thermostat, saved on this service's own feature when it changed. On an external one, **written onto the real device** through the core, which routes it to the owning integration.
5. **Switch** — **virtual only**, actuated only when its state differs from the computed one.

### C.0 An external thermostat stops at step 4

There is no step 5, and no hysteresis or TPI computation at all: the real thermostat runs its own heuristic off the setpoint it was given, and a second control loop would fight it. This is the entire difference between the two types.

`off` has no setpoint of its own, so on an external device it is expressed as the **frost-protection setpoint** — the only way to say "stop heating" that every thermostat understands, unlike a mode feature that almost none expose.

Three properties of that write, each one required by a different vendor:

- **Converted into the target feature's unit.** A thermostat configured in celsius pointing at a fahrenheit device would otherwise write `21` where the device reads 21 °F. MQTT/Home Assistant takes its unit from the discovery payload, so the mismatch is reachable in practice.
- **Clamped to the feature's own `min`/`max`.** Netatmo advertises 5-30, Zigbee 5-40, Matter -100-200. A value outside the range is rejected or silently clamped by the integration; clamping here is where it can be logged.
- **Skipped when the value already matches.** Several of these integrations call a cloud API on every write, and re-sending an unchanged setpoint once a minute would burn the rate limit for nothing.

A write that fails — an unreachable integration, an expired cloud token, an external integration that does not acknowledge the command within the core's 5 s budget — is logged and swallowed: one dead thermostat must not stop the others, and the next tick retries it anyway since the value still differs.

### C.0.1 The device is a second writer, and wins

A real thermostat has its own dial, its vendor app and often its own internal programme: Gladys is **not** the only thing that writes its setpoint. Left alone, the loop would re-apply the stored preset on the next tick and silently undo whatever was set on the device — once a minute, for ever. From the outside this reads as an unstable thermostat: a value set on the vendor app reverts a moment later, sometimes before the app has even finished sending it.

A setpoint change observed on a driven thermostat is therefore held exactly like a turn of the widget dial: `MANUAL_MODE` is armed, and the loop stops imposing the schedule. With a schedule the hold lasts `THERMOSTAT_MANUAL_DURATION` and the programme then resumes; without one it is permanent, like on a physical thermostat (section D).

**Telling our own write apart from a real one.** Gladys's own write comes back as the same `NEW_STATE` event. Taken at face value it would arm a manual hold on *every scheduled write*, so the schedule would suspend itself the moment it applied. Each external write is therefore marked by selector before being sent, and the single echo matching that mark is consumed and ignored; anything else is a genuine change made on the device.

This applies to external thermostats only. A virtual one has no second writer — Gladys owns its setpoint feature — so its own writes must never arm a hold.

The selectors driven by this service are cached and rejected cheaply, in the same pass that builds the window-sensor set: `NEW_STATE` fires for every feature in the house, and neither check may cost a query.

### C.0.2 The setpoint must be written on the owning device

`gladys.device.setValue` routes on `device.service.name`. An external write therefore has to be handed **the device that owns the feature**, resolved from the selector — never this service's own thermostat device, which would route the write straight back into this integration's `setValue` and loop for ever.

### C.1 Timezone

Schedules are wall-clock times **in the house**. `getCurrentDayAndMinutes` therefore reads the day and minute in the timezone from `SYSTEM_VARIABLE_NAMES.TIMEZONE` (default `Europe/Paris`), like scenes, DuckDB and the energy jobs do — the official Docker image runs in UTC, so relying on the process timezone would fire a 07:00 comfort slot at 08:00 or 09:00 in France.

The helper lives in `server/utils/thermostatSchedule.js`, imported by both the service and the widget so the two agree on the active slot — the schedule editor's slot algebra (`applySlotToDay`, `mergeIntoSlots`) comes from the same module rather than a second copy. It is deliberately in `utils/` and not in the service directory: the frontend build only aliases `server/utils/*`, and a service module is free to `require('../models')`, which would break the Vite build.

The widget passes that timezone explicitly, read once from `SYSTEM_VARIABLE_NAMES.TIMEZONE`. Letting it default to the browser's would make a phone abroad, or a laptop left on another zone, display a slot other than the one actually heating the house.

### C.2 Hysteresis and TPI

**Virtual thermostats only** — see C.0.

- **Hysteresis** (default): heat below `setpoint - hysteresis_start`, stop above `setpoint + hysteresis_stop`, hold the current state in between. Both values are temperature **differences**, so converting a thermostat to Fahrenheit scales them by 9/5 with **no** 32° offset — the absolute-temperature conversion would turn a 0.5 °C hysteresis into 32.9 °F.
- **TPI**: the switch is on for a fraction of each cycle proportional to the error within the proportional band. Heating only — a cooling compressor cannot be pulsed that way, so cooling always falls back to hysteresis. An on-time below one minute is rounded down to off: the regulation step is one minute, and a shorter pulse is both useless and hard on the relay.
- **TPI phase.** The position inside the cycle is offset by a hash of the thermostat's feature selector. Without it, every thermostat sharing a cycle time switches on at the same wall-clock minute, stacking the loads.

### C.3 Sensor unit vs thermostat unit

This section is about the *reading*, and applies to a virtual thermostat, which compares it to the setpoint. On an external one the same conversion is applied for **display**, and the symmetrical conversion is applied to the setpoint on the way out (C.0).

The room sensor is a **separate device** from the thermostat, so nothing forces the two to share a unit: a Zigbee or Z-Wave probe reporting celsius next to a thermostat set to `THERMOSTAT_TEMP_UNIT = F` is a configuration the edit form allows. Comparing the raw reading to the setpoint would then put 68 against 20 and leave the heating permanently off — or, in cooling, permanently on.

The reading is therefore converted into the thermostat's unit before any comparison, from the sensor's declared `feature.unit`. A sensor with **no** declared unit is assumed to already be in the thermostat's unit: that is the pre-existing behaviour, and guessing would be worse than not converting.

The widget does the same on its side, and for the same reason — it renders the reading with the thermostat's unit symbol. The sensor unit is read once from the initial `GET /api/v1/device`; websocket `NEW_STATE` payloads do not carry it, so the value cached from that first read is what later events are converted with.

## D. Scenes

`setValue` is the path taken by `device.set-value` and by the generic device API. Persisting the value alone would not survive: the next regulation pass re-applies the scheduled preset and overwrites it within a minute, so a scene setting 21 °C would either do nothing useful or fight the loop every minute.

A write coming from outside the loop is therefore treated as a **manual override**, exactly like turning the dial on the widget: the setpoint is saved, the manual flag is set, `MANUAL_MODE_UPDATED` is broadcast and a regulation pass is triggered.

On an external thermostat the setpoint is not merely saved: it is written onto the real device through the core, on the device that owns it (C.0.2). Persisting it locally would refresh every Gladys screen while the thermostat itself never heard about it — the value would only reach it on the next regulation tick, up to a minute later.

The **expiry is only armed when the device follows a schedule** — that is the only case where something would otherwise take the setpoint over. With a schedule, the setpoint holds for the device's `THERMOSTAT_MANUAL_DURATION` (30 minutes by default), then the schedule takes over again; the widget's countdown reads the same param, so what it displays is what the server enforces. Without a schedule the hold is **permanent**, like on a physical thermostat: arming a timer there would silently revert to the stored preset a few minutes later, and the widget only renders a countdown banner for a scheduled thermostat, so nothing would announce it.

`POST /api/v1/service/thermostat/setpoint/:feature_selector` goes through the same `setValue`, and only after an ownership check — otherwise any authenticated household member could persist a value on a lock, a cover or a light just by naming its selector. The check has two arms, because the two device types own their setpoint differently:

- **virtual**: the named feature is a `thermostat` / `target-temperature` feature **of one of this service's devices**;
- **external**: the named selector is the **`THERMOSTAT_TARGET_FEATURE` of one of this service's devices**. The feature belongs to another integration, so it cannot be matched by ownership — but it can only be reached if a user deliberately wired it to a thermostat on the integration page.

The guard stays exactly as narrow in both cases: an arbitrary selector matches nothing.

That route accepts an optional `manual` flag, default `true`. The widget passes `manual: false` in exactly two places: when a hold ends and the schedule takes the thermostat back, and when a preset is picked on a thermostat that follows no schedule. Both write the setpoint the loop is *already* going to regulate on, right after saving `MANUAL_MODE = false` — so treating them as overrides would re-arm the very flag they just cleared. The widget would keep showing the schedule while the database said manual, and a page refresh (which restores its state from the database) would come back in manual mode, until the expiry silently dropped it minutes later. Every other caller — scenes, the generic device API, the dial, the +/− buttons — means a manual override and gets the default.

## E. Weekly schedules

Two tables (migration `20260823000000`):

- `t_thermostat_schedule`: `id`, `name`, `selector`.
- `t_thermostat_schedule_slot`: `schedule_id` (FK, `ON DELETE CASCADE`), `day_of_week` (0 = Monday … 6 = Sunday), `start_time` / `end_time` in `HH:MM`, `preset`.

Slots are validated by Joi before reaching the database (`day_of_week` 0–6, `HH:MM` pattern, preset enum) and by the model itself. An invalid slot would otherwise be stored and then silently match nothing at regulation time.

A slot ending at `00:00` means end of day. A slot whose end is before its start crosses midnight and is matched in two halves — the start day's evening, then the following day's small hours — which is what makes a single "22:00 → 06:00 night" slot expressible.

Deleting a schedule first **detaches** the thermostats that follow it, dropping their `THERMOSTAT_ACTIVE_SCHEDULE` param. The regulation degrades gracefully on a missing schedule — it falls back on the stored preset — but the device would otherwise keep an orphan reference the edit page cannot resolve, and which a new schedule reusing the selector would silently inherit. The slots themselves go with the schedule through the foreign key's `ON DELETE CASCADE`.

## F. The widget, on an external thermostat

The dashboard widget is the same in both cases; three details differ.

**It targets the real device's selector.** `thermostat_feature` holds the external selector, so the picker — which lists this service's devices — offers an external thermostat under its own name, resolved through `THERMOSTAT_TARGET_FEATURE`. Without that it would have no feature to show and could never be added to a dashboard.

**The heating halo reads `THERMOSTAT_STATE_FEATURE`** instead of the switch, normalising the two accepted shapes (A.0.1). `NEW_STATE` payloads carry no category or type, so the shape is taken from the feature read at mount and the value normalised against it. With no state feature configured, the widget falls back to estimating the state from the setpoint, as it already did for a thermostat with no switch.

**The real device is a second source of truth.** A setpoint changed on the thermostat itself — its own dial, the vendor app, its internal programme — arrives as a `NEW_STATE` and is displayed, where a virtual thermostat holds its local manual setpoint instead. Only Gladys writes a virtual setpoint, so there is nothing to follow there; on an external one, holding it would leave the widget showing a value the thermostat no longer has. The short-lived hold that protects the user's own in-flight write (`expectedSetpoint`) still applies, so the dial does not jump while it is being turned.

**A hold taken on the device un-highlights the preset.** The preset bar shows which preset the setpoint comes from, and a value set on the thermostat itself no longer comes from one. The widget already dropped the highlight for a setpoint set on its own dial (`manualSetpointOverride`, which deliberately ignores holds armed by scenes); on an external thermostat a manual hold *always* means the setpoint left the preset, whether it was armed here or on the device. This applies on the live event and on a page reload, which restores the same state from the database. Picking a preset clears the hold and lights it back up.

The dial bounds come from the target feature's own `min`/`max` when it declares them, and fall back to `THERMOSTAT_MIN_TEMP` / `_MAX_TEMP` otherwise — the device knows its range better than the form does.

## G. Out of scope

- Fil pilote heaters (`heater` / `pilot-wire-mode`): the actuator picker is `switch` / `binary` only. Additive when it comes.
- Presets as a Gladys-wide device feature type (section B).
- Multi-zone grouping, holiday mode, open-window *detection* by temperature drop (as opposed to a sensor).
- **Driving a second setpoint on an external thermostat.** A reversible Matter or Zigbee device exposes a heating *and* a cooling setpoint; one `THERMOSTAT_TARGET_FEATURE` is written, and a house wanting both creates two thermostats. Additive.
- **Writing the mode of an external thermostat.** `THERMOSTAT_MODE_FEATURE` is captured but not yet driven by the schedule: no integration publishes a mode feature today, so there is nothing to test against.
