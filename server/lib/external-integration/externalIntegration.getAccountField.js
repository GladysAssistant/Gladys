const { BadParameters } = require('../../utils/coreErrors');
const { ACCOUNT_FIELD_TYPES } = require('./constants');

/**
 * @description Find the account field (oauth2 / account_link) a request on
 * the account endpoints targets. One place for the lookup and for its 400
 * message, shared by the authorize URL, the callback and the disconnect.
 * @param {object} service - The external integration service.
 * @param {string} key - The config_schema key sent by the client.
 * @param {Array} [types] - The account field types accepted by the route.
 * @returns {object} The config_schema field.
 * @example
 * const field = getAccountField(service, 'xiaomi_account');
 */
function getAccountField(service, key, types = ACCOUNT_FIELD_TYPES) {
  const configSchema = (service.manifest && service.manifest.config_schema) || [];
  const field = configSchema.find((schemaField) => schemaField.key === key);
  if (!field || !types.includes(field.type)) {
    throw new BadParameters(`config.${key}: not an ${types.join(' or ')} field`);
  }
  return field;
}

module.exports = {
  getAccountField,
};
