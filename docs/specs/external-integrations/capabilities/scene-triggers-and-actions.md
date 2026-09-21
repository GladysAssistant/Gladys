> Part of the [external integrations living spec](../README.md) — the layout, the editing rules and the cross-repo map are there.

# Scene triggers and scene actions declared by external integrations

Community request (topic 10870): external integrations should be able to declare their own scene triggers and scene actions, so that Gladys can be extended without a core update.

## 1. The problem

Every trigger and every action of the scene editor is a **core enum** today: `EVENTS.*` and `ACTIONS.*` in `server/utils/constants.js`, a checker in `scene.triggers.js` (`triggersFunc`), a handler in `scene.actions.js` (`actionsFunc`), a closed Joi shape in `models/scene.js`, a component and an i18n block per type in `front/src/routes/scene/edit-scene/`. An internal service that needs one gets it by editing the core — `mqtt.received`, `mqtt.send`, `zigbee2mqtt.send`, `sms.send`, the weather alerts: each one a hardcoded service name in the scene engine, exactly the block the communication (B.15) and weather (B.18) types removed elsewhere.

An external integration has **no such path**, and the generic surfaces it does have do not cover the need:

- **A device feature is a state, not an event.** `POST /state` + the `device.new-state` trigger cover everything that *is* a value (a temperature, a switch, a presence). They do not cover what *happens*: a licence plate recognized by Frigate (which plate? on which camera? which zone?), an object detected, a doorbell pressed with a snapshot, a voice command understood, an NFC tag scanned, a mail received. Bending a feature into that role (a `text` feature that stores the last plate, a `binary` feature pulsed to 1 then 0) loses the event's data, races on two events in a row, and pollutes the state history.
- **A `device.set-value` is a value, not an operation.** "Take a snapshot of this camera and return the image", "clean these three rooms", "announce this text on that speaker", "export the last clip" are operations with several parameters and a result — the manifest `actions` (C.1) already model them, but only as buttons on the Configuration screen, unreachable from a scene.

The result: two out of three integrations that expose events or operations (Frigate, robot vacuums, voice assistants, video doorbells) hit the wall of "fine, but I cannot make a scene out of it" — and the answer is never "add a trigger type to the core".

## 2. Design principles and decisions

**Declared in the manifest, rendered by the core** — the "declarative UI" principle of the whole framework. The integration declares its triggers and actions with the **same flat field format as the `config_schema`** (C.1): labels, fields, types. The core validates the declaration at install, renders the cards in the scene editor with the existing form engine, matches the events and relays the actions. No code injected, no custom component, no core update.

**The core matches, the integration knows nothing about scenes.** Two designs were possible: the integration receives the list of configured triggers and fires "scene X" by itself; or the integration fires a **typed event with data** and the core compares it with the triggers the user configured. The second one keeps every property the framework already holds: the integration never learns which scenes exist (nothing to leak, nothing to resynchronize on reconnection), the matching is deterministic and testable in the core, and the user's configuration stays in Gladys. The price is a matching model deliberately kept **simple** — equality and membership on declared fields (§4.2). Thresholds, operators and durations stay where they belong: on device features, through the `device.new-state` trigger, which already has them.

**Same doctrine as the webhooks and the weather nudge: "trigger, not data"** (B.17, B.18 point 5). An event says *"this happened, with these details"*; it triggers a scene, it never sets a state. Whatever is a state goes through `POST /state` as before, and the integration documentation must say so (§10). The two paths are complementary, never interchangeable.

**At most once, no queue, no retry** — the reliability rules of C.4 apply as-is. An event is evaluated once by the core; an event fired while Gladys is unreachable is a failed HTTP call the integration sees and handles. A scene action is emitted once to the integration; a timeout or a `success: false` fails that action, and only that action.

**No new authority class.** An integration already triggers scenes today, through the `device.new-state` trigger fed by its `POST /state`. A scene event only ever reaches the scenes whose author bound *that* trigger of *that* integration, and a scene action only runs where a scene author placed it: the trust boundary is unchanged, so the install screen **informs** ("adds N triggers and N actions to the scene editor") and enforces nothing new. The abuse surface — spamming events — is bounded by a rate limit (§5).

**Nothing hardcoded in the core.** The scene engine gains **one** trigger type and **one** action type, both generic, carrying the integration selector and the declared key. The integration is reached through its proxy service in the stateManager (`service.getService(selector)`, the exact path `mqtt.send` uses), extended with a `scene` capability object like `message.*` and `weather.*` before it.

## 3. Declaration in the manifest

Two optional top-level fields, declarable by **every** integration type (`device`, `communication`, `weather`, `provider`): a doorbell is a device integration, a "message received on my channel" trigger is a communication one.

`scene_triggers` and `scene_actions` are **capability fields** in the sense of `capabilities/provider-type.md`: any type may declare them on top of its primary contract, and an integration with no device surface whose whole contract is its declarations (an events-only bridge) is a `provider` — the two fields count for the "at least one capability field" rule of that type (`CAPABILITY_MANIFEST_FIELDS`). The install screen lists them next to the widgets, one disclosure line per capability.

