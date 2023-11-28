const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/netatmo.constants');

/**
 * @description Get Netatmo status.
 * @returns {object} Current Netatmo network status.
 * @example
 * status();
 */
function getStatus() {
  const netatmoStatus = {
    configured: this.configured,
    connected: this.connected,
    status: this.status,
  };
  return netatmoStatus;
}

/**
 * @description Post Netatmo status.
 * @param {object} status - Configuration to save.
 * @returns {object} Current Netatmo network status.
 * @example
 * status('connecting', 'invalid_client');
 */
function saveStatus(status) {
  logger.debug('Changing status Netatmo ...');
  this.status = status.message;
  try {
    switch (status.statusType) {
      case STATUS.CONNECTING:
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTING,
          payload: { statusType: STATUS.CONNECTING, status: this.status },
        });
        break;
      case STATUS.PROCESSING_TOKEN:
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.PROCESSING_TOKEN,
          payload: { statusType: STATUS.PROCESSING_TOKEN, status: this.status },
        });
        break;
      default:
        break;
    }
    logger.debug('Status Netatmo well changed');
    return true;
  } catch (e) {
    return false;
  }
}
module.exports = {
  getStatus,
  saveStatus,
};
