const db = require('../../models');
const { BadParameters } = require('../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { RESERVED_PARAM_PREFIX } = require('./constants');

/**
 * @description Disconnect an oauth2 config field: forget the credentials the
 * integration stored off-schema (that is where the contract puts the tokens,
 * see relayOAuthCallback) and push the emptied config so the integration drops
 * its session without a restart. The connection status is flipped right away so
 * the Configuration screen stops showing a stale "connected" badge.
 *
 * Only off-schema keys are removed: the values the user filled in the generated
 * form (declared in config_schema) are settings, not credentials, and are kept.
 * The reserved GLADYS_* keys (user preferences) are kept for the same reason.
 * @param {string} selector - The selector of the external integration.
 * @param {object} params - The request parameters.
 * @param {string} params.key - The oauth2 config_schema key.
 * @returns {Promise<object>} Resolve with { success: true }.
 * @example
 * await gladys.externalIntegration.disconnectOAuth('ext-dev-roborock', { key: 'xiaomi_account' });
 */
async function disconnectOAuth(selector, { key } = {}) {
  if (typeof key !== 'string' || key.length === 0) {
    throw new BadParameters('key: must be a non-empty string');
  }
  const service = await this.getBySelector(selector);
  const configSchema = (service.manifest && service.manifest.config_schema) || [];
  const field = configSchema.find((schemaField) => schemaField.key === key);
  if (!field || field.type !== 'oauth2') {
    throw new BadParameters(`config.${key}: not an oauth2 field`);
  }

  // config keys are stored uppercase in t_variable (see getIntegrationConfig)
  const schemaKeys = configSchema.map((schemaField) => schemaField.key.toUpperCase());
  const variables = await db.Variable.findAll({
    where: { service_id: service.id, user_id: null },
  });
  const credentialVariables = variables.filter(
    (variable) => !variable.name.startsWith(RESERVED_PARAM_PREFIX) && !schemaKeys.includes(variable.name),
  );
  await Promise.all(credentialVariables.map((variable) => this.variable.destroy(variable.name, service.id)));

  // the integration reloads its (now credential-less) config and logs out
  const fullConfig = await this.getIntegrationConfig(service);
  this.sendMessage(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CONFIG_UPDATED, { config: fullConfig });

  // do not wait for the integration to report it: the user clicked disconnect
  this.setConnectionStatus(service, { connected: false });

  return { success: true };
}

module.exports = {
  disconnectOAuth,
};
