const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc'); // dependent on utc plugin
const timezone = require('dayjs/plugin/timezone');

const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * @description When the driver is ready.
 * @param {string} homeId - The homeId.
 * @example
 * zwave.on('driver ready', this.driverReady);
 */
function driverReady(homeId) {
  logger.info(`Zwave : Driver is ready. homeId = ${homeId}`);

  this.scanInProgress = true;
  this.ready = true;

  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.DRIVER_READY,
    payload: {},
  });

  return true;
}

module.exports = {
  driverReady,
};
