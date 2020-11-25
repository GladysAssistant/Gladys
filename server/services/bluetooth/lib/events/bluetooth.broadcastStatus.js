const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description When the Bluetooth service needs to broadcast its status.
 * @example
 * bluetooth.on('broadcastStatus', this.broadcastStatus);
 */
function broadcastStatus() {
  const payload = this.getStatus();

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE,
    payload,
  });
}

module.exports = {
  broadcastStatus,
};
