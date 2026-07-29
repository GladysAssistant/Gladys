const { Error422 } = require('../../utils/httpErrors');
const { BadParameters } = require('../../utils/coreErrors');
const { validateConfigValue } = require('./externalIntegration.validateConfigValue');
const { getContactSchema } = require('./externalIntegration.getContactProfile');
const { CONTACT_PROFILE_VARIABLE } = require('./constants');

/**
 * @description Save the "My account" values of one user on a send-only
 * communication integration (partial merge, strictly validated against the
 * contact_schema, a secret set to null means unchanged). Every user — not
 * only the admin — manages their OWN identity on the channel; revocation
 * is deleteContactProfile.
 * @param {object} service - The external integration service (plain object).
 * @param {string} userId - Id of the user.
 * @param {object} values - The contact_schema values.
 * @returns {Promise<object>} Resolve with the front view of the profile.
 * @example
 * await gladys.externalIntegration.saveContactProfile(service, user.id, { username: '06...', access_token: 'x' });
 */
async function saveContactProfile(service, userId, values) {
  if (values === null || typeof values !== 'object' || Array.isArray(values)) {
    throw new BadParameters('values: must be an object');
  }
  const contactSchema = getContactSchema(service.manifest);
  if (contactSchema.length === 0) {
    throw new Error422('this integration has no contact schema');
  }
  const existingProfile = (await this.getContactProfile(service, userId)) || {};
  const newProfile = { ...existingProfile };
  Object.keys(values).forEach((key) => {
    const field = contactSchema.find((schemaField) => schemaField.key === key);
    if (!field) {
      throw new Error422(`contact.${key}: unknown contact key`);
    }
    if (field.type === 'secret' && values[key] === null) {
      // a secret set to null means unchanged
      return;
    }
    validateConfigValue(field, values[key]);
    newProfile[key] = values[key];
  });
  await this.variable.setValue(CONTACT_PROFILE_VARIABLE, JSON.stringify(newProfile), service.id, userId);
  return this.getContactProfileForFront(service, userId);
}

module.exports = {
  saveContactProfile,
};
