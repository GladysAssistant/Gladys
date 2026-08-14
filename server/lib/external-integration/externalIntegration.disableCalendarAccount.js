const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { isCalendarIntegration } = require('./externalIntegration.getCalendarAccount');
const { CALENDAR_ACCOUNT_VARIABLE } = require('./constants');

/**
 * @description Disable a calendar integration for one user: their calendars
 * of this integration are destroyed (events with them, by cascade), the
 * account variable is removed and the integration is notified so it stops
 * syncing that user.
 * @param {string} selector - The integration selector.
 * @param {string} userId - Id of the user.
 * @returns {Promise<object>} Resolve with { success: true }.
 * @example
 * await gladys.externalIntegration.disableCalendarAccount('ext-dev-gcal', user.id);
 */
async function disableCalendarAccount(selector, userId) {
  const service = await this.getBySelector(selector);
  if (!isCalendarIntegration(service.manifest)) {
    throw new NotFoundError('EXTERNAL_INTEGRATION_NOT_FOUND');
  }
  const calendars = await db.Calendar.findAll({
    where: { service_id: service.id, user_id: userId },
    attributes: ['id', 'selector', 'shared'],
  });
  if (calendars.length > 0) {
    await db.Calendar.destroy({ where: { id: calendars.map((calendar) => calendar.id) } });
    // partitioned by prior visibility: a single broadcast would leak the
    // selectors of the user's private calendars to every connected user
    const sharedSelectors = calendars.filter((calendar) => calendar.shared).map((calendar) => calendar.selector);
    const privateSelectors = calendars.filter((calendar) => !calendar.shared).map((calendar) => calendar.selector);
    this.notifyCalendarUpdated(userId, sharedSelectors, true);
    this.notifyCalendarUpdated(userId, privateSelectors, false);
  }
  await this.variable.destroy(CALENDAR_ACCOUNT_VARIABLE, service.id, userId);
  await this.notifyCalendarAccountUpdated(service, userId);
  return { success: true };
}

module.exports = {
  disableCalendarAccount,
};
