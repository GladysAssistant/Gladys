const db = require('../../models');
const logger = require('../../utils/logger');
const { NotFoundError } = require('../../utils/coreErrors');
const { CALENDAR_ACCOUNT_VARIABLE } = require('./constants');

/**
 * @description Whether a manifest declares a calendar integration (B.19).
 * @param {object} manifest - The integration manifest.
 * @returns {boolean} True on a calendar integration.
 * @example
 * isCalendarIntegration(service.manifest);
 */
function isCalendarIntegration(manifest) {
  return Boolean(manifest) && manifest.type === 'calendar';
}

/**
 * @description The per-user account schema of a calendar integration.
 * @param {object} manifest - The integration manifest.
 * @returns {Array} The account_schema fields ([] when not declared).
 * @example
 * getAccountSchema(service.manifest);
 */
function getAccountSchema(manifest) {
  return (manifest && manifest.account_schema) || [];
}

/**
 * @description The stored account values of one user on a calendar
 * integration. The variable's presence is the enablement marker: null means
 * "not enabled", an (even empty) object means "enabled".
 * @param {object} service - The external integration service (plain object).
 * @param {string} userId - Id of the user.
 * @returns {Promise<object|null>} Resolve with the stored values, or null.
 * @example
 * const account = await gladys.externalIntegration.getCalendarAccount(service, user.id);
 */
async function getCalendarAccount(service, userId) {
  const raw = await this.variable.getValue(CALENDAR_ACCOUNT_VARIABLE, service.id, userId);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    // the parse error is not logged: it embeds a snippet of the value, which
    // carries the secret fields of the account schema
    logger.warn(`Invalid stored calendar account of integration ${service.selector}`);
    return {};
  }
}

/**
 * @description The "My calendars" view of one user on a calendar
 * integration: enablement, account values (secrets always null, listed in
 * configured_secrets) and their calendars with the user-owned toggles.
 * @param {string} selector - The integration selector.
 * @param {string} userId - Id of the requesting user.
 * @returns {Promise<object>} Resolve with { enabled, config, configured_secrets, calendars }.
 * @example
 * const view = await gladys.externalIntegration.getCalendarAccountForUser('ext-dev-gcal', user.id);
 */
async function getCalendarAccountForUser(selector, userId) {
  const service = await this.getBySelector(selector);
  if (!isCalendarIntegration(service.manifest)) {
    // the exact error of an unknown selector: probing reveals nothing
    throw new NotFoundError('EXTERNAL_INTEGRATION_NOT_FOUND');
  }
  const account = await this.getCalendarAccount(service, userId);
  const accountSchema = getAccountSchema(service.manifest);
  const config = {};
  const configuredSecrets = [];
  const storedValues = account || {};
  accountSchema.forEach((field) => {
    if (field.type === 'section') {
      return;
    }
    const hasValue = Object.prototype.hasOwnProperty.call(storedValues, field.key);
    if (field.type === 'secret') {
      config[field.key] = null;
      if (hasValue) {
        configuredSecrets.push(field.key);
      }
    } else {
      config[field.key] = hasValue ? storedValues[field.key] : null;
    }
  });
  const calendars = await db.Calendar.findAll({
    where: { service_id: service.id, user_id: userId },
    attributes: ['selector', 'name', 'color', 'sync', 'shared'],
    order: [['name', 'ASC']],
  });
  return {
    enabled: account !== null,
    config,
    configured_secrets: configuredSecrets,
    calendars: calendars.map((calendar) => calendar.get({ plain: true })),
  };
}

module.exports = {
  isCalendarIntegration,
  getAccountSchema,
  getCalendarAccount,
  getCalendarAccountForUser,
};
