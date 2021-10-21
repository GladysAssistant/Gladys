const logger = require('../../../../utils/logger');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc'); // dependent on utc plugin
const timezone = require('dayjs/plugin/timezone');

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { updateConfiguration } = require('../commands/zwave.updateConfiguration');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * @description When the driver is ready.
 * @param {string} homeId - The homeId.
 * @returns {void} Void.
 * @example
 * zwave.on('driver ready', this.driverReady);
 */
function driverReady(homeId) {
  logger.debug(`Zwave : Driver is ready. homeId = ${homeId}`);

  const todayAtMidnightInMyTimeZone = dayjs()
        .hour(24)
        .minute(0)
        .tz(this.timezone)
        .toDate();
  this.updateConfigJob = this.schedule.scheduleJob(todayAtMidnightInMyTimeZone, () =>
    updateConfiguration()
  );

  this.scanInProgress = true;
  this.ready = true;
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.DRIVER_READY,
    payload: {},
  });
}

module.exports = {
  driverReady,
};
