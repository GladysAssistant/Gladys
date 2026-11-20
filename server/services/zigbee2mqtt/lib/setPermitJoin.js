const logger = require('../../../utils/logger');
const { BadParameters, ServiceNotConfiguredError } = require('../../../utils/coreErrors');

/**
 * @description Ask Zigbee2mqtt to allow or forbid new devices to join the Zigbee network (for 254 s when allowed).
 * Zigbee2mqtt tells the outcome (bridge/response/permit_join, bridge/info, see handleMqttMessage), which Gladys
 * broadcasts: nothing is told here, the request may reach no one.
 * @param {boolean} [value] - True to allow, false to forbid; toggles when absent.
 * @example
 * setPermitJoin(true);
 */
async function setPermitJoin(value) {
  // Not installed, or disabled: no broker to send it to
  if (!this.mqttClient) {
    throw new ServiceNotConfiguredError('Zigbee2mqtt is not connected to its MQTT broker');
  }
  // The broker answers, but not Zigbee2mqtt (see the health check): nothing would receive the request
  if (!this.zigbee2mqttConnected) {
    throw new BadParameters('ZIGBEE2MQTT_NOT_ANSWERING');
  }
  const allow = typeof value === 'boolean' ? value : !this.z2mPermitJoin;
  // `time` for Zigbee2mqtt 2, `value` for Zigbee2mqtt 1, which refuses a request without it
  this.mqttClient.publish(
    `zigbee2mqtt/bridge/request/permit_join`,
    JSON.stringify({ value: allow, time: allow ? 254 : 0 }),
  );
  logger.debug('Zigbee2mqtt: asked to set permit_join to', allow);
}

module.exports = {
  setPermitJoin,
};