```json
"scene_triggers": [
  {
    "key": "object_detected",
    "label": { "en": "Object detected", "fr": "Objet détecté" },
    "description": { "en": "Frigate detected an object on a camera.", "fr": "Frigate a détecté un objet sur une caméra." },
    "fields": [
      { "key": "camera", "type": "select", "source": "devices", "label": { "en": "Camera", "fr": "Caméra" }, "required": true },
      { "key": "label", "type": "multi_select", "label": { "en": "Object types", "fr": "Types d'objet" },
        "options": [
          { "value": "person", "label": { "en": "Person", "fr": "Personne" } },
          { "value": "car", "label": { "en": "Car", "fr": "Voiture" } },
          { "value": "dog", "label": { "en": "Dog", "fr": "Chien" } }
        ] },
      { "key": "zone", "type": "string", "label": { "en": "Zone (optional)", "fr": "Zone (optionnel)" },
        "placeholder": { "en": "driveway" } }
    ],
    "variables": [
      { "key": "label", "type": "string", "label": { "en": "Object type", "fr": "Type d'objet" } },
      { "key": "zone", "type": "string", "label": { "en": "Zone", "fr": "Zone" } },
      { "key": "score", "type": "number", "label": { "en": "Confidence", "fr": "Confiance" } }
    ]
  }
],
"scene_actions": [
  {
    "key": "create_snapshot",
    "label": { "en": "Take a snapshot", "fr": "Prendre un instantané" },
    "timeout_seconds": 20,
    "fields": [
      { "key": "camera", "type": "select", "source": "devices", "label": { "en": "Camera", "fr": "Caméra" }, "required": true },
      { "key": "caption", "type": "string", "label": { "en": "Caption", "fr": "Légende" } }
    ],
    "outputs": [
      { "key": "clip_id", "type": "string", "label": { "en": "Clip identifier", "fr": "Identifiant du clip" } }
    ]
  }
]
```

