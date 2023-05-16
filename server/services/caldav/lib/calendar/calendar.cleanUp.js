const Promise = require('bluebird');
const logger = require('../../../../utils/logger');

/**
 * @description Delete all CalDAV calendars and events.
 * @param {object} userId - Gladys user to clean up.
 * @returns {Promise} Resolving with client connected.
 * @example
 * cleanUp(user.id)
 */
async function cleanUp(userId) {
  logger.info(`Start cleaning CalDAV data for user: ${userId}`);
  const gladysCalendars = await this.gladys.calendar.get(userId, { serviceId: this.serviceId });
  logger.info(`${gladysCalendars.length} calendars to clean`);
  await Promise.map(gladysCalendars, (calendar) => this.gladys.calendar.destroy(calendar.selector), { concurrency: 2 });
}

module.exports = {
  cleanUp,
};
