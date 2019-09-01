const { call } = require('../call');
/**
 * @description Get desired application.
 * @param {string} appNameOrId - Application name or ID.
 * @param {string} token - OAuth bearer token.
 * @returns {Object[]} Desired application.
 * @see https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#operation/getApp
 * @example
 * get('Gladys-app', 'my-bearer-token')
 */
async function get(appNameOrId, token) {
  return call(`/apps/${appNameOrId}`, token);
}

module.exports = {
  get,
};
