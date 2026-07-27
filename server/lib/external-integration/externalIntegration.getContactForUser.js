const logger = require('../../utils/logger');
const { CONTACT_VARIABLE } = require('./constants');

/**
 * @description Get the external contact linked to a Gladys user for one
 * communication integration, or null when the user has not linked their
 * account.
 * @param {object} service - The external integration service (plain object).
 * @param {string} userId - Id of the user.
 * @returns {Promise<object|null>} Resolve with { contact_id, contact_name, linked_at } or null.
 * @example
 * const contact = await gladys.externalIntegration.getContactForUser(service, user.id);
 */
async function getContactForUser(service, userId) {
  const rawContact = await this.variable.getValue(CONTACT_VARIABLE, service.id, userId);
  if (!rawContact) {
    return null;
  }
  try {
    return JSON.parse(rawContact);
  } catch (e) {
    logger.warn(`Invalid stored contact of integration ${service.selector}`, e);
    return null;
  }
}

module.exports = {
  getContactForUser,
};
