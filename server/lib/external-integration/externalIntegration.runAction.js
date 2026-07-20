const { BadParameters, NotFoundError, ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { Error422 } = require('../../utils/httpErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { ACTION_DEFAULT_TIMEOUT_SECONDS } = require('./constants');
const { validateConfigValue } = require('./externalIntegration.validateConfigValue');

// transport-level failures stay a 400 (integration unreachable), only an
// explicit refusal of the integration (success: false) becomes a 422
const TRANSPORT_ERRORS = ['EXTERNAL_INTEGRATION_NOT_CONNECTED', 'EXTERNAL_INTEGRATION_COMMAND_TIMEOUT'];

/**
 * @description Run an on-demand action declared in the manifest (a button of
 * the Configuration screen): validate the form values against the action
 * fields (same engine as the config_schema), relay over WebSocket
 * (action.run) and wait for the ack within the timeout DECLARED BY THE
 * ACTION (these operations can be long — protocol detection, re-pairing —
 * this is the one exception to the 5s ack rule). The integration answers
 * with an optional result message shown under the button.
 * @param {string} selector - The selector of the external integration.
 * @param {string} actionKey - The key of the declared action.
 * @param {object} [fields] - The values of the action form.
 * @returns {Promise<object>} Resolve with { success: true, message }.
 * @example
 * await gladys.externalIntegration.runAction('ext-dev-tuya', 'detect_protocol', { ip: '192.168.1.42' });
 */
async function runAction(selector, actionKey, fields = {}) {
  if (fields === null || typeof fields !== 'object' || Array.isArray(fields)) {
    throw new BadParameters('fields: must be an object');
  }
  const service = await this.getBySelector(selector);
  const declaredActions = (service.manifest && service.manifest.actions) || [];
  const action = declaredActions.find((declaredAction) => declaredAction.key === actionKey);
  if (!action) {
    throw new NotFoundError(`action ${actionKey} is not declared in the manifest`);
  }
  const declaredFields = action.fields || [];
  Object.keys(fields).forEach((key) => {
    const field = declaredFields.find((declaredField) => declaredField.key === key);
    if (!field) {
      throw new Error422(`fields.${key}: unknown action field`);
    }
    validateConfigValue(field, fields[key]);
  });
  declaredFields.forEach((field) => {
    if (field.required && fields[field.key] === undefined) {
      throw new Error422(`fields.${field.key}: required`);
    }
  });
  const timeoutSeconds = action.timeout_seconds || ACTION_DEFAULT_TIMEOUT_SECONDS;
  let result;
  try {
    result = await this.sendCommand(
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.ACTION_RUN,
      { key: actionKey, fields },
      { timeoutMs: timeoutSeconds * 1000 },
    );
  } catch (e) {
    if (e instanceof ExternalIntegrationUnavailableError && !TRANSPORT_ERRORS.includes(e.message)) {
      throw new Error422(e.message);
    }
    throw e;
  }
  return {
    success: true,
    message: (result && result.data && result.data.message) || null,
  };
}

module.exports = {
  runAction,
};
