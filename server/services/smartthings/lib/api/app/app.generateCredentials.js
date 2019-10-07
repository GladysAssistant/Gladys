const { call } = require('../call');

/**
 * @description Generate new OAuth credentials.
 * @param {string} appNameOrId - Application name or ID.
 * @param {string} token - OAuth bearer token.
 * @returns {Promise} New generated credentials.
 * @see https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#operation/generateAppOauth
 * @example
 * generateCredentials('c71b0a5b-7dab-41fe-b75f-7cf30246468e', 'my-bearer-token')
 */
async function generateCredentials(appNameOrId, token) {
  return call(`/apps/${appNameOrId}/oauth/generate`, token);
}

module.exports = {
  generateCredentials,
};
