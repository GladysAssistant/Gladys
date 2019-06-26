const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description When the scan is complete
 * @example
 * zwave.on('scan complete', this.scanComplete);
 */
function scanComplete() {
  logger.debug(`Zwave : Scan Complete!`);
  this.scanInProgress = false;
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.SCAN_COMPLETE,
    payload: {},
  });
}

module.exports = {
  scanComplete,
};
