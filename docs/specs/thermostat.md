# Thermostat: a virtual thermostat with weekly schedules

## Context

Gladys can already *read and command* real thermostats (Netatmo, Matter, Zigbee, Z-Wave) through the `thermostat` device feature category. What it cannot do is **be** the thermostat: turn a plain temperature sensor plus a plain switch — a relay, a smart plug, a boiler contact — into a regulated heating zone with a weekly programme.

That is the gap this integration fills, and it is the most common French setup: an electric or hydronic heater driven by a contact, a separate sensor in the room, no branded thermostat anywhere. Today the answer is a hand-written scene per temperature threshold, with no schedule, no hysteresis and no anti-short-cycling.

## A. Device model

One virtual device per heating zone, created by the integration, carrying exactly **one** feature:

| | |
|---|---|
| Category | `DEVICE_FEATURE_CATEGORIES.THERMOSTAT` |
| Type | `DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE` |
| Unit | `celsius` or `fahrenheit` |

No new category or type is introduced: a virtual thermostat is a thermostat, and it must be indistinguishable from a Netatmo one to the rest of Gladys (scenes, MQTT, Gladys Plus, the device pages).

The feature is resolved **by category and type**, never by `device.features[0]`: feature order is not a contract, and a later added feature (mode, operating state) would otherwise silently retarget the regulation loop.

### A.1 Configuration lives on the device

Everything the control loop needs is a `THERMOSTAT_*` device param:

| Param | Meaning |
|---|---|
| `THERMOSTAT_TEMPERATURE_FEATURE` | the sensor the loop regulates on |
| `THERMOSTAT_HUMIDITY_FEATURE` | optional, displayed only |
| `THERMOSTAT_SWITCH_FEATURE` | the actuator the loop drives |
| `THERMOSTAT_WINDOW_FEATURE` | optional opening sensor, cuts the heating when open |
| `THERMOSTAT_ACTIVE_SCHEDULE` | selector of the weekly schedule to follow, empty for none |
| `THERMOSTAT_MODE` | `heating` or `cooling` |
| `THERMOSTAT_CONTROL_TYPE` | `hysteresis` or `tpi` |
| `THERMOSTAT_MIN_TEMP` / `_MAX_TEMP` | bounds of the setpoint feature and of the widget dial |
| `THERMOSTAT_TEMP_UNIT` | `C` or `F` |
| `THERMOSTAT_MANUAL_DURATION` | how long a manual override holds, in minutes |
| `THERMOSTAT_PRESET_*` | the five preset setpoints (`off` has no setpoint) |
| `THERMOSTAT_HYSTERESIS_START` / `_STOP` | hysteresis band, in degrees of **difference** |
| `THERMOSTAT_TPI_CYCLE_TIME` / `_PROPORTIONAL_BAND` | TPI tuning, clamped by the regulation loop to 5-120 min and 0.5-10 degrees |

`createDevice` accepts only this list plus a single setpoint feature; anything else in the request body is dropped rather than persisted. Every field the edit form offers is in that list: a field the filter dropped would silently need a second store, which is exactly what this section forbids.

The defaults for all of these live in `server/utils/thermostatConstants.js`, imported by the regulation loop, the widget and the edit form alike, so a device saved without a param is regulated exactly as the form displayed it.

### A.2 Runtime state

Per-thermostat *runtime* state — current preset, its non-off fallback, the manual override and its expiry — stays in `t_variable` under `THERMOSTAT_<FEATURE_KEY>_<SUFFIX>`, scoped to this **service id** rather than written globally, and removed by the service's `postDelete` hook when the device is deleted. The suffix list is shared between the write path and the cleanup, so a new suffix cannot be left behind.

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

**Order of decisions**, per device:

1. **Window open** — if a window sensor is configured and reads `0`, the switch is cut and the pass stops. A `NEW_STATE` listener applies the same cut immediately, without waiting for the next tick, using device params only (no dashboard read).
2. **Manual override** — if `THERMOSTAT_*_MANUAL_MODE` is `true` and its `_MANUAL_UNTIL` has not passed, the loop regulates on the manual setpoint. On expiry it clears the flag, broadcasts `MANUAL_MODE_UPDATED` and falls through to the schedule.
3. **Target preset** — the active schedule's slot for the current day and minute; failing that, the current preset variable; failing that, nothing is regulated.
4. **Setpoint** — written to the thermostat feature only when it changed.
5. **Switch** — actuated only when its state differs from the computed one.

