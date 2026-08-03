const { CONTACT_PROFILE_VARIABLE } = require('./constants');

/**
 * @description Delete the "My account" values of one user on a send-only
 * communication integration: the revocation gesture of a notification
 * channel (no code-based link to revoke — the outbound loop becomes a
 * silent no-op for this user). Idempotent.
 * @param {object} service - The external integration service (plain object).
 * @param {string} userId - Id of the user.
 * @returns {Promise} Resolve when deleted.
 * @example
 * await gladys.externalIntegration.deleteContactProfile(service, user.id);
 */
async function deleteContactProfile(service, userId) {
  await this.variable.destroy(CONTACT_PROFILE_VARIABLE, service.id, userId);
}

module.exports = {
  deleteContactProfile,
};
