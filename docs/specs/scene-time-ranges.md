# Scene time ranges: a whole planning in one scene

> **Living specification — source of truth.** This document specifies the `time-range` scheduled
> trigger of scenes and the `condition.in-time-range` condition. **Rule: any PR that changes one of
> these behaviors or contracts modifies this file in the same diff.**
>
> Status: **implemented**.

## A. Context

Driving a device from a weekly planning took two scenes — one to turn it on, one to turn it off —
each with its own scheduled trigger, kept in sync by hand. A `time-range` scheduler type puts the
whole planning in a single scene: the scene runs at the start and at the end of every range, and is
told which boundary fired.

## B. Data model

A scheduled trigger (`type: time.changed`) with `scheduler_type: 'time-range'`, stored in
`t_scene.triggers` like any other trigger:

| Field               | Type                        | Rule                                                                   |
| ------------------- | --------------------------- | ---------------------------------------------------------------------- |
| `time_ranges`       | `[{ start, end }]`, `HH:mm` | at least one; a real time of day (`99:99` is refused); `start` ≠ `end` |
| `days_of_the_week`  | `['monday', …]`             | optional — absent means every day; an empty list is refused            |
| `resume_on_startup` | boolean                     | optional — also run the scene once when Gladys starts (D)              |

The days are shared by every range of the trigger. A planning with different days per range —
weekdays and weekend — is two triggers on the same scene. A range carries no days of its own, and
the `trigger_start` / `trigger_end` flags of earlier iterations do not exist: none of these shapes
was ever released, and accepting them let a scene be saved and then refused by `addScene`, missing
from memory until the next restart.

Validation is the scene model's Joi schema; MCP's `scene.create` mirrors it (`sceneSchemas.js`)
and only offers the fields above.

## C. Scheduling (`scene.addScene.js`)

- **Half-open ranges.** A range is active from its start (included) to its end (excluded), so two
  consecutive ranges (`10:00 → 12:00`, `12:00 → 14:00`) never report the same minute twice.
- **Overnight ranges.** An end before the start runs past midnight (`22:00 → 06:00`). The days of
  the week apply to the **start**: configured on Monday, that range runs from Monday 22:00 to
  Tuesday 06:00, and its end job is scheduled on the day after each selected day.
- **One job per boundary.** Each range schedules a start job and an end job. An end falling at the
  same minute, on the same day, as the start of another range of the same trigger is not
  scheduled: the start carries
  the state the planning continues with, and both would run the scene twice at the same second.
- **Every range is checked before any job is scheduled.** A throw half-way left the jobs of the
  ranges before it running, with no trigger in the store to cancel them.
- **Cron rules, for the change of the clocks.** A job is a cron rule
  (`{ rule: '0 <minute> <hour> * * <days>', tz }`), not a `RecurrenceRule`. At 02:30 in
  Europe/Paris, a `RecurrenceRule` skipped the night the clocks go forward — the end of a
  `22:00 → 02:30` range never came, and the device it drives ran on for a day — and fired twice the
  night they go back. The cron rule fires once each night, at 03:30 on the night of the jump. Tests
  pin both nights. Cron only moves the edges that fall in the skipped hour: a `02:30 → 03:15` range
  then starts at 03:30, after its own end — see D for why it does not switch anything on.
- Jobs are cancelled on update, delete and disable (`scene.cancelTriggers.js`).

## D. What the scene is told

A fired job emits `TRIGGERS.CHECK` with the trigger's identity only — never the trigger object,
which holds the jobs — plus:

| Field         | Meaning                                                                                |
| ------------- | -------------------------------------------------------------------------------------- |
| `range_event` | `start`, `end`, or `resume` at startup                                                 |
| `range_index` | which range of the trigger fired (`{{triggerEvent.range_index}}` in a template)        |
| `in_range`    | whether the scene's **whole planning** covers this minute — set by `scene.triggers.js` |
| `fired_at`    | when the boundary fired, as a timestamp                                                |

`in_range` is computed on the current minute, over every time-range trigger of the scene. On an
end, the range that just ended is left out: two consecutive ranges, or a weekend trigger next to a
weekday one, keep the scene inside. A start is computed too rather than taken as `true`: on any
night its minute is inside the range, but on the spring-forward night a `02:30 → 03:15` range starts
at 03:30, after its end, and a `true` there switched the device on until the next day's end.

With `resume_on_startup`, the scene runs once at startup (`range_event: 'resume'`) with `in_range`
telling whether the planning covers that minute: a range that started or ended while Gladys was down
is never replayed otherwise. Once per scene, and only on the first `init()` — not on a timezone
change.

## E. The condition `condition.in-time-range`

`in_range: true` (default) continues when the scene's planning covers the current minute,
`false` when it does not; otherwise the scene stops at that step (`AbortScene`), which an if/else
catches to run its other branch.

- Started by **one of its own** time-range jobs, the condition trusts the trigger's `in_range` —
  a job firing exactly at an end is not re-read as inside — but **only for a minute after
  `fired_at`**. Past it, behind a delay or on every iteration of a "while", it computes the state
  from the ranges: trusted for the whole run, a `12:00 → 13:00` pump loop kept running past 13:00
  until `max_iterations`.
- Started any other way (by hand, by another trigger, by another scene — whose scope it inherits),
  it computes the state from the scene's own time-range triggers.
- On a scene with no time-range trigger it stops the scene (`NO_TIME_RANGE_TRIGGER`); the editor
  card warns about it.

## F. Editor

- The trigger card edits the days and a table of ranges (start, end, duration, `+1d` for a night).
  A new range starts empty.
- **Ranges are sorted when the scene is saved, never while a time is edited**: the rows are keyed
  by position, and sorting on leaving a field moved the next field under the cursor onto another
  range.
- The save is refused with a translated message while a range is incomplete or starts and ends at
  the same time, or while the trigger has no range at all; it used to drop the first silently and
  pass the others to the server, whose refusal was in English.
- The collapsed card shows the ranges and the days.

## G. Out of scope

- **Overlapping or duplicated ranges** are accepted, and every edge runs the scene: two identical
  `10:00 → 11:00` ranges run each edge twice.
- **`resume_on_startup` repeats the "Gladys starts" trigger**, which can be added to the scene with
  the same result. It stays as the planning's own switch.
- **Clocks changing at midnight.** Some timezones change their clocks at midnight
  (America/Santiago, 06/09/2026): an edge at 00:xx on that night does not exist, and cron does not
  run it. Europe and North America change theirs at night, between 01:00 and 03:00.
- **Overlap across triggers.** The redundant end is only dropped inside one trigger: a weekday
  trigger ending at 06:00 next to a weekend trigger starting at 06:00 runs both edges.
- No Cypress coverage of the editor yet.
