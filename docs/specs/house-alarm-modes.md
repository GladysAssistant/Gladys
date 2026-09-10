# House alarm modes (Presence / Night / Away)

> **Living specification — source of truth** for the arming modes of the house alarm: the values of
> `t_house.alarm_mode`, the events and websocket messages that announce them, the REST contract, and
> the HomeKit mapping. Any PR that changes one of those behaviors or contracts must update this
> spec **in the same diff**.
>
> Companion specs: `dashboard-flexible-layout-and-widgets.md` (the alarm widget and the `alarm`
> chip live there).

## Context

A house alarm is rarely all-or-nothing. People protect their home differently depending on whether
they are away, home during the day, or asleep. That is the trio most alarm panels on the market
offer, and it is also what HomeKit expects: **Presence, Night, Away**.

Gladys only had two levels — `armed` and `partially-armed`. Anyone who wanted a night mode
repurposed the partial one for it and was then left without a presence mode. And because Gladys had
no night mode, the HomeKit integration did not expose one either: `NIGHT_ARM` was deliberately
excluded from `SUPPORTED_TARGET_STATES`, so the Home app showed no Night button.

Panic sat in the same list as the arming modes, which conflated two different things: an arming
mode is a level of protection you choose, panic is something you do.

Source: [forum topic 10808](https://community.gladysassistant.com/t/systeme-dalarme-gladys/10808),
request A1.

## A. The alarm state model

### A.1 The enumeration

`ALARM_MODES` in `server/utils/constants.js` is the state of a house alarm, stored in
`t_house.alarm_mode`:

| Value | Meaning |
|---|---|
| `disarmed` | Nothing is watched. |
| `presence-armed` | Armed while the occupants are living in the house. |
| `night-armed` | Armed while they sleep in it. |
| `away-armed` | Armed with nobody inside. |
| `triggered` | The alarm is going off. |

The first four are **arming modes**; `ALARM_SETTABLE_MODES_LIST` holds exactly those. `triggered` is
excluded from it on purpose: it is a state the alarm enters by itself, never one anybody asks for.
`ALARM_MODES_LIST` (all five) remains what the Sequelize model, the Joi scene schema and
`CHECK_ALARM_MODE` validate against — a scene may legitimately test whether the alarm is going off.

**Values are append-only from here on.** They are stored in `t_house.alarm_mode` and hard-coded in
every user's scenes, so renaming one costs a data migration over both tables. This spec is the
result of paying that price once; there must not be a second time.

### A.2 Three modes, fixed

There are three arming modes and no mechanism for custom ones (no "holiday", no "works in
progress"). Adding a fourth would mean a new endpoint, a new event, a new websocket type, a new tile
and a HomeKit state that does not exist — the three modes are the ones the whole chain agrees on.

### A.3 Panic is an action

`house.panic()` puts the house in `triggered`, whatever mode it was armed in. It is reachable as:

- `POST /api/v1/house/:house_selector/panic`,
- the scene action `alarm.trigger-panic` (`{ house }`, no mode),
- a button of its own in the alarm widget, below a rule, visually apart from the mode tiles.

It is **not** a value of `ALARM_SETTABLE_MODES_LIST`, so it cannot be reached through
`alarm.set-alarm-mode`. The scene trigger stays `alarm.panic`: the action value had to differ from
it, hence `alarm.trigger-panic`.

For now `triggered` has a single cause, the panic button. Telling an intrusion apart from a
deliberate press, and saying which sensor fired, belongs to the alarm sensors work (A2/A6).

### A.4 One delay, for all three modes

`t_house.alarm_delay_before_arming` (one setting per house, 10 s by default) applies to the three
arming modes alike. There is no per-mode delay.

`arm(selector, mode, disableWaitTime)` announces `alarm.arming` immediately, waits the delay, then
writes the mode and announces it. Disarming during the countdown cancels it: the pending timeout is
kept in `armingHouseTimeout`, keyed by house selector, and cleared by `disarm`. A house that is
arming is still `disarmed` in database until the delay elapses, which is why `disarm` only reports
"already disarmed" when there was no arming to cancel.

Scenes pass `disableWaitTime = true`: the delay exists to let someone walk out of the house, and a
scene is not a person walking out.

The timeout lives in memory. A restart during a countdown loses it, and the house stays disarmed —
the behavior that was already in place, unchanged here.

## B. Detailed design

### B.1 Server

- `server/lib/house/house.arm.js` — a single `arm(selector, mode, disableWaitTime = false)`. The
  three modes share one code path (same delay, same tablet locking, same conflict check) and differ
  only by the pair of events they announce themselves with, held in a local table. An unknown or
  non-arming mode is a `BadParameters`.
- `server/lib/house/house.panic.js` — writes `triggered`.
- `house.partialArm.js` is gone.

### B.2 Events and websocket messages

| Arming mode | Scene trigger | Websocket message |
|---|---|---|
| — (delay started) | `alarm.arming` | `alarm.arming`, payload `{ house, mode }` |
| `presence-armed` | `alarm.presence-arm` | `alarm.presence-armed` |
| `night-armed` | `alarm.night-arm` | `alarm.night-armed` |
| `away-armed` | `alarm.away-arm` | `alarm.away-armed` |
| `disarmed` | `alarm.disarm` | `alarm.disarmed` |
| `triggered` | `alarm.panic` | `alarm.triggered` |

The `alarm.arming` websocket payload carries `mode` so the widget can name the mode being armed
during the countdown. The scene trigger does not: a scene reacting to "the alarm is arming" gets
the house, as before.

`alarm.too-many-codes-tests` is unchanged.

### B.3 REST API

| Route | Effect |
|---|---|
| `POST /api/v1/house/:house_selector/presence_arm` | arm in `presence-armed` |
| `POST /api/v1/house/:house_selector/night_arm` | arm in `night-armed` |
| `POST /api/v1/house/:house_selector/away_arm` | arm in `away-armed` |
| `POST /api/v1/house/:house_selector/disarm` | disarm |
| `POST /api/v1/house/:house_selector/disarm_with_code` | disarm with the house code (scope `alarm:write`) |
| `POST /api/v1/house/:house_selector/panic` | set the alarm off |

The three arming routes answer `{ success: true }` — they may return before the house is actually
armed, since the delay runs after the response. `POST /arm` and `POST /partial_arm` are **gone**,
with no compatibility alias.

### B.4 Scenes

- `alarm.set-alarm-mode` takes an `alarm_mode` from `ALARM_SETTABLE_MODES_LIST`; `disarmed` routes
  to `disarm`, anything else to `arm(..., true)`.
- `alarm.trigger-panic` takes a `house` and nothing else.
- `alarm.check-alarm-mode` tests against the full `ALARM_MODES_LIST`, `triggered` included.
- The three arming triggers, `alarm.arming`, `alarm.panic` and `alarm.too-many-codes-tests` all
  match on `event.house === trigger.house`.

The MCP scene schemas (`server/services/mcp/lib/sceneSchemas.js`) mirror this split:
`ALARM_SETTABLE_MODES_LIST` for `set-alarm-mode`, `ALARM_MODES_LIST` for `check-alarm-mode`.

### B.5 HomeKit

`buildAlarmAccessory.js` maps the states one for one — what HomeKit calls staying home is what
Gladys calls presence, and the two others match word for word:

| Gladys | HomeKit `SecuritySystem…State` |
|---|---|
| `presence-armed` | `STAY_ARM` (0) |
| `away-armed` | `AWAY_ARM` (1) |
| `night-armed` | `NIGHT_ARM` (2) |
| `disarmed` | `DISARMED` (3) |
| `triggered` | `ALARM_TRIGGERED` (4) |

`SUPPORTED_TARGET_STATES` is every value but `ALARM_TRIGGERED`, which HomeKit only ever reports and
never asks for. A house that went off keeps the target it was armed with, remembered in memory by
the accessory; after a bridge restart, away is assumed — the strictest of the three.

An unknown `alarm_mode` reads as `DISARMED`: announcing a break-in that is not happening is the
worse of the two mistakes.

### B.6 Frontend registration points

- `front/src/components/boxs/alarm/` — three mode tiles, a full-width disarm button, and panic set
  apart under a rule. Presence introduces the only new hue (teal `#1F7A86`); away keeps the blue the
  single "arm" tile wore, and night takes the ink the partial tile used to.
- `front/src/routes/dashboard/index.js` — the three armed websocket messages send a locked tablet
  back to the code screen.
- Scene editor: `SetAlarmMode.jsx` (settable modes), `CheckAlarmMode.jsx` (all states),
  `TriggerPanic.jsx` (new), plus `typesCatalog.js`, `TriggerCard.jsx` and `summary.js`.
- i18n: `alarmModes.*` is the sentence fragment after "Your house is", `alarmModeNames.*` the short
  name used on tiles and in selects. Both, in all three languages.

### B.7 Migration

`server/migrations/20260910090000-alarm-modes-presence-night-away.js`, data-only.
`t_house.alarm_mode` is a plain `TEXT` column (Sequelize maps `ENUM` to `TEXT` on SQLite, and the
original migration created it as `STRING`), so the values are rewritten in place — no table
recreation.

- `t_house`: `partially-armed` → `presence-armed`, `armed` → `away-armed`, `panic` → `triggered`.
- `t_scene.actions`: the same remapping on `alarm.set-alarm-mode` and `alarm.check-alarm-mode`,
  walking recursively into the `if` / `then` / `else` blocks of nested actions. An
  `alarm.set-alarm-mode` set to `panic` becomes an `alarm.trigger-panic` action.
- `t_scene.triggers`: `alarm.partial-arm` → `alarm.presence-arm`, `alarm.arm` → `alarm.away-arm`.

Scenes are rewritten in raw SQL rather than through the model, so the Joi validator of `t_scene`
cannot reject a scene over unrelated legacy content, and only the scenes that actually changed are
written.

### B.8 What is not affected

The gateway relays websocket messages end-to-end encrypted and never reads their type, so renaming
the alarm messages does not reach it. Alexa, Google Home and MQTT do not expose the house alarm at
all, and the external-integration SDK deliberately withholds it: `GET /api/integration/v1/house`
returns five fields and never the alarm mode, code or delay.

## C. Out of scope

- **Alarm sensors.** Nothing here decides when the alarm goes off. No device is attached to the
  alarm, and no sensor can move it to `triggered`; that is the sensors-per-mode work.
- **Entry delay.** There is an exit delay only, and no state between armed and triggered.
- **Telling intrusion from panic**, and naming the sensor that fired.
- **Multi-mode scene conditions** ("if Night or Away") and a trigger on code entry.
- **Per-mode delays**, and any mode beyond the three.

## Verification

```bash
cd server && npm run prettier-check && npm run eslint && npm run coverage
cd ../front && npm run prettier-check && npm run eslint && npm run compare-translations && npm run build
```

End to end, from the repo root with `npm start`:

1. Each of the three modes arms with its countdown, and disarming during the countdown cancels it.
2. On a house with an alarm code, arming in Night mode locks the tablets and the code disarms.
3. The scene editor offers the three modes in "Set alarm mode", the three arming triggers, and the
   "Trigger panic" action.
4. Starting from a database holding a `partially-armed` house and a scene setting `panic`, the
   migration converts both.
5. In the Home app, the Night button is there and drives Gladys.
