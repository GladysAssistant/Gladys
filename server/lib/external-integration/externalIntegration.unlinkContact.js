const { CONTACT_VARIABLE } = require('./constants');

/**
 * @description Unlink the account of a Gladys user from a communication
 * integration (revocation, from the integration page: each user sees and
 * unlinks their OWN account). Idempotent.
 * @param {string} selector - The selector of the external integration.
 * @param {string} userId - Id of the user unlinking their account.
 * @returns {Promise} Resolve when the link is removed.
 * @example
 * await gladys.externalIntegration.unlinkContact('ext-john-gladys-telegram', user.id);
 */
async function unlinkContact(selector, userId) {
  const service = await this.getBySelector(selector);
  await this.variable.destroy(CONTACT_VARIABLE, service.id, userId);
}

module.exports = {
  unlinkContact,
};
