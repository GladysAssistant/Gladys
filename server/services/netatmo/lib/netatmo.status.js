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
 * @param {object} netatmoHandler - Of nothing.
 * @param {object} status - Configuration to save.
 * @returns {object} Current Netatmo network status.
 * @example
 * status(netatmoHandler, {statusType: 'connecting', message: 'invalid_client'});
 */
function saveStatus(netatmoHandler, status) {
  logger.debug('Changing status Netatmo ...');
  try {
    switch (status.statusType) {
      case STATUS.ERROR.CONNECTING:
        netatmoHandler.status = STATUS.DISCONNECTED;
        netatmoHandler.connected = false;
        netatmoHandler.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTING,
          payload: { statusType: STATUS.CONNECTING, status: status.message },
        });
        break;
      case STATUS.ERROR.PROCESSING_TOKEN:
        netatmoHandler.status = STATUS.DISCONNECTED;
        netatmoHandler.connected = false;
        netatmoHandler.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.PROCESSING_TOKEN,
          payload: { statusType: STATUS.PROCESSING_TOKEN, status: status.message },
        });
        break;
      case STATUS.ERROR.CONNECTED:
        netatmoHandler.configured = true;
        netatmoHandler.status = STATUS.DISCONNECTED;
        netatmoHandler.connected = false;
        netatmoHandler.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTED,
          payload: { statusType: STATUS.CONNECTED, status: status.message },
        });
        break;
      case STATUS.ERROR.SET_DEVICES_VALUES:
        netatmoHandler.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTED,
          payload: { statusType: STATUS.CONNECTED, status: status.message },
        });
        break;

      case STATUS.NOT_INITIALIZED:
        netatmoHandler.configured = false;
        netatmoHandler.status = STATUS.NOT_INITIALIZED;
        netatmoHandler.connected = false;
        clearInterval(netatmoHandler.pollRefreshValues);
        break;
      case STATUS.CONNECTING:
        netatmoHandler.configured = true;
        netatmoHandler.status = STATUS.CONNECTING;
        netatmoHandler.connected = false;
        break;
      case STATUS.PROCESSING_TOKEN:
        netatmoHandler.configured = true;
        netatmoHandler.status = STATUS.PROCESSING_TOKEN;
        netatmoHandler.connected = false;
        break;
      case STATUS.CONNECTED:
        netatmoHandler.configured = true;
        netatmoHandler.status = STATUS.CONNECTED;
        netatmoHandler.connected = true;
        break;
      case STATUS.DISCONNECTED:
        netatmoHandler.configured = true;
        netatmoHandler.status = STATUS.DISCONNECTED;
        netatmoHandler.connected = false;
        clearInterval(netatmoHandler.pollRefreshValues);
        break;
      case STATUS.DISCOVERING_DEVICES:
        netatmoHandler.configured = true;
        netatmoHandler.status = STATUS.DISCOVERING_DEVICES;
        netatmoHandler.connected = true;
        break;

      default:
        break;
    }
    logger.debug('Status Netatmo well changed');
    netatmoHandler.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: netatmoHandler.status },
    });
    return true;
  } catch (e) {
    return false;
  }
}
module.exports = {
  getStatus,
  saveStatus,
};
