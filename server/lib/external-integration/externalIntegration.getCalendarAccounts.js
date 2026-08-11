const db = require('../../models');
const logger = require('../../utils/logger');
const { ForbiddenError } = require('../../utils/coreErrors');
const { isCalendarIntegration } = require('./externalIntegration.getCalendarAccount');
const { CALENDAR_ACCOUNT_VARIABLE } = require('./constants');

/**
 * @description The users who enabled this calendar integration, with their
 * account values — secrets included: this is the integration side, like
 * GET /config. This is how the integration knows who to sync.
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise<Array>} Resolve with [{ user, config }].
 * @example
 * const accounts = await gladys.externalIntegration.getCalendarAccounts(service);
 */
async function getCalendarAccounts(service) {
  if (!isCalendarIntegration(service.manifest)) {
    throw new ForbiddenError('CALENDAR_NOT_ALLOWED');
  }
  const variables = await db.Variable.findAll({
    where: { name: CALENDAR_ACCOUNT_VARIABLE, service_id: service.id },
    include: [{ model: db.User, as: 'user', attributes: ['selector', 'firstname', 'language'] }],
  });
  const accounts = [];
  variables.forEach((variable) => {
    if (!variable.user) {
      return;
    }
    let config;
    try {
      config = JSON.parse(variable.value);
    } catch (e) {
      logger.warn(`Invalid stored calendar account of integration ${service.selector}`, e);
      config = {};
    }
    accounts.push({
      user: {
        selector: variable.user.selector,
        first_name: variable.user.firstname,
        language: variable.user.language,
      },
      config,
    });
  });
  return accounts;
}

module.exports = {
  getCalendarAccounts,
};
