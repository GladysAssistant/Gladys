const { BadParameters } = require('../../../utils/coreErrors');

/**
 * @description Send the new device value over MQTT.
 * @param {Object} device - Updated Gladys device.
 * @param {Object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
function setValue(device, deviceFeature, value) {
  // Remove first 'zigbee2mqtt:' substring
  const externalId = device.external_id;

  if (!externalId.startsWith('zigbee2mqtt:')) {
    throw new BadParameters(
      `Zigbee2mqtt device external_id is invalid : "${externalId}" should starts with "zigbee2mqtt:"`,
    );
  }
  const topic = externalId.substring(12);
  if (topic.length === 0) {
    throw new BadParameters(`Zigbee2mqtt device external_id is invalid : "${externalId}" have no MQTT topic`);
  }

  // Send message to Zigbee2mqtt topics
  this.mqttService.device.publish(`zigbee2mqtt/${topic}/set`, value ? '{ "state" : "ON"}' : '{ "state" : "OFF"}');
}

module.exports = {
  setValue,
};
