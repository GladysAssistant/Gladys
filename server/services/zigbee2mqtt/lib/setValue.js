const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');

/**
 * @description Send the new device value over MQTT.
 * @param {Object} device - Updated Gladys device.
 * @param {Object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
function setValue(device, deviceFeature, value) {
  const externalId = device.external_id;

  if (!externalId.startsWith('zigbee2mqtt:')) {
    throw new BadParameters(
      `Zigbee2mqtt device external_id is invalid : "${externalId}" should starts with "zigbee2mqtt:"`,
    );
  }
  // Remove first 'zigbee2mqtt:' substring
  const topic = externalId.substring(12);
  if (topic.length === 0) {
    throw new BadParameters(`Zigbee2mqtt device external_id is invalid : "${externalId}" have no MQTT topic`);
  }

  // Convert Gladys value to Zigbee value
  let zigbeeValue;
  switch (deviceFeature.type) {
    case 'binary':
      zigbeeValue = value ? `{"state": "ON"}` : `{"state": "OFF"}`;
      break;
    case 'brightness':
      zigbeeValue = `{"brightness": ${value}}`;
      break;
    case 'temperature':
      zigbeeValue = `{"color_temp": ${value}}`;
      break;
    default:
      zigbeeValue = null;
  }
  if (zigbeeValue) {
    // Send message to Zigbee2mqtt topics
    this.mqttClient.publish(`zigbee2mqtt/${topic}/set`, zigbeeValue);
  } else {
    logger.warn(
      `Zigbee value ${value} for device ${device.external_id}, feature ${deviceFeature.type} is not managed by`,
    );
  }
}

module.exports = {
  setValue,
};