**`scene_triggers`** (1–20 entries, validated by the indexer **and** the server, per entry):
- `key` (required): `^[a-z0-9_]+$`, ≤ 40 characters, unique among the triggers of the manifest — the identifier the integration fires (§5) and the one stored in the scenes (§4). **Never renamed** once published: a renamed key is a removed key for every scene that uses it. Removing a key is supported, as a **breaking update** whose consequences are defined (§8: orphan cards in the editor, `404` on the event, failure of the action) — supported does not mean free;
- `label` (required, multi-language, `en` required — the entry of the trigger picker), `description` (optional, multi-language — the picker's subtitle);
- `fields` (optional, ≤ 10): the **filters** the scene author fills in, same format as the `config_schema` (C.1) with a restricted type list (below). Each field is compared with the event's value of the same key (§4.2). A field left empty by the user is a wildcard; `required: true` denies the wildcard in the editor (the Frigate "camera" above: a trigger on "any camera" is rarely what the user means). `default` is honored by the editor, `source: "devices"` is resolved to the integration's devices as everywhere else. A `multi_select` field is a **filter UI** ("match any of these"), never a shape of the event: the event carries **one** value per key, and the filter matches when that value is one of the selected ones;
- `variables` (optional, ≤ 20): **the only data the event exposes** to the scene's actions (`{{triggerEvent.data.<key>}}`, §4.3). Per entry: `key` (`^[a-z0-9_]+$`, unique among the variables), `type` (`string` | `number` | `boolean`), `label` (multi-language, `en` required), `description` (optional). **This list is a whitelist**: an event key declared nowhere in it never reaches an action, and a key declared only in `fields` is used for matching and nothing else — the variable picker of the editor is the source of truth of what a scene can read. A key may be declared in both lists (the `label` and `zone` above: filterable, **and** readable by the actions — which camera fired is only readable if `camera` is also a variable; the example leaves it out on purpose to make the rule visible).

**`scene_actions`** (1–20 entries, per entry):
- `key`, `label`, `description`: same rules as the triggers (`key` unique among the actions — triggers and actions are two namespaces);
- `fields` (optional, ≤ 10): the parameters of the action, same format as the trigger fields (type list below). `required` and `default` follow the `config_schema` semantics; `source: "devices"` passes the chosen `external_id`, exactly like a manifest action (C.1). **`string` fields accept scene variables** (`{{…}}`), resolved by the core before the action is sent (§4.4). Adding a `required` field **without a `default`** to an already-published action is a **breaking change** for every scene using it (§8): declare a `default`, or make the field optional;
- `timeout_seconds` (5–120, default 30): the ack delay granted to the command, the same exception to the 5 s rule as the manifest `actions` — a snapshot or a cloud call can be long;
- `outputs` (optional, ≤ 20): the values the action returns to the scene, exposed to the following actions as `{{<column>.<row>.<key>}}` (§4.4). Same entry format as `variables`, same whitelist rule. **Scalars only** — an identifier, a count, a short text —, never an image or a file (§13): the Frigate snapshot above returns a `clip_id`, and the picture itself takes the existing camera path — `POST /camera/image` on the camera device, then the core's `message.send-camera` action in the scene.

**Field types allowed in `fields`**: `string`, `number`, `select`, `multi_select`, `section` for both; **`boolean` for actions only** — a boolean toggle has no empty state, so a boolean trigger filter could never express "any" (a `select` with the two values gives the user the three states: either one, or empty = any). **Refused at validation**: `secret` (a scene is not a secret store — its JSON is readable by every user through `GET /api/v1/scene`), `oauth2` and `account_link` (linking an account is integration-scoped, it happens on the Configuration screen). A `section` keeps its primer role (a hint such as "zones are the names configured in Frigate") and may use `{{gladys_host}}`; **`{{port:<name>}}` is refused** in these sections, for the reason the `contact_schema` refuses it (C.1): the scene editor never loads the container detail that resolves it. The validation of a field is the existing `validateConfigField` of `externalIntegration.validateManifest.js` with the type restriction on top — no second engine.

**Indexer and compatibility**: the canonical `manifest.schema.json` (repo `GladysAssistant/integration-store`) gains two definitions (`sceneTrigger`, `sceneAction`, both `additionalProperties: false`) and the two top-level array fields; the vendored copy and the code mirror (`MANIFEST_FIELDS`, `validateManifest`) follow in the same monorepo diff. Like `categories` (C.1), declaring either field requires `gladys_version` ≥ the first release whose validator accepts it: older cores reject unknown manifest fields.

## 4. Core side: the scene engine

### 4.1 One generic trigger type, one generic action type

Two new constants — the scene model validates `type` against the flattened `EVENTS` and `ACTIONS` trees (`EVENT_LIST` / `ACTION_LIST`), so a per-integration `type` string is not an option; the integration and the key are carried as fields:

- `EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT = 'external-integration.scene-event'` (the trigger);
- `ACTIONS.EXTERNAL_INTEGRATION.SCENE_ACTION = 'external-integration.scene-action'` (the action).

Stored shapes (the `t_scene.triggers` / `t_scene.actions` JSON, validated by the Joi schemas of `models/scene.js` — new keys, added like `weather_alert_type` was):

```json
{ "type": "external-integration.scene-event", "integration": "ext-frigate", "trigger_key": "object_detected",
  "fields": { "camera": "ext:frigate:front", "label": ["person", "car"], "zone": null } }
```
```json
{ "type": "external-integration.scene-action", "integration": "ext-frigate", "action_key": "create_snapshot",
  "fields": { "camera": "ext:frigate:front", "caption": "Visitor: {{triggerEvent.data.label}} in {{triggerEvent.data.zone}}" } }
```

- `integration`: the integration's **selector** (`ext-…`, the user-facing identifier scenes use for everything — devices are referenced by selector too; the proxy service is registered under it in the stateManager);
- `trigger_key` / `action_key`: the declared key. **Not `key`**: `addScene` stamps a runtime `trigger.key` (a uuid, matched by the `time.changed` checker) on every trigger in RAM — a persisted `key` would be overwritten;
- `fields`: an object of the user's values, validated by Joi for its **shape only** — values are strings, finite numbers, booleans, `null`, or arrays of strings/numbers (`multi_select`); ≤ 10 keys, each `^[a-z0-9_]+$`. Nesting the values under `fields` keeps them out of the flat trigger/action namespace (`cancelTriggers` unsubscribes MQTT on the presence of a top-level `topic`, for one).

**The manifest is consulted at execution time, never at save time.** The scene model has no access to manifests and must not get any: a scene must load, save and display even when its integration is uninstalled or stopped, exactly like a scene referencing a deleted device. The value-level validation (required fields, enum membership, `source: "devices"`) is the editor's job on the way in, and the proxy service's job on the way out (§4.4).

### 4.2 Trigger matching

The integration fires an event (§5); the supervisor emits it on the scene pipeline:

```js
this.event.emit(EVENTS.TRIGGERS.CHECK, {
  type: EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT,
  integration: service.selector,
  trigger_key: 'object_detected',
  filters: { camera: 'ext:frigate:front', label: 'person', zone: 'driveway' }, // the declared fields, for matching (§5)
  data: { label: 'person', zone: 'driveway', score: 0.92 },                   // the declared variables, for the actions (§5)
});
```

The event carries **two objects built by the supervisor from the declaration** (§5): `filters`, keyed by the trigger's `fields`, read by the matcher and by nothing else; `data`, keyed by the trigger's `variables`, read by the actions and by nothing else. Both are complete — every declared key is present, `null` when the integration did not send it.

A new entry of `triggersFunc` (`scene.triggers.js`, next to `mqtt.received`) matches it against every active scene's triggers of that type — `checkTrigger` throws on an event type without a checker, so the entry is not optional:

1. `event.integration === trigger.integration && event.trigger_key === trigger.trigger_key`, else no match;
2. for each key of the **stored** `trigger.fields`, with `expected = trigger.fields[key]` and `actual = event.filters[key]`:
   - `actual === undefined` → the key is **not on the current declaration** (a filter removed by an update, §8): the stored value is stale, the key is **skipped** — no manifest lookup needed, `filters` is complete by construction;
   - `expected` is `null`, `''` or `[]` → **wildcard**, the key is skipped;
   - `actual === null` (declared, but absent from this event) while `expected` is set → **no match**;
   - `expected` is an array (`multi_select`) → match iff `actual` is one of its values (`===`);
   - otherwise → match iff `actual === expected` (strict: a `number` field is compared as a number, a `select` value as the string it is — option values are strings in the manifest schema; the editor stores the typed value, never a stringified one, and §5 coerces the event side to the same type);
3. every key matched → the scene runs, with a **reduced** `triggerEvent`: `{ type, integration, trigger_key, data }` — **`filters` never enters the scope** (§4.3). `checkTrigger` today executes with `{ triggerEvent: event }` as soon as the checker returns truthy; it gains one additive rule: **when the checker returns an object, that object is the `triggerEvent`** (a boolean `true` keeps the raw event, so every existing checker is unchanged). The scene-event checker returns the reduced object on a match and `false` otherwise — the same "build the trigger event you want the actions to see" idea the calendar path already applies with its formatted `calendarEvent`, expressed as a return value instead of a separate path.

A field **added** by an update is simply absent from the stored `fields` of older scenes: nothing to iterate, hence a wildcard, `required` or not — `required` is an editor rule, honored the next time the scene is opened.

Nothing else is evaluated: no operator, no threshold, no duration, no regex. That is the whole matching model, and it is deliberate (§2): a need for `>` on an event value is a sign that the value is a state and belongs to a device feature.

No subscribe/unsubscribe branch is needed in `addScene` / `cancelTriggers`: the integration is told nothing about the scenes (§2), it fires unconditionally and the core filters. The other listeners of `EVENTS.TRIGGERS.CHECK` (the Google Home / Alexa forwarders in `gateway/`, HomeKit) filter on `device.new-state` and ignore the new type — a test asserts it.

### 4.3 What the actions see

The scope carries the event under `triggerEvent`, so a declared variable is `{{triggerEvent.data.<key>}}` — the same mechanism the calendar trigger uses for `{{triggerEvent.calendarEvent.name}}`, and the same Handlebars rendering (`noEscape`) as every templated action field. `triggerEvent.data` holds **exactly the declared `variables`** (§5), and `triggerEvent` holds nothing else than `type`, `integration`, `trigger_key` and `data`: the matcher's `filters` are not copied into the scope (§4.2), so `{{triggerEvent.filters.camera}}` renders empty like any unknown path — the picker is the source of truth, and an integration that wants a filter readable declares it as a variable too (§3). The editor lists the declared `variables` with their localized labels (§7); several triggers of this type in one scene all resolve to the single `triggerEvent` that fired, so the picker keys its entries by `triggerEvent.data.<key>` and shows each key once, whichever triggers declare it.

### 4.4 Action execution

A new entry of `actionsFunc` (`scene.actions.js`), on the model of `mqtt.send` — and the one place that resolves the integration:

1. **Resolution**: `self.service.getService(action.integration)` → the proxy service. Absent (uninstalled), or without a `scene` capability (an integration whose manifest declares no `scene_actions`) → the action fails with a clear error (`EXTERNAL_INTEGRATION_NOT_FOUND` / `SCENE_ACTION_NOT_DECLARED`).
2. **Relay**: `proxy.scene.runAction(action.action_key, action.fields, { render })` — the **stored** fields, untouched, plus a `render(string)` callback that the scene engine builds from the scope (`Handlebars.compile(value, { noEscape: true })(scope)`, the exact rendering of `mqtt.send`'s `message`). The supervisor's `runSceneAction(service, key, fields, { render })` then works **in this order**, the declaration being consulted once and driving every step — it differs from `runAction` (the Configuration-screen path) **because the stored values can be older than the declaration** (§4.1, §8):
   1. finds the declaration in `service.manifest.scene_actions` (`404`-class error if absent — a key removed by an update, §8);
   2. **strips** every stored key that is not on the current declaration (a field removed by an update, or a stale value whose template no longer parses — never rendered, never an error) and **omits** every optional value that is `null` or `''` (an optional field left empty) — `runAction` answers `422` on both, because on the Configuration screen the form and the declaration are always the same version; here they are not, and neither case is an error;
   3. applies the declared `default` of every absent field;
   4. **renders, through `render`, only the fields whose declared type is `string`** — `{{0.0.last_value}}`, `{{triggerEvent.data.zone}}`… A `select` value is a string too, but it is an enum member, not a template, and it is passed through untouched like every `number`, `boolean` and `multi_select` value; nothing that is not a declared `string` field ever meets Handlebars;
   5. **validates the result** against the declared `fields` with the existing engine (`validateConfigValue` per field, `required`, dynamic `source: "devices"` values resolved like everywhere else) — nothing unvalidated reaches the container, and a genuinely stale scene (a required field added without a default, §8) fails loudly in the logs instead of sending garbage;
   6. **reserves an in-flight slot, before any wait**: at most **10 pending scene actions per integration**, counted from this reservation to the terminal outcome — an 11th fails immediately (`EXTERNAL_INTEGRATION_BUSY`), before `waitForConnection`, not after. The slot is released on **every** terminal outcome (ack, `success: false`, timeout, connection wait expired, validation error after reservation is impossible since validation comes first). `connectionWaiters` and `pendingCommands` are otherwise unbounded, and a disconnected integration is precisely where actions would pile up outside a cap placed on `sendCommand` alone (§9);
   7. **one deadline for the whole relay**: `deadline = entry + timeout_seconds`, started **when the scene reaches the action**, before step 1 — the resolution above (a database lookup for the `source: "devices"` values) is on the budget too, so the guarantee of §6 holds end to end. `waitForConnection` (the message relay's window, C.4, capped at 15 s) runs against that deadline, and `sendCommand(service, SCENE_ACTION_RUN, { key, fields })` gets what is left of it as its `timeoutMs` — so a disconnected integration never holds the action longer than `timeout_seconds`, whatever its value, and the guarantee below holds. The window matters here more than anywhere: a `system.start` scene fires while the containers are still booting.
3. **Result**: the ack's `data.outputs` (§6) is **whitelisted** against the declared `outputs` (undeclared keys dropped, every value coerced to its declared type with the same rules as the event data of §5 — a value that cannot be coerced is dropped —, strings capped at 10 000 characters) and written into the scope at the action's path with `set(scope, path, outputs)` — **replaced, never merged**: an action running again at the same path (a `condition.while` loop) must not leave the outputs of a previous run behind — so the next actions read `{{<column>.<row>.<key>}}`. A missing or non-object `data.outputs` is an empty object. Outputs are **scalars**: an image or a file cannot travel here (10 000 characters is not a JPEG), and a URL the container can reach is not one the user's phone or Gladys Plus can — the core never fetches an integration-supplied URL (the B.18 doctrine, an SSRF otherwise). A picture produced by an action is published on a camera device with `POST /camera/image` and consumed by the core's `message.send-camera` (§13).
4. **Failure**: timeout, `success: false`, integration disconnected, validation error → the action throws. `executeAction` treats it like any non-abort error: **logged, the scene continues** — the exact behavior of a `device.set-value` on an unreachable device. A following action reading an output of the failed one gets an empty value. A scene action is **never a condition**: it cannot abort the scene by itself. An integration whose answer should gate the rest of the scene declares an output, and the scene author follows it with the core's `condition.only-continue-if` on that variable — conditions stay generic, nothing to add.

Within a parallel group, a scene action holds the group for at most its `timeout_seconds`, connection wait included (the single deadline above) — the general rule of parallel actions.

## 5. Host API: firing an event

**`POST /api/integration/v1/scene/event`** — body `{ "key": "object_detected", "data": { "camera": "ext:frigate:front", "label": "person", "zone": "driveway", "score": 0.92 } }` → `200 { "success": true }`.

The identity comes from the JWT like everywhere on the host API (no selector in the URL). Rules:
- `key` must be a declared `scene_triggers[].key` of **this** integration's stored manifest, `404 NOT_FOUND` otherwise (the same answer as an undeclared manifest action);
- `data` is optional and **flat, one primitive per key**: ≤ 30 keys, values `string` (≤ 1000 characters), finite `number`, `boolean` or `null`; any nested object or array → `400 BAD_REQUEST` (a `multi_select` filter is a UI on the scene side, §3 — the event never carries a list). The event carries *details*, never a payload to interpret — a snapshot goes through `POST /camera/image`, a state through `POST /state`;
- **two whitelists, one per consumer** (the `normalizeWeather` doctrine: the payload is never trusted). The core builds `filters` from the trigger's declared `fields` (every declared key except `section`s, which carry no value) and `data` from its declared `variables`; every other key of the payload is dropped silently, and a declared key absent from the payload is stamped `null` in the object(s) that declare it. A key declared in both lists is copied into both;
- **coercion, by the declared type of the target**: in `data`, the variable's `type`; in `filters`, the field's type mapped as `string` / `select` / `multi_select` → string, `number` → number (`boolean` cannot occur, §3). A value already of that type is kept; a mismatch is **coerced when unambiguous** (numeric string → number, number → its decimal string, `"true"`/`"false"` → boolean) and dropped to `null` otherwise — a filter set on that key then does not match, which is the safe outcome. A key in both lists is coerced independently for each (`label` in §3: string on both sides; a `select` filter on a `number` variable would give `"3"` in `filters` and `3` in `data`);
- **rate limit: 300 events per minute per integration**, `429 TOO_MANY_REQUESTS` beyond — a **separate counter** from the states' (`POST /state` and `POST /scene/event` never compete: Frigate publishes both), with the same numeric constant and the same one-minute window as `MAX_STATES_PER_MINUTE`, sized so a fleet (eight Frigate cameras sharing `object_detected`) never hits it on legitimate transitions, while the scene-side cost is bounded elsewhere (the in-flight cap of §4.4, the admission note of §9). The doctrine still holds and the documentation teaches it in numbers (§10): **one event per transition** ("object entered", not "object still there" every frame); an integration emitting continuously is publishing a state, not an event;
- `200` means **accepted and evaluated once**, not "a scene ran": the response carries no scene information (the integration knows nothing about scenes, §2). Debugging goes through the core logs (one debug line per accepted event with the number of scenes started) and the scene's own execution feedback in the UI.

**Why REST and not a fire-and-forget WebSocket message** (the `weather.refresh` shape): that nudge carries zero state, so nothing can be wrong with it and silence is acceptable. An event carries data and a key, both of which can be wrong — the integration must get a `400`/`404`/`429` back, in every language with or without the SDK. `POST /state` and `POST /message` set the precedent.

## 6. WebSocket: running an action

| Direction | `type` | `payload` |
|---|---|---|
| core → integration | `external-integration.scene-action.run` | `{ "message_id": "uuid", "key": "create_snapshot", "fields": { "camera": "ext:frigate:front", "caption": "Visitor: person in driveway" } }` — a scene reached one of the integration's declared actions; `fields` are the **resolved** values (variables substituted, stale keys stripped, empty optionals omitted, defaults applied, validated, §4.4); respond via `command-result` with `data: { "outputs": { "clip_id": "1726646400.123-abc" } }` (only declared `outputs` keys are read, see §4.4); ack expected within the action's **declared `timeout_seconds`** (not 5 s), the manifest-actions exception — a deadline that starts when the scene reaches the action, connection wait included (§4.4) |

Follows the `<domain>.<action>` convention of C.4 and the standard `command-result` ack. It is **not** `action.run`: the two namespaces (`actions` vs `scene_actions`) and the two result conventions (`data.message` displayed under a button vs `data.outputs` fed to the scene) differ, and an integration must be able to serve both without a `key` collision. Nothing goes integration → core over the WS for this capability (§5).

## 7. Frontend: the scene editor

**Where the editor learns the declarations**: a new management route, **`GET /api/v1/external_integration/scene`** → `{ "integrations": [ { "selector": "ext-frigate", "name": "Frigate", "status": "RUNNING", "scene_triggers": [ … ], "scene_actions": [ … ] } ] }` — the installed integrations that declare at least one of the two, with `name` the manifest display name and the two arrays as stored. **Open to every authenticated user** (the `GET /api/v1/weather/provider` precedent): the scene editor is reachable by every role (only saving is admin), and the payload carries nothing operational — no image, no containers, no webhooks —, while the selectors already travel in every scene readable through `GET /api/v1/scene`. A **literal route declared before `:selector`**, added to the route-collision test of C.5. The editor fetches it once when it opens.

**Type pickers**: both pickers (`TRIGGER_CATEGORIES` / `ACTION_CATEGORIES` in `typesCatalog.js`) gain a dynamic **"Integrations"** category (label translated by the core, one fixed icon), shown only when at least one declaration exists, with one entry per (integration, declaration): title = the localized `label`, subtitle = the integration name (two integrations may both declare "Take a snapshot"), description = the localized `description`, searchable like the rest. Selecting one sets the three properties at once (`type`, `integration`, `trigger_key` / `action_key`) with `fields` initialized from the declared `default`s. Labels come from the manifest through the language fallback of C.1 (`getLocalizedText`, moved out of the integration route folder to `front/src/utils/` since the scene editor now needs it too); nothing to add to the i18n files per declaration — only the core's own strings (category, warnings below) go in every language file.

**Trigger card** (`triggers/ExternalIntegrationTrigger.jsx`): header "<integration name> · <trigger label>"; body = the declared `fields` rendered by the existing `ConfigField` (the `ActionsCard` precedent on the Configuration screen: the same component, `dynamicOptions.devices` fetched from the integration's devices), with two visible rules: a non-required field shows a "any" hint when empty (the wildcard, §4.2), a required one **blocks the save** until filled — the save handler walks the live cards of both types before the request and refuses, with a message naming the field, when a declared `required` field still holds a wildcard (the matcher never consults the manifest, §4.1, so the editor is the only place a required filter can be enforced: without it a saved card with an empty required camera would fire on every camera). Orphan cards (§8) are not walked: they are inert and save as they are. Below the fields, one muted line names the declared `variables` **by label only** ("Information passed on to the scene actions: Object type, Zone…", as badges): the user never sees a `{{triggerEvent.data.<key>}}` path — Gladys is a consumer product, and the paths are an implementation detail the variable picker hides everywhere else. The card declares them to the editor (`setVariablesTrigger`, name `data.<key>`, so the picker of the text fields offers them by label and inserts `{{triggerEvent.data.<key>}}` itself). The collapsed summary (`summary.js`) reads "<integration name>: <trigger label>" plus the non-wildcard filters.

**Action card** (`actions/ExternalIntegrationAction.jsx`): same header and same form engine, with two differences: **`string` fields are rendered by the variables-aware text input** (`TextWithVariablesInjected`, the one `mqtt.send` and `message.send` use) so the user inserts `{{…}}` from the picker instead of typing them; and `boolean` fields are allowed here (§3). The card declares the `outputs` as variables of its path (`setVariables`) and names them to the user by label only, on one muted line ("Results available to the following steps: Clip identifier…"), never as `{{<path>.<key>}}`; each `string` field carries the usual "type '{{' to insert scene information" help text when the manifest gives it no description. The **variable-path rewrite on drag** (`VARIABLES_ATTRIBUTES_IN_ACTION` in `edit-scene/index.js`) only understands top-level attributes and `conditions[].*` today, so a `fields.*` entry would be silently ignored: the rewrite step gains one rule for this action type — **iterate the own keys of `action.fields` and rewrite the values that are strings**, only those — so `{{triggerEvent.data.…}}` and `{{0.0.…}}` inside the fields survive a reorder. Without it, the references break silently on drag.

**Unavailable declarations, rendered honestly and never edited behind the user's back**: a card whose `integration` is not in the list (uninstalled) or whose key is no longer declared (removed by an update, §8) renders a warning line ("provided by an integration that is no longer installed" / "no longer declared by the installed version"), the stored `fields` as read-only key/value rows, and stays deletable. A card whose integration is `STOPPED`, `ERROR` or `DISABLED` renders a softer warning, worded per kind ("integration stopped: this trigger cannot fire until it runs" / "integration stopped: this action will fail until it runs"). The scene saves as-is in every case: the stale entry is inert (trigger) or fails at execution (action, §4.4), and the user decides. The editor keeps the **three states of the catalog** apart: unknown (`sceneIntegrations` is `null` — the request is pending or failed), loaded and empty, loaded. While unknown, an integration card shows a loading line instead of posing as an orphan, and the save of a scene holding such a card retries the request once and refuses with a message when it still fails: an orphan card is savable only against a *successfully* loaded catalog, since the required-filter guard above can only run against one — treating a failed request as "nothing installed" would let an unchecked required filter through.

**Install screen** (B.8): one informational line when either field is declared — "adds N triggers and N actions to the scene editor" —, next to the other declarations. Not a permission (§2).

**MCP service** (`services/mcp/lib/sceneSchemas.js`): the two new types are accepted by the AI's scene schemas (`integration`, `trigger_key` / `action_key`, `fields` as a permissive record) so a scene containing them can be read and rewritten by the assistant; exposing the catalog of declarations to the assistant (so it can *author* such a step) is a later, additive improvement.

## 8. Lifecycle: update, stop, uninstall

- **Update** replaces the stored manifest wholesale (`externalIntegration.update.js`), and the new declarations are live at once, without a restart: on the trigger side the host API loads the row per request (`validateToken`); on the action side the proxy service carries `scene.runAction` on **every** external integration whatever its manifest declares (like `device.setValue`), `runSceneAction` reads the **current** `t_service` row (`getBySelector`, exactly like `runAction`) on every run instead of the object the proxy closed over at registration, and `update` re-registers the proxy on the rewritten row. A trigger or action key that disappears leaves the scenes untouched (§7): the trigger no longer matches anything (the event key is `404` for the integration too), the action fails at execution with `SCENE_ACTION_NOT_DECLARED`. Fields evolve under **two different rules**, because a trigger filter and an action parameter fail differently:
  - **trigger fields**: a field **added** is absent from older scenes' stored `fields` → a wildcard, `required` or not (§4.2); a field **removed** is a stale stored key → skipped by the matcher (`actual === undefined`, §4.2). Existing scenes keep matching in both cases, and the editor shows the new field the next time the scene is opened;
  - **action fields**: a field **removed** is stripped before validation (§4.4), never an error; a field **added with a `default`** takes that default at execution; a field **added as `required` without a `default`** makes the action of every existing scene fail at execution until the user edits it — a **breaking change** the developer owns (§3), the one evolution this design does not absorb.
  Hence the rules of §3, stated as the developer documentation will (§10): a published key is **never renamed**; a declaration **grows** in the normal case; **removing** a key or adding a required action field without a default is a **breaking update** — supported, with the consequences above (orphan cards, `404` on the event, failing action), never silent.
- **Stopped / errored integration**: no events (the container is down), and a scene action fails after the connection window like any command to a disconnected integration.
- **Uninstall** deletes the integration, its devices, its config, its `t_service` row — and **nothing in `t_scene`**: a scene is the user's document, and the framework never modifies one on its own (the same stance as for devices deleted while a scene references them). The editor flags the orphan cards (§7).
- **Reinstall** under the same selector (same `store_slug` → `buildSelector` yields the same `ext-<slug>`) makes the orphan cards live again without a gesture — a deliberate consequence of referencing by selector.

## 9. Security and limits, stated plainly

- **Trust**: an event only reaches scenes whose author bound this integration's trigger; an action only runs where a scene author placed it. Equivalent to the authority the integration already holds through device states — no new disclosure, no new grant.
- **Payloads are never trusted**: event data whitelisted and bounded (§5), action outputs whitelisted and bounded (§4.4), every free-form text (labels, descriptions, output values displayed in the editor) rendered as escaped plain text like every integration-published text (C.1).
- **Rate, stated exactly**: the 300 events/min limit bounds **admissions**, not executions. A scene started by an event goes through the scene manager's queue like every trigger, and that queue runs with **unbounded concurrency** (`queue({ autostart: true })`, default `concurrency: Infinity` — the path `device.new-state` already takes): a burst is a burst of concurrent executions, not a polite line. The accepted ceiling is therefore "up to 300 scene executions per minute admitted from one integration", the same order as what its device states can already start. What this design bounds on top is the **return path**: the in-flight cap of §4.4 (10 pending `scene-action.run` per integration) keeps a slow or hostile container from accumulating tens of 120 s commands in `pendingCommands`.
- **Loops** (accepted risk, documented): a scene action that makes the integration fire an event bound by the same scene loops through the integration — the core's `alreadyExecutedScenes` guard cannot see it (a new event is a new execution). The two bounds above cap the damage (300 admissions/min, 10 in-flight actions), they do not stop it: the developer documentation names the pattern to avoid (fire events from *external* causes, never as a consequence of a received action).
- **Secrets**: refused in `fields` (§3). A scene's JSON is readable by every user.

## 10. SDK and documentation

**SDK** (`@gladysassistant/integration-sdk`, C.8), two additions:

| Member | Contract |
|---|---|
| `publishSceneEvent(key, data?)` | `POST /scene/event` — fires a declared trigger; `data` flat, primitives only (§5); throws `GladysApiError` on `400`/`404`/`429` |
| `onSceneAction(key, cb)` | `(fields) => Promise<object \| void>` — handler of a declared scene action, registered by `key`; the resolved object goes into `data.outputs` (only declared keys are read), `undefined` = no outputs; the ack delay is the action's `timeout_seconds`. Same auto-ack rules as `onAction` (throw → `success: false` with the message; absent handler → `"not implemented"`) |

**Template** (`integration-template-js`): declares one demo trigger (`demo_event`, fired by a "Fire a demo event" manifest action so the journey is testable without hardware, with one `select` filter and one `string` variable) and one demo action (`echo`, one `string` field, one `string` output returning it) — the e2e journey of §12.

**Developer documentation** (B.12, website): a page "Scene triggers and actions" with the doctrines a developer needs — *state vs event* (a value is a feature, a happening is a trigger; the `>`-on-an-event smell), *trigger, not data* (transposed from the webhooks), *one event per transition* ("object entered", debounced upstream, never one event per frame — the 300/min budget is for a fleet, not for a stream), *keys are never renamed, removing one is a breaking update, and a new required action field ships with a default* (§8), *outputs are scalars, pictures take the camera path* (§4.4) — and the loop pattern to avoid (§9).

## 11. Tests (100% patch coverage)

- **Manifest**: `scene_triggers` / `scene_actions` validated (bounds 1–20, unique keys per list, key regex and length, `fields` ≤ 10 with the restricted type list — `secret`/`oauth2`/`account_link` rejected everywhere, `boolean` rejected on trigger fields and accepted on action fields, `{{port:<name>}}` rejected in sections —, `variables`/`outputs` ≤ 20 with the type enum, `timeout_seconds` bounds and default); a manifest with both fields accepted by the vendored schema **and** the code mirror; the indexer fixtures (repo `integration-store`) cover the same cases.
- **Host API** `POST /scene/event`: the full authentication battery of B.13 (401 without/invalid/user/revoked token); `404` on an undeclared key and on an integration declaring no trigger; `400` on nested data, on an array value, on a string over 1000 characters, on more than 30 keys; the two whitelists (`filters` = declared fields minus sections, `data` = declared variables, undeclared keys dropped, absent declared keys `null` in each object, a key in both lists copied into both); coercion by target type (numeric string → number for a `number` field, number → string for a `select` filter, `"true"` → boolean for a boolean variable, non-coercible → `null`); `429` past 300/min; the emitted `EVENTS.TRIGGERS.CHECK` payload shape; **tenant isolation** (A's token cannot fire B's key: the declaration lookup is on the caller's manifest).
- **Trigger matching** (`test/lib/scene/triggers/scene.trigger.externalIntegrationSceneEvent.test.js`, on the `mqttReceived` model): integration and key mismatch; wildcard on `null`/`''`/`[]`; **stale stored key** (a `fields` key absent from `event.filters`, event otherwise matching → the scene runs); `null` in `filters` vs a set filter → no match; `multi_select` membership; strict equality on number and string; inactive scene skipped; **reduced scope** (the executed scene's `triggerEvent` deep-equals `{ type, integration, trigger_key, data }` — no `filters` key — and a `message.send` templated with `{{triggerEvent.filters.camera}}` renders it empty); `checkTrigger` keeps passing the raw event when a checker returns `true` (an existing trigger's test); the gateway/HomeKit listeners ignore the type.
- **Action** (`test/lib/scene/actions/scene.action.externalIntegrationSceneAction.test.js`, on the `sendMqttMessage` model): the proxy receives the stored `fields` untouched plus a `render` that resolves `{{0.0.last_value}}` and `{{triggerEvent.data.zone}}` from the scope; `getService` absent → error logged, scene continues; proxy without `scene` capability → error; outputs written at the path and readable by the next action (`{{0.0.clip_id}}`); failure → next action reads an empty value.
- **Supervisor** `runSceneAction`: undeclared key; stale stored key **stripped before anything else** (no `422`, never rendered even when it holds a malformed template, the command is sent without it); optional `null`/`''` value omitted; declared `default` applied to an absent field; **only declared `string` fields rendered** (a `select` value containing `{{` is sent verbatim, a `number` is untouched); `required` missing without default → error; `source: "devices"` value of another integration refused; **slot reserved before the connection wait** (10 disconnected actions waiting → the 11th rejected immediately with `EXTERNAL_INTEGRATION_BUSY` without entering `waitForConnection`; the slot released on ack, on `success: false`, on timeout and on an expired connection wait — the count returns to 0 after each); **single deadline** (`timeout_seconds: 5`, integration disconnected → rejected at ~5 s, not 20; connected after 2 s → `sendCommand` gets ~3 s); `sendCommand` called with `SCENE_ACTION_RUN`; outputs whitelisted (undeclared dropped, string capped, non-finite number dropped, non-object → `{}`); `success: false` and timeout rejected.
- **Proxy service**: `scene.runAction` present iff the manifest declares `scene_actions`; the frozen object still exposes `device.*` (and `message.*` / `weather.*` for those types).
- **Scene model** (Joi): the two shapes accepted; `fields` refused when nested, with a bad key, or over 10 keys; a persisted `key` on a trigger is not what the engine matches (the `trigger_key` naming test).
- **Management API** `GET /api/v1/external_integration/scene`: non-admin allowed; only integrations with a declaration; the reduced payload (no `docker_image`, no `containers`, no `webhooks`); declared before `:selector` (the collision test extended).
- **MCP schemas**: the two types accepted with `fields` passthrough.
- **Lifecycle**: the proxy registered on a manifest without scene actions runs a scene action declared by a later rewrite of the row (no `init` in between), and rejects `EXTERNAL_INTEGRATION_NOT_FOUND` once the row is gone; `update` re-registers the proxy on the updated row.
- **Front** (Cypress, on the `ExternalIntegrationOAuth.cy.js` + `Scene.cy.js` model): intercept `GET /api/v1/external_integration/scene` with a manifest declaring one trigger and one action → the "Integrations" category appears in both pickers → pick the trigger, fill a required `select`, see the passed-on information named by label (no path) → pick the action, insert `{{triggerEvent.data.<key>}}` in a string field → save → the persisted JSON has the §4.1 shapes; then intercept a failing request → the cards show the loading line, not the orphan warning, and the save is refused with a message; then intercept an empty list → the cards render the orphan warning and the scene still saves. `compare-translations` for the core strings.

## 12. Manual verification

1. Install the template (dev mode) with its demo declarations → the install screen shows "adds 1 trigger and 1 action to the scene editor".
2. New scene: trigger picker → "Integrations" → "Demo event" (subtitle: the integration name); set the `select` filter; the card names the string variable by label. Action picker → "Integrations" → "Echo"; type "Got {{triggerEvent.data.<key>}}" in the field using the picker; add a `message.send` after it with `{{1.0.<output>}}`. Save.
3. On the Configuration screen, click "Fire a demo event" with a value matching the filter → the scene runs, the message contains the event's value echoed by the container; fire with a non-matching value → nothing runs; `docker logs` shows `scene-action.run` received with the resolved `fields`.
4. Stop the integration → the cards show the "stopped" warning; fire nothing (container down); start a scene running the action by hand → the action fails in the logs after the connection window, the following `message.send` still runs with an empty value.
5. Bump the template with the trigger key renamed → after update, the trigger card shows "no longer declared", the scene saves; the old key fired by hand from the container → `404`.
6. Uninstall → the scene keeps its two cards flagged as orphans; reinstall → they are live again.
7. From the container, fire 301 events in a minute → the 301st is `429`; send `data` with a nested object or an array → `400`; an undeclared key → `404`.
8. Update the template with a filter removed from the trigger and a required field with a default added to the action → the existing scene still matches the event and the action runs with the default; then add a required field **without** a default → the action fails in the logs until the scene is edited.

## 13. Out of scope, stated openly

- **Operators, thresholds and durations on event data** (§2, §4.2) — by design; a value is a device feature.
- **Conditions declared by integrations** (an action that aborts the scene) — `outputs` + `condition.only-continue-if` cover the need without a third concept.
- **Binary and image outputs** (a snapshot returned by an action, a typed `image` output, a URL the core would fetch) — by design (§4.4): a picture is published on a camera device through `POST /camera/image` and consumed by the core's `message.send-camera` or the camera field of `ai.ask`; the "notify me with the picture" scene of topic 10870 is a `create_snapshot` action followed by `message.send-camera` on that camera, and needs no new output type.
- **The integration learning which triggers are configured** (to subscribe upstream only to what is needed, or to stop polling when no scene listens) — a later additive message (`scene.triggers-updated`, fire-and-forget) if a real case demands it; nothing in this design prevents it.
- **Pushing the declarations to the assistant** (MCP) so it can author integration steps — additive (§7).
- **Consent surviving updates** for new declarations — the cross-cutting question left open in C.3 for every declarative contract; this one adds no permission, so it is the least affected.
