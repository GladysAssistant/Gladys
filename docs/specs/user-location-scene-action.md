# User location scene action

## Goal and existing behavior

Users can already write coordinates through `POST /api/v1/user/:user_selector/location` (self or admin). The OwnTracks gateway handler resolves the user and calls the same `location.create` manager. A native scene action makes this operation available to automations without an HTTP action or an OwnTracks-compatible webhook.

## Contract

`user.set-location` has a fixed `user` selector and two fields: `latitude` and `longitude`. Each coordinate accepts either a number or plain text with the scene engine's existing Handlebars variables, for example `{{triggerEvent.data.latitude}}` from an integration trigger or `{{0.0.value}}` from an earlier action. The editor uses the existing variable-aware input so trigger and earlier-action variables can be selected. This action does not introduce a Find My integration, a new trigger or a webhook: location data must already be available to the scene.

Both coordinate fields participate in the scene editor's existing variable-reference rewriting when steps are inserted, deleted or reordered, including inside nested branches. Moving the actions that produce the coordinates must not swap their meaning.

On execution, both coordinates are resolved from the current scene scope and validated **before any write**: nonempty, finite numbers, latitude between −90 and 90, longitude between −180 and 180, inclusive. Zero and negative values are valid. Missing/unresolved variables, blank values and out-of-range coordinates abort the scene without changing a location. Incomplete fields may be saved while configuring a scene, like other native actions, but cannot be executed. Unknown users follow the location manager's existing error behavior.

The action calls `location.create(user, { latitude, longitude })`, preserving location history, the user's `last_*` fields, location WebSocket updates and area entry/exit triggers. It does **not** set `current_house_id` or house presence directly; area-triggered scenes and the existing home/away actions remain responsible for that. Altitude and accuracy are not inferred or overwritten with fabricated values. The action grants no new API permissions: it runs under the existing scene execution model, just like the actions that set another user's home/away status.

No SQL migration or new endpoint is needed. The action is registered in the action list, scene JSON schema, executor, editor picker, collapsed summary and MCP scene-creation schema, with English, French, German and Spanish translations. MCP accepts the same numeric bounds and coordinate-template lengths as the scene model, and uses the existing known-user selectors. Invalid coordinate templates fail closed; the action does not evaluate arbitrary JavaScript or formulas.
