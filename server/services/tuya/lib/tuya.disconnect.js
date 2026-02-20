const logger = require('../../../utils/logger');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');
const { STATUS } = require('./utils/tuya.constants');

/**
 * @description Disconnects service and dependencies.
 * @param {object} [options] - Disconnect options.
 * @param {boolean} [options.manual] - Whether this is a manual disconnect.
 * @example
 * disconnect();
 */
function disconnect(options = {}) {
  logger.debug('Disonnecting from Tuya...');
  const { manual = false } = options;
  this.connector = null;
  this.status = STATUS.NOT_INITIALIZED;
  this.lastError = null;

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
    payload: { status: this.status, manual_disconnect: manual },
  });
}

module.exports = {
  disconnect,
};
