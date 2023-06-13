const logger = require('../../../../utils/logger');

/**
 * @description Disable calendar synchronization.
 * @param {string} selector - Calendar selector to update.
 * @returns {Promise<object>} Resolve with updated calendar.
 * @example
 * disableCalendar('personnal')
 */
async function disableCalendar(selector) {
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