### C.1 Timezone

Schedules are wall-clock times **in the house**. `getCurrentDayAndMinutes` therefore reads the day and minute in the timezone from `SYSTEM_VARIABLE_NAMES.TIMEZONE` (default `Europe/Paris`), like scenes, DuckDB and the energy jobs do — the official Docker image runs in UTC, so relying on the process timezone would fire a 07:00 comfort slot at 08:00 or 09:00 in France.

The helper lives in `server/utils/thermostatSchedule.js`, imported by both the service and the widget so the two agree on the active slot — the schedule editor's slot algebra (`applySlotToDay`, `mergeIntoSlots`) comes from the same module rather than a second copy. It is deliberately in `utils/` and not in the service directory: the frontend build only aliases `server/utils/*`, and a service module is free to `require('../models')`, which would break the Vite build.

The widget passes that timezone explicitly, read once from `SYSTEM_VARIABLE_NAMES.TIMEZONE`. Letting it default to the browser's would make a phone abroad, or a laptop left on another zone, display a slot other than the one actually heating the house.

### C.2 Hysteresis and TPI

- **Hysteresis** (default): heat below `setpoint - hysteresis_start`, stop above `setpoint + hysteresis_stop`, hold the current state in between. Both values are temperature **differences**, so converting a thermostat to Fahrenheit scales them by 9/5 with **no** 32° offset — the absolute-temperature conversion would turn a 0.5 °C hysteresis into 32.9 °F.
- **TPI**: the switch is on for a fraction of each cycle proportional to the error within the proportional band. Heating only — a cooling compressor cannot be pulsed that way, so cooling always falls back to hysteresis. An on-time below one minute is rounded down to off: the regulation step is one minute, and a shorter pulse is both useless and hard on the relay.
- **TPI phase.** The position inside the cycle is offset by a hash of the thermostat's feature selector. Without it, every thermostat sharing a cycle time switches on at the same wall-clock minute, stacking the loads.

## D. Scenes

`setValue` is the path taken by `device.set-value` and by the generic device API. Persisting the value alone would not survive: the next regulation pass re-applies the scheduled preset and overwrites it within a minute, so a scene setting 21 °C would either do nothing useful or fight the loop every minute.

An external write is therefore treated as a **manual override**, exactly like turning the dial on the widget: the setpoint is saved, the manual flag and its expiry are set, `MANUAL_MODE_UPDATED` is broadcast and a regulation pass is triggered. The setpoint holds for the device's `THERMOSTAT_MANUAL_DURATION` (30 minutes by default), then the schedule takes over again. The widget's countdown reads the same param, so what it displays is what the server enforces.

`POST /api/v1/service/thermostat/setpoint/:feature_selector` goes through the same `setValue`, and only after checking that the named feature is a `thermostat` / `target-temperature` feature **owned by this service** — otherwise any authenticated household member could persist a value on a lock, a cover or a light just by naming its selector.

## E. Weekly schedules

Two tables (migration `20260823000000`):

- `t_thermostat_schedule`: `id`, `name`, `selector`.
- `t_thermostat_schedule_slot`: `schedule_id` (FK, `ON DELETE CASCADE`), `day_of_week` (0 = Monday … 6 = Sunday), `start_time` / `end_time` in `HH:MM`, `preset`.

Slots are validated by Joi before reaching the database (`day_of_week` 0–6, `HH:MM` pattern, preset enum) and by the model itself. An invalid slot would otherwise be stored and then silently match nothing at regulation time.

A slot ending at `00:00` means end of day. A slot whose end is before its start crosses midnight and is matched in two halves — the start day's evening, then the following day's small hours — which is what makes a single "22:00 → 06:00 night" slot expressible.

## F. Out of scope

- Fil pilote heaters (`heater` / `pilot-wire-mode`): the actuator picker is `switch` / `binary` only. Additive when it comes.
- Presets as a Gladys-wide device feature type (section B).
- Multi-zone grouping, holiday mode, open-window *detection* by temperature drop (as opposed to a sensor).
