const logger = require('../../../../utils/logger');
const { assertOwnCalendar } = require('./calendar.assertOwnCalendar');

/**
 * @description Disable calendar synchronization.
 * @param {string} selector - Calendar selector to update.
 * @param {string} userId - The requesting user, who must own the calendar.
 * @returns {Promise<object>} Resolve with updated calendar.
 * @example
 * disableCalendar('personnal', userId)
 */
async function disableCalendar(selector, userId) {
  await assertOwnCalendar(this.gladys, this.serviceId, selector, userId);
  const calendar = await this.gladys.calendar.update(selector, {
    sync: false,
    ctag: null,
    sync_token: null,
  });

  await this.gladys.calendar.destroyEvents(calendar.id);
  logger.info(`Calendar ${selector} disabled & emptied`);
  return calendar;
}

module.exports = {
  disableCalendar,
};
