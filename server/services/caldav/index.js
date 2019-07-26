const logger = require('../../utils/logger');
const CalDAVHandler = require('./lib');
const CalDAVController = require('./api/caldav.controller');

module.exports = function CalDAVService(gladys, serviceId) {
  const ical = require('ical');
  const dav = require('dav');
  const moment = require('moment');
  const xmlDom = require('xmldom');
  const https = require('https');

  const calDavHandler = new CalDAVHandler(gladys, serviceId, ical, dav, moment, xmlDom, https);

  /**
   * @public
   * @description This function starts the CalDAV service
   * @example
   * gladys.services.caldav.start();
   */
  async function start() {
    logger.log('starting CalDAV service');
  }

  /**
   * @public
   * @description This function stops the CalDAV service
   * @example
   * gladys.services.caldav.stop();
   */
  async function stop() {
    logger.log('stopping CalDAV service');
  }

  return Object.freeze({
    start,
    stop,
    calendar: {
      sync: calDavHandler.sync,
    },
    controllers: CalDAVController(calDavHandler),
  });
};
