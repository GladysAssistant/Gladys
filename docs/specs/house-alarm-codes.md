# House alarm codes (per-user PIN codes)

> **Living specification — source of truth** for the alarm codes of a Gladys instance: what a code
> is, who owns one, how codes are stored and compared, the REST contract, and the rate limits that
> protect them. Any PR that changes one of those behaviors or contracts must update this spec **in
> the same diff**.
>
> Companion spec: `house-alarm-modes.md` (the arming modes, the events and websocket messages, the
> HomeKit mapping — a code never decides *which* mode the alarm goes to).

## Context

A house had one alarm code and one only, `t_house.alarm_code`, stored in clear text and compared in
clear text. Everybody shared it: the occupants, the person watering the plants, the friend who
borrowed the keys for a weekend. Three consequences:

- nobody ever knew who disarmed the alarm;
- taking access away from one person meant changing the code for everyone;
- there was no way to grant access for a limited time.

It was also readable by anyone: `House` has no `toJSON` and no attribute whitelist, so the house
endpoints handed the code, in clear, to every authenticated user — habitants and guests included.

The code now belongs to the person, not to the house, and is valid wherever it is typed: the Gladys
app, a wall tablet, and later a physical keypad.

Source: [forum topic 10808](https://community.gladysassistant.com/t/systeme-dalarme-gladys/10808),
request A7.

## A. The code model

### A.1 A code identifies a person, not a house

An alarm code is 4 to 8 digits, and it belongs to **one** holder. There is a single code per
person, valid on every house of the instance: the alarm is per house, the code is not. An
installation with a second house does not get a second code to remember, and a keypad does not have
to ask which house a code belongs to.

A code **disarms**; it does not arm. Arming is asked for by a logged-in user, a scene or HomeKit,
and no arming route consumes a code — a locked wall tablet only holds the `alarm:write` scope, so it
cannot arm either. There is no per-code permission: a code that can send the house back to disarmed
is already the keys to the house.

### A.2 Two kinds of holders

| Kind | `user_id` | `name` | Who creates it |
|---|---|---|---|
| Personal | the user | — | the user, for themselves |
| Guest | `null` | required | an admin |

A personal code is the user's own business: an admin never sets, reads or changes the code of
another account. What an admin can do is create a **guest** code — for the person feeding the cat
for a week — without creating a Gladys account for them. That is why codes live in their own table
rather than in a column of `t_user`.

Deleting a user deletes their code (`onDelete: CASCADE`). Guest codes outlive everything but their
own revocation and expiry.

### A.3 Expiry and revocation

`valid_until` is either `null` (no expiry) or a date after which the code stops working. An expired
code is refused **exactly like a wrong one** — same `INVALID_CODE`, same rate-limit consumption:
the keypad must not tell a stranger that the code they hold used to open this house. It stays
listed as expired for the admin, who can delete it.

Revoking is deleting. There is no `revoked` flag: keeping the hash of a code nobody may use again
buys nothing, and expiry already covers "this access ends on Sunday". Only **guest** codes are
revocable: a personal code belongs to its holder (A.2), and revoking one would take no access away
anyway — its owner sets a new one in a second, and a logged-in user disarms without any code.

`valid_until` is stored as an instant, and the date picker of the frontend is what gives it a
calendar meaning: the picked day is kept whole, so the expiry is the **end of that local day**.
Reading `YYYY-MM-DD` as an instant would make it midnight UTC and kill the code the evening before
west of UTC.

### A.4 Hashing, and what it actually protects

Codes are hashed with bcrypt through `server/utils/password.js` — the same helper and the same cost
(10 rounds) as user passwords. Nothing in Gladys can read a code back: not the API, not the admin,
not a database dump, not a backup.

What this does **not** buy is resistance to an offline brute-force: a 4-digit PIN is 10 000
candidates, which bcrypt at cost 10 chews through in minutes. The gain is that the code is no
longer stored in clear, no longer travels in the house endpoints, and no longer sits in every
backup in readable form. Whoever wants more than that types more digits.

Because a hash cannot be looked up, validating a typed code means comparing it against the active
codes one after another. That is deliberate: the keypad of a locked tablet does not say who is
standing in front of it, so the code itself is the identity. Nothing caps the number of codes, so
nothing caps that scan: a wrong code on an instance holding twenty of them costs about two seconds
of bcrypt. The rate limits below are what keep it from being worth attacking; should a household
ever hold enough codes for the keypad to feel slow, a cap belongs here before an optimisation does.

### A.5 Two codes are never the same

A code identifies its holder, so two holders cannot share one: "who disarmed the alarm" has to have
one answer. Uniqueness is checked when a code is **written**, the only moment the server holds it in
clear: it is compared with every active code, and a collision is refused with
`ALARM_CODE_ALREADY_USED` — which never says whose code it collided with.

That refusal is a one-bit oracle ("this code is taken"), and on 10 000 combinations an oracle is an
enumeration tool. So writing a code is rate limited (B.4), the same way typing one already is. An
expired code is not "active" and can be taken over by somebody else.

Uniqueness is a read followed by a write, and a salted bcrypt hash cannot take a unique index, so
the database cannot hold this invariant for us. Code writes are therefore **serialized**: they queue
one behind the other, and two requests writing the same code cannot both find it free. Gladys is a
single process, so a queue is all it takes — a deterministic fingerprint column with a unique index
would work too, but a keyed hash over 10 000 candidates is reversible the moment that key leaks,
which is the property A.4 exists to avoid.

## B. Detailed design

### B.1 Data model

`t_alarm_code`, model `server/models/alarm_code.js`:

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, primary key | |
| `user_id` | UUID, nullable, FK `t_user.id`, `onDelete: CASCADE` | `null` for a guest code |
| `name` | STRING, nullable | the guest's name; required when `user_id` is `null` |
| `code` | STRING, not null | bcrypt hash |
| `valid_until` | DATE, nullable | `null` = no expiry |
| `created_at` / `updated_at` | DATE | |

`AlarmCode.prototype.toJSON` deletes `code`, the way `t_user` hides `password`: a hash has no
business leaving the server. A partial unique index on `user_id` (`WHERE user_id IS NOT NULL`)
enforces "one code per person" in the database rather than in a check the next caller may forget.

A code carries no `house_id`: see A.1.

### B.2 Server library

`server/lib/alarm-code/`, exposed as `gladys.alarmCode` and injected into `House` and `Session` so
`house.disarmWithCode` and `session.getTabletMode` can call it:

| Function | Behavior |
|---|---|
| `validate(code)` | Returns the active code row matching `code`, or `null`. Compares against the active rows in turn. |
| `setForUser(userId, code)` | Creates or replaces that user's code. Validates shape, uniqueness, rate limit. |
| `createGuest(createdByUserId, { name, code, valid_until })` | Same validation; `name` is required. The admin's id keys the rate limit. |
| `destroy(id)` | Revokes one guest code; a personal one is a `ForbiddenError` (`PERSONAL_ALARM_CODE`). |
| `destroyForUser(userId)` | Deletes that user's own code; deleting nothing is not an error. |
| `get()` | Lists codes — holder, name, expiry, never the hash. |
| `existsActive()` | Is there at least one usable code on this instance? |
| `existsForUser(userId)` | Does this user have a code? All the frontend can be told. |
| `serializeWrite(write)` | Queues the check-then-write of A.5, so two of them cannot overlap. |

`existsActive` replaces the `alarm_code === null || …` triplet that used to be copy-pasted in
`house.arm.js` and `session.getTabletMode.js`. The "active" condition itself lives in one place,
`activeCodes.js`.

Shape validation is 4 to 8 digits, `BadParameters` otherwise — the bounds `t_house.alarm_code`
already had. A collision is a `ConflictError`, so the API answers 409 without any extra mapping.

### B.3 REST API

| Route | Access | Effect |
|---|---|---|
| `GET /api/v1/alarm_code` | admin | list every code, hashes excluded |
| `POST /api/v1/alarm_code` | admin | create a guest code (`name`, `code`, `valid_until`) |
| `DELETE /api/v1/alarm_code/:id` | admin | revoke a **guest** code; 403 on a personal one |
| `GET /api/v1/me/alarm_code` | any user | `{ defined: true \| false }` — is my code set? |
| `PATCH /api/v1/me/alarm_code` | any user | set or replace my own code |
| `DELETE /api/v1/me/alarm_code` | any user | delete my own code |

The admin routes carry `admin: true`, like the house update route already does: **only an admin
configures the alarm**, while any user manages their own code and arms or disarms the house. The
`me` read answers whether a code exists, never the code.

The disarm-with-code route is unchanged — same body, same `alarm:write` scope, same `INVALID_CODE`
and `TOO_MANY_CODES_TESTS` answers. The locked-tablet keypad needs no change at all.

### B.4 Rate limits

| What | Key | Budget | Where |
|---|---|---|---|
| Typing a code | house selector | 3 tries / 5 min | `house.alarmCodeRateLimit`, unchanged |
| Writing a code | user id | 10 writes / hour | `alarmCode.writeRateLimit`, new |

The first one is the existing protection of the keypad, kept exactly as it is, including the
`alarm.too-many-codes-tests` scene trigger it fires when it runs out. The second one is what keeps
the uniqueness answer of A.5 from becoming an enumeration oracle. Both are in-memory
(`RateLimiterMemory`) and both answer `429` with `time_before_next`.

In memory means both budgets are forgotten on a restart — the behavior the keypad limiter already
had. Restarting Gladys to buy three more tries is not a shortcut worth closing: whoever can restart
the server owns the database.

### B.5 Knowing who armed or disarmed

Alarm payloads used to be exactly `{ house }`. They now also carry:

- `user` — the selector of the user who asked, or `null`;
- `user_name` — their firstname, or the name of the guest code that was typed, or `null`.

`null` is the honest answer for a scene, a HomeKit accessory or the API key of an integration: no
person asked. A code typed on a keypad names its holder, which is the whole point of A.1.

Both fields are built in one place, `server/utils/alarmEventAuthor.js`: `authorFromUser(req.user)`
for a request — the authenticated user is already loaded by the auth middleware, so this costs no
query — and `authorFromAlarmCode(code)` for a keypad. `arm`, `disarm` and `panic` take that pair as
their last argument and spread it into the events they emit.

The scene trigger matchers are untouched (`event.house === trigger.house`), and since a trigger
passes the whole event to the scene as `scope.triggerEvent`, a scene writes
`{{triggerEvent.user_name}}` in a notification with no new plumbing:

```
WHEN   Alarm ▸ disarmed
THEN   Notification ▸ "{{triggerEvent.user_name}} disarmed the alarm"
```

### B.6 Tablet locking

Arming locks the wall tablets of the house only when a code exists to unlock them — otherwise the
tablet would be stuck on a keypad nobody can answer. That condition is now "at least one active
code exists on the instance" (`alarmCode.existsActive()`), in `house.arm.js` and in the
`has_alarm_code` flag of `session.getTabletMode`. The frontend reads the same flag as before.

### B.7 Frontend registration points

- `front/src/routes/profile/AlarmCode.jsx` — where a user sets their own code, next to their
  profile, on the shape of `settings-users/edit-user/ResetPassword.jsx`. The shared
  `components/user/profile.jsx` is **not** touched: an admin editing another account must not be
  offered a code field.
- `front/src/components/house/EditHouse.jsx` — the alarm section's code input becomes the table of
  access codes (holder, expiry, revoke, plus an add row), on the shape of the API-keys table of
  `settings-gateway-open-api`. The table is instance-wide and says so; the per-house Alarm page of
  request A9 is where it will eventually live.
- `front/src/routes/settings/SettingsLayout.jsx` — the Houses tab becomes `adminOnly`, matching the
  server, which was already admin-only on the house update route.
- `front/src/routes/locked/index.js` — unchanged.
- i18n: new keys in `en.json`, `fr.json` **and** `de.json`.

### B.8 Migration

`server/migrations/20260912090000-per-user-alarm-codes.js`:

1. Creates `t_alarm_code` and its partial unique index.
2. Migrates the existing codes. Every distinct `t_house.alarm_code` becomes a **guest** code named
   after its house; identical codes are not duplicated. Not the personal code of one person, even
   though `t_house` has no owner column and the first admin would be the closest thing to one: that
   code was shared by the whole household, and handing it to somebody's personal slot would have the
   profile card invite them to *replace* what everybody else still types on the tablet — one write
   away from locking the family out. As a guest code it belongs to nobody, survives the deletion of
   any account, and whoever wants it as their own revokes that row and types it into their profile.
3. Clears `t_house.alarm_code`. The column itself stays: no migration in this repo drops a column,
   and on SQLite dropping one means recreating `t_house` and its foreign keys. The field is removed
   from the Sequelize model, so nothing reads it, writes it or serializes it any more — which is
   what closes the leak through the house endpoints.
4. `down` is empty, like every other migration here.

All of it runs in **one transaction**: an instance interrupted midway comes back with no table and
its house codes intact, rather than with half the codes migrated and a unique index that refuses
the retry.

Nobody is locked out by the update: the code that worked yesterday still works, and it now belongs
to somebody.

### B.9 What is not affected

HomeKit arms and disarms through the public methods and never had a code to give — unchanged, and
the accessory stays as trusted as the iCloud account behind it. The external-integration API never
exposed the alarm code (`externalIntegration.getHouses` whitelists five columns). The gateway
relays end-to-end encrypted messages and reads none of this. Backups ship the SQLite file, so they
now ship hashes instead of a clear-text code.

## C. Out of scope

- **A duress code** — one that disarms for show and warns quietly. A classic of alarm panels,
  deliberately left out of this round.
- **Per-code permissions** (arm only, disarm only, "may force arming"). The table can grow columns
  later; the vocabulary is not settled enough to freeze now.
- **A history of alarm events** ("who disarmed, when"). B.5 puts the information in the events, so
  a scene can notify or log it, but Gladys stores nothing: there is no event table in the repo, and
  building one belongs to its own request.
- **Codes scoped to one house**, and more than one code per person.
- **Taking a Gladys account's access away.** A code gates the keypad, not the authenticated API: a
  logged-in user disarms with no code at all, so revoking their code changes nothing for them.
  Removing somebody's access to the house is still deleting their account — which does take their
  code with it (`onDelete: CASCADE`). Only guest codes are access that a code *is*.
- **Anything a code triggers beyond disarming**: the reaction to repeated wrong codes stays the
  existing `alarm.too-many-codes-tests` scene trigger, with no notification and no siren of its own.

## Verification

```bash
cd server && npm run prettier-check && npm run eslint && npm run coverage
cd ../front && npm run prettier-check && npm run eslint && npm run compare-translations && npm run build
```

End to end, from the repo root with `npm start`, starting from a database that still holds a house
alarm code:

1. After the migration, the old code still disarms the alarm from the locked-tablet keypad, and it
   is listed as a guest code named after its house.
2. A non-admin sets their own code in their profile, arms from the widget, and disarms with it. The
   Houses tab is gone for them, and the house endpoints no longer return any code. The list offers
   no way to revoke that code.
3. An admin creates a guest code valid until today: it still disarms tonight. Back-dated, it is
   refused like a wrong code.
4. Saving a code that somebody else already uses is refused without naming them; an eleventh write
   in the hour answers 429.
5. Three wrong codes on the keypad still fire the `alarm.too-many-codes-tests` scene.
6. A scene reacting to "alarm disarmed" and notifying `{{triggerEvent.user_name}}` shows the
   firstname, or the guest code's name.
