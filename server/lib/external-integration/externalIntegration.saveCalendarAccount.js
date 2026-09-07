const { Error422 } = require('../../utils/httpErrors');
const { BadParameters, NotFoundError } = require('../../utils/coreErrors');
const { validateConfigValue } = require('./externalIntegration.validateConfigValue');
const { getDynamicOptions } = require('./externalIntegration.getDynamicOptions');
const { isCalendarIntegration, getAccountSchema } = require('./externalIntegration.getCalendarAccount');
const { CALENDAR_ACCOUNT_VARIABLE } = require('./constants');

/**
 * @description Enable a calendar integration for one user and save their
 * account values (partial merge, strictly validated against the
 * account_schema, a secret set to null means unchanged). Without an
 * account_schema the config must be empty or omitted: enabling with zero
 * fields is a first-class state, materialized by the account variable
 * itself. Every user — not only the admin — manages their OWN account.
 * @param {string} selector - The integration selector.
 * @param {string} userId - Id of the user.
 * @param {object} [values] - The account_schema values.
 * @returns {Promise<object>} Resolve with the "My calendars" view.
 * @example
 * await gladys.externalIntegration.saveCalendarAccount('ext-dev-gcal', user.id, { server_url: 'https://...' });
 */
async function saveCalendarAccount(selector, userId, values = {}) {
  const service = await this.getBySelector(selector);
  if (!isCalendarIntegration(service.manifest)) {
    throw new NotFoundError('EXTERNAL_INTEGRATION_NOT_FOUND');
  }
  if (values === null || typeof values !== 'object' || Array.isArray(values)) {
    throw new BadParameters('config: must be an object');
  }
  const accountSchema = getAccountSchema(service.manifest);
  const existingAccount = (await this.getCalendarAccount(service, userId)) || {};
  const newAccount = { ...existingAccount };
  const dynamicOptions = accountSchema.length > 0 ? await getDynamicOptions(service, accountSchema) : {};
  Object.keys(values).forEach((key) => {
    const field = accountSchema.find((schemaField) => schemaField.key === key);
    if (!field) {
      throw new Error422(`config.${key}: unknown account key`);
    }
    if (field.type === 'secret' && values[key] === null) {
      // null on a secret = unchanged
      return;
    }
    validateConfigValue(field, values[key], dynamicOptions);
    newAccount[key] = values[key];
  });
  await this.variable.setValue(CALENDAR_ACCOUNT_VARIABLE, JSON.stringify(newAccount), service.id, userId);
  await this.notifyCalendarAccountUpdated(service, userId);
  return this.getCalendarAccountForUser(selector, userId);
}

module.exports = {
  saveCalendarAccount,
};
