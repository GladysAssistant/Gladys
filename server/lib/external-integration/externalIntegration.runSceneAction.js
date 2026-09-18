const { BadParameters, NotFoundError, ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const {
  ACTION_DEFAULT_TIMEOUT_SECONDS,
  MESSAGE_CONNECTION_WAIT_MS,
  MAX_PENDING_SCENE_ACTIONS,
  MAX_SCENE_ACTION_OUTPUT_LENGTH,
} = require('./constants');
const { validateConfigValue } = require('./externalIntegration.validateConfigValue');
const { getDynamicOptions } = require('./externalIntegration.getDynamicOptions');
const { getDeclaredSceneActions, coerceSceneValue } = require('./externalIntegration.sceneDeclarations');

/**
 * @description Whitelist the outputs an integration returns to a scene
 * against the declared outputs: undeclared keys dropped, every value coerced
 * to its declared scalar type (the same coercion as the event data, a value
 * that cannot be coerced is dropped), strings capped. Scalars only — an image
 * or a file never travels here (a picture takes the camera path).
 * @param {any} outputs - The `data.outputs` of the command result.
 * @param {Array} declaredOutputs - The declared outputs of the action.
 * @returns {object} The whitelisted outputs.
 * @example
 * normalizeSceneActionOutputs({ clip_id: 'abc', junk: {} }, [{ key: 'clip_id', type: 'string' }]);
 */
function normalizeSceneActionOutputs(outputs, declaredOutputs) {
  const normalized = {};
  if (outputs === null || typeof outputs !== 'object' || Array.isArray(outputs)) {
    return normalized;
  }
  declaredOutputs.forEach((output) => {
    const value = coerceSceneValue(outputs[output.key], output.type);
    if (value === null) {
      return;
    }
    normalized[output.key] = typeof value === 'string' ? value.slice(0, MAX_SCENE_ACTION_OUTPUT_LENGTH) : value;
  });
  return normalized;
}

/**
 * @description Resolve the stored fields of a scene action against the
 * CURRENT declaration, in this order: strip the keys no longer declared and
 * the empty optionals (a scene can be older than the declaration — neither
 * is an error here, unlike runAction), apply the declared defaults, render
 * the scene variables of the declared `string` fields only (a select value
 * is an enum member, never a template), then validate everything with the
 * config_schema engine — nothing unvalidated reaches the container.
 * @param {object} service - The external integration service.
 * @param {object} declaration - The declared scene action.
 * @param {object} storedFields - The fields stored in the scene.
 * @param {Function} render - Renders a string through the scene scope.
 * @returns {Promise<object>} Resolve with the resolved fields.
 * @example
 * const fields = await resolveSceneActionFields(service, declaration, { caption: '{{0.0.value}}' }, render);
 */
async function resolveSceneActionFields(service, declaration, storedFields, render) {
  const declaredFields = (declaration.fields || []).filter((field) => field.type !== 'section');
  const fields = {};
  declaredFields.forEach((field) => {
    const stored = storedFields[field.key];
    if (stored !== undefined && stored !== null && stored !== '') {
      fields[field.key] = stored;
    } else if (field.default !== undefined) {
      fields[field.key] = field.default;
    }
  });
  declaredFields.forEach((field) => {
    if (field.type === 'string' && typeof fields[field.key] === 'string') {
      fields[field.key] = render(fields[field.key]);
    }
  });
  const dynamicOptions = await getDynamicOptions(service, declaredFields);
  declaredFields.forEach((field) => {
    if (fields[field.key] === undefined) {
      if (field.required) {
        // a required field added by an update without a default: the scene
        // fails loudly until the user edits it, never sends garbage
        throw new BadParameters(`fields.${field.key}: required`);
      }
      return;
    }
    validateConfigValue(field, fields[field.key], dynamicOptions);
  });
  return fields;
}

/**
 * @description Run a scene action declared by the integration, reached by a
 * scene: resolve the stored fields against the current declaration
 * (resolveSceneActionFields), reserve an in-flight slot BEFORE any wait
 * (at most 10 pending scene actions per integration, an 11th fails
 * immediately with EXTERNAL_INTEGRATION_BUSY), then relay over WebSocket
 * under ONE deadline started at entry — the declared timeout_seconds covers
 * the resolution, the connection wait of the startup window and the ack
 * alike, so a scene never holds on the action longer than the declared
 * timeout. The
 * whitelisted outputs are returned to the scene.
 * @param {object} service - The external integration service.
 * @param {string} actionKey - The declared scene action key.
 * @param {object} [storedFields] - The fields stored in the scene, untouched.
 * @param {object} [options] - Options.
 * @param {Function} [options.render] - Renders a string through the scene scope.
 * @returns {Promise<object>} Resolve with the whitelisted outputs.
 * @example
 * const outputs = await gladys.externalIntegration.runSceneAction(service, 'create_snapshot', {}, { render });
 */
async function runSceneAction(service, actionKey, storedFields = {}, { render = (value) => value } = {}) {
  // the deadline starts when the scene reaches the action: the resolution
  // below (a DB lookup for the dynamic device options) is on the budget too
  const entryTime = Date.now();
  const declaration = getDeclaredSceneActions(service.manifest).find((action) => action.key === actionKey);
  if (!declaration) {
    throw new NotFoundError(`SCENE_ACTION_NOT_DECLARED: scene action ${actionKey} is not declared in the manifest`);
  }
  if (storedFields === null || typeof storedFields !== 'object' || Array.isArray(storedFields)) {
    throw new BadParameters('fields: must be an object');
  }
  const timeoutSeconds = declaration.timeout_seconds || ACTION_DEFAULT_TIMEOUT_SECONDS;
  const deadline = entryTime + timeoutSeconds * 1000;
  const fields = await resolveSceneActionFields(service, declaration, storedFields, render);
  const pending = this.pendingSceneActions.get(service.id) || 0;
  if (pending >= MAX_PENDING_SCENE_ACTIONS) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_BUSY');
  }
  this.pendingSceneActions.set(service.id, pending + 1);
  try {
    // a system.start scene fires while the containers are still booting:
    // wait for the connection inside the startup window, against the deadline
    await this.waitForConnection(service, Math.max(0, Math.min(MESSAGE_CONNECTION_WAIT_MS, deadline - Date.now())));
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT');
    }
    const result = await this.sendCommand(
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.SCENE_ACTION_RUN,
      { key: actionKey, fields },
      { timeoutMs: remainingMs },
    );
    return normalizeSceneActionOutputs(result && result.data && result.data.outputs, declaration.outputs || []);
  } finally {
    // released on every terminal outcome: ack, refusal, timeout, expired wait
    const stillPending = this.pendingSceneActions.get(service.id) - 1;
    if (stillPending <= 0) {
      this.pendingSceneActions.delete(service.id);
    } else {
      this.pendingSceneActions.set(service.id, stillPending);
    }
  }
}

module.exports = {
  runSceneAction,
  normalizeSceneActionOutputs,
};
