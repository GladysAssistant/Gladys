const { call } = require('../call');

/**
 * @description Create new application.
 * @param {Object} app - Application to create.
 * @param {string} token - OAuth bearer token.
 * @returns {Promise} Created application.
 * @see https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#operation/createApp
 * @example
 * create(location, 'my-bearer-token')
 */
async function create(app, token) {
  return call('/apps', token, 'POST', app);
}

module.exports = {
  create,
};
