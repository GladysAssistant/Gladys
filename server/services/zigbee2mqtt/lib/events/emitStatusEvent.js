const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description Emit event with Zigbee2Mqtt status.
 * @example
 * this.emitStatusEvent();
 */
function emitStatusEvent() {
  const payload = this.status();

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    payload,
  });
}

module.exports = {
  emitStatusEvent,
};
