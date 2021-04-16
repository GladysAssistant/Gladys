const logger = require('../../../../utils/logger');

/**
 * @description Enable calendar synchronization.
 * @param {string} selector - Calendar selector to update.
 * @example
 * enableCalendar('personnal')
 */
async function enableCalendar(selector) {
  const calendar = await this.gladys.calendar.update(selector, {
    sync: true,
  });

  logger.info(`Calendar ${selector} enabled`);
  return calendar;
}

module.exports = {
  enableCalendar,
};
