const logger = require('../../../../utils/logger');
const { assertOwnCalendar } = require('./calendar.assertOwnCalendar');

/**
 * @description Enable calendar synchronization.
 * @param {string} selector - Calendar selector to update.
 * @param {string} userId - The requesting user, who must own the calendar.
 * @returns {Promise<object>} Resolve with updated calendar.
 * @example
 * enableCalendar('personnal', userId)
 */
async function enableCalendar(selector, userId) {
  await assertOwnCalendar(this.gladys, this.serviceId, selector, userId);
  const calendar = await this.gladys.calendar.update(selector, {
    sync: true,
  });

  logger.info(`Calendar ${selector} enabled`);
  return calendar;
}

module.exports = {
  enableCalendar,
};
