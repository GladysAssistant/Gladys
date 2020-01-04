const Promise = require('bluebird');
const logger = require('../../utils/logger');
const CalDAVHandler = require('./lib');
const CalDAVController = require('./api/caldav.controller');

module.exports = function CalDAVService(gladys, serviceId) {
  const ical = require('ical');
  const dav = require('dav');
  const moment = require('moment');
  const xmlDom = require('xmldom');
  const request = require('request-promise-native');

  const calDavHandler = new CalDAVHandler(gladys, serviceId, ical, dav, moment, xmlDom, request);

  let interval;

  /**
   * @public
   * @description This function starts the CalDAV service
   * and start interval to sync all users every 30mn
   * @example
   * gladys.services.caldav.start();
   */
  async function start() {
    logger.log('starting CalDAV service');
    interval = setInterval(async () => {
      try {
        const users = await gladys.user.get();
        const service = await gladys.service.getLocalServiceByName('caldav');

        await Promise.map(
          users,
          async (user) => {
            const caldavUrl = await gladys.variable.getValue('CALDAV_URL', service.dataValues.id, user.id);
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
    }, 1000 * 60 * 15);
  }

  /**
   * @public
   * @description This function stops the CalDAV service
   * and clear sync interval
   * @example
   * gladys.services.caldav.stop();
   */
  async function stop() {
    logger.log('stopping CalDAV service');
    clearInterval(interval);
  }

  return Object.freeze({
    start,
    stop,
    calendar: {
      syncUserCalendars: calDavHandler.syncUserCalendars,
    },
    controllers: CalDAVController(calDavHandler),
  });
};
