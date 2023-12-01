const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description Update the service status and emit WebSocket event.
 * @param {object} newStatus - New service status.
 * @example
 * this.updateStatus({ configured: true });
 */
function updateStatus(newStatus) {
  this.status = { ...this.status, ...newStatus };

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
    payload: this.status,
  });
}

module.exports = {
  updateStatus,
};
