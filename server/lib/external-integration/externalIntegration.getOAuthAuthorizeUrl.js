const { BadParameters, ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description Relay an OAuth2 authorize URL request to an integration (the
 * user clicked "Connect" on an oauth2 config field). The Gladys server knows
 * no provider: the integration builds the URL itself (client_id from its
 * config, scopes, anti-CSRF state it generates and keeps) and answers
 * through command-result data. A disconnected integration or a missing
 * answer is a 400.
 * @param {string} selector - The selector of the external integration.
 * @param {object} params - The request parameters.
 * @param {string} params.key - The oauth2 config_schema key.
 * @param {string} params.redirect_uri - The generic front callback URL.
 * @returns {Promise<object>} Resolve with { authorize_url }.
 * @example
 * const { authorize_url } = await gladys.externalIntegration.getOAuthAuthorizeUrl('ext-dev-netatmo', {
 *   key: 'netatmo_account',
 *   redirect_uri: 'https://my-gladys/dashboard/integration/device/external/ext-dev-netatmo/oauth-callback',
 * });
 */
async function getOAuthAuthorizeUrl(selector, { key, redirect_uri: redirectUri } = {}) {
  if (typeof key !== 'string' || key.length === 0) {
    throw new BadParameters('key: must be a non-empty string');
  }
  if (typeof redirectUri !== 'string' || redirectUri.length === 0) {
    throw new BadParameters('redirect_uri: must be a non-empty string');
  }
  const service = await this.getBySelector(selector);
  const configSchema = (service.manifest && service.manifest.config_schema) || [];
  const field = configSchema.find((schemaField) => schemaField.key === key);
  if (!field || field.type !== 'oauth2') {
    throw new BadParameters(`config.${key}: not an oauth2 field`);
  }
  const result = await this.sendCommand(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.OAUTH_GET_AUTHORIZE_URL, {
    key,
    redirect_uri: redirectUri,
  });
  const authorizeUrl = result && result.data && result.data.authorize_url;
  if (typeof authorizeUrl !== 'string' || authorizeUrl.length === 0) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_OAUTH_RESPONSE');
  }
  return { authorize_url: authorizeUrl };
}

module.exports = {
  getOAuthAuthorizeUrl,
};
