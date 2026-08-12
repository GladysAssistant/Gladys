const { getContactSchema } = require('./externalIntegration.getContactProfile');

/**
 * @description The "My account" block values of one user for the frontend:
 * only the keys declared in the contact_schema, secrets never echoed back
 * (always null, with a configured_secrets flag). `configured` says whether
 * the user has saved anything at all — an unconfigured user is a silent
 * no-op of the outbound message loop.
 * @param {object} service - The external integration service (plain object).
 * @param {string} userId - Id of the user.
 * @returns {Promise<object>} Resolve with { values, configured_secrets, configured }.
 * @example
 * const profile = await gladys.externalIntegration.getContactProfileForFront(service, user.id);
 */
async function getContactProfileForFront(service, userId) {
  const contactSchema = getContactSchema(service.manifest);
  const profile = (await this.getContactProfile(service, userId)) || {};
  const values = {};
  const configuredSecrets = [];
  contactSchema.forEach((field) => {
    if (field.type === 'section') {
      return;
    }
    const hasValue = Object.prototype.hasOwnProperty.call(profile, field.key);
    if (field.type === 'secret') {
      values[field.key] = null;
      if (hasValue) {
        configuredSecrets.push(field.key);
      }
    } else {
      values[field.key] = hasValue ? profile[field.key] : null;
    }
  });
  return {
    values,
    configured_secrets: configuredSecrets,
    configured: Object.keys(profile).length > 0,
  };
}

module.exports = {
  getContactProfileForFront,
};
