const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Allow or forbid new devices to join the Zigbee network (for 254 s when allowed).
 * @param {boolean} [value] - True to allow, false to forbid; toggles when absent.
 * @example
 * setPermitJoin(true);
 */
async function setPermitJoin(value) {
  // Not installed, or disabled: no broker to send it to
  if (!this.mqttClient) {
    throw new ServiceNotConfiguredError('Zigbee2mqtt is not connected to its MQTT broker');
  }
  this.z2mPermitJoin = typeof value === 'boolean' ? value : !this.z2mPermitJoin;
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
