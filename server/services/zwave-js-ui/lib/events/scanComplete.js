const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description When the scan is complete.
 * @example
 * this.scanComplete();
 */
function scanComplete() {
  logger.debug(`Zwave : Scan Complete!`);

  if (this.scanInProgress) {
    this.scanInProgress = false;
    this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.SCAN_COMPLETE,
    });
  }
}

module.exports = {
  scanComplete,
};
