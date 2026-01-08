const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Prepares service and starts connection with broker.
 * @example
 * init();
 */
async function setPermitJoin() {
  this.z2mPermitJoin = !this.z2mPermitJoin;
  // Send message to Zigbee2mqtt topics
  this.mqttClient.publish(
    `zigbee2mqtt/bridge/request/permit_join`,
    JSON.stringify({ time: this.z2mPermitJoin ? 254 : 0 }),
  );
  logger.debug('Set Permit_join to', this.z2mPermitJoin);

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
    payload: this.z2mPermitJoin,
  });
}

module.exports = {
  setPermitJoin,
};
