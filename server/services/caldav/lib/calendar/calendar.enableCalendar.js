const logger = require('../../../../utils/logger');

/**
 * @description Enable or disable calendar synchronization.
 * @param {string} selector - Calendar selector to update.
 * @param {boolean} sync - New value for calendar sync.
 * @example
 * enableCalendar('personnal', false)
 */
async function enableCalendar(selector, sync) {
  const calendar = await this.gladys.calendar.update(selector, {
    sync,
    ...(!sync && { ctag: null }),
    ...(!sync && { sync_token: null }),
  });

  if (!sync) {
    await this.gladys.calendar.destroyEvents(calendar.id);
    logger.info(`Calendar ${selector} disabled & emptied`);
  } else {
    logger.info(`Calendar ${selector} enabled`);
  }

  return calendar;
}

module.exports = {
  enableCalendar,
};
