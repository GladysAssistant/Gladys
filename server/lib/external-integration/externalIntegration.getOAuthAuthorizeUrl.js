const { BadParameters, ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { ACCOUNT_FIELD_TYPES } = require('./constants');

/**
 * @description Relay a sign-in URL request to an integration (the user clicked
 * "Connect" on an `oauth2` or an `account_link` config field). The Gladys server
 * knows no provider: the integration builds the URL itself (client_id from its
 * config, scopes, anti-CSRF state it generates and keeps) and answers
 * through command-result data. A disconnected integration or a missing
 * answer is a 400.
 *
 * `redirect_uri` is required for an `oauth2` field, where the provider comes
 * back to it with an authorization code, and is ignored for an `account_link`
 * one, where nothing ever redirects back (the provider is approved elsewhere and
 * the integration detects it on its side).
 * @param {string} selector - The selector of the external integration.
 * @param {object} params - The request parameters.
 * @param {string} params.key - The oauth2 or account_link config_schema key.
 * @param {string} [params.redirect_uri] - The generic front callback URL (oauth2 only).
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
  const service = await this.getBySelector(selector);
  const configSchema = (service.manifest && service.manifest.config_schema) || [];
  const field = configSchema.find((schemaField) => schemaField.key === key);
  if (!field || !ACCOUNT_FIELD_TYPES.includes(field.type)) {
    throw new BadParameters(`config.${key}: not an oauth2 or account_link field`);
  }
  if (field.type === 'oauth2' && (typeof redirectUri !== 'string' || redirectUri.length === 0)) {
    throw new BadParameters('redirect_uri: must be a non-empty string');
  }
  // the payload is built explicitly so the wire format cannot drift from the
  // spec: `redirect_uri` is only ever relayed for an `oauth2` field — a value a
  // client would POST for an `account_link` field is ignored, not forwarded
  const result = await this.sendCommand(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.OAUTH_GET_AUTHORIZE_URL, {
    key,
    redirect_uri: field.type === 'oauth2' ? redirectUri : undefined,
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
