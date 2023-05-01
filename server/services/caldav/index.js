const Promise = require('bluebird');
const logger = require('../../utils/logger');
const CalDAVHandler = require('./lib');
const CalDAVController = require('./api/caldav.controller');

module.exports = function CalDAVService(gladys, serviceId) {
  const ical = require('ical');
  const dav = require('dav-request');
  const dayjs = require('dayjs');
  const objectSupport = require('dayjs/plugin/objectSupport');
  const duration = require('dayjs/plugin/duration');
  const advancedFormat = require('dayjs/plugin/advancedFormat');
  const isBetween = require('dayjs/plugin/isBetween');
  const utc = require('dayjs/plugin/utc');
  const timezone = require('dayjs/plugin/timezone');
  const xmlDom = require('xmldom');

  dayjs.extend(objectSupport);
  dayjs.extend(duration);
  dayjs.extend(advancedFormat);
  dayjs.extend(isBetween);
  dayjs.extend(utc);
  dayjs.extend(timezone);

  const calDavHandler = new CalDAVHandler(gladys, serviceId, ical, dav, dayjs, xmlDom);

  let interval;
  let webcalInterval;

  /**
   * @public
   * @description This function sync calendars for all users.
   * @example
   * gladys.services.caldav.syncAllUsers();
   */
  async function syncAllUsers() {
    try {
      const users = await gladys.user.get();
      const service = await gladys.service.getLocalServiceByName('caldav');

      await Promise.map(
        users,
        async (user) => {
          const caldavUrl = await gladys.variable.getValue('CALDAV_URL', service.id, user.id);
          if (caldavUrl) {
            await calDavHandler.syncUserCalendars(user.id);
          }
          return null;
        },
        { concurrency: 2 },
      );
    } catch (e) {
      logger.error(e);
    }
  }

  /**
   * @public
   * @description This function sync webcals for all users.
   * @example
   * gladys.services.caldav.syncAllUsersWebcals();
   */
  async function syncAllUsersWebcals() {
    try {
      const users = await gladys.user.get();

      await Promise.map(
        users,
        async (user) => {
          await calDavHandler.syncUserWebcals(user.id);
        },
        { concurrency: 2 },
      );
    } catch (e) {
      logger.error(e);
    }
  }

  /**
   * @public
   * @description This function starts the CalDAV service
   * and start interval to sync all users CalDAV calendars every 30mn
   * and start interval to sync all users Webcals calendars every 12h.
   * @example
   * gladys.services.caldav.start();
   */
  async function start() {
    logger.info('Starting CalDAV service');
    interval = setInterval(syncAllUsers, 1000 * 60 * 30);
    webcalInterval = setInterval(syncAllUsersWebcals, 1000 * 60 * 60 * 12);
  }

  /**
   * @public
   * @description This function stops the CalDAV service
   * and clear sync interval.
   * @example
   * gladys.services.caldav.stop();
   */
  async function stop() {
    logger.info('Stopping CalDAV service');
    clearInterval(interval);
    clearInterval(webcalInterval);
  }

  return Object.freeze({
    start,
    stop,
    syncAllUsers,
    syncAllUsersWebcals,
    calendar: {
      syncUserCalendars: calDavHandler.syncUserCalendars,
    },
    controllers: CalDAVController(calDavHandler),
  });
};
