const { intToRgb } = require('../../../utils/colors');
const { BadParameters } = require('../../../utils/coreErrors');
const { convertParametersValue } = require('../utils/parameters/convertParameterValue');

/**
 * @description Set the new device value from Gladys to MQTT.
 * @param {Object} device - Updated Gladys device.
 * @param {Object} deviceFeature - Updated Gladys device feature.
 * @param {string} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
function setValue(device, deviceFeature, value) {
  const externalId = deviceFeature.external_id;

  if (!externalId.startsWith('zigbee2mqtt:')) {
    throw new BadParameters(
      `Zigbee2mqtt device external_id is invalid : "${externalId}" should starts with "zigbee2mqtt:"`,
    );
  }

  const [, topic = '', , , property = ''] = externalId.split(':');
  if (topic.length === 0) {
    throw new BadParameters(`Zigbee2mqtt device external_id is invalid : "${externalId}" have no MQTT topic`);
  } else if (property.length === 0) {
    throw new BadParameters(`Zigbee2mqtt device external_id is invalid : "${externalId}" have no Zigbee property`);
  }

  // Looks mapping from parameters
  let zigbeeValue = convertParametersValue(device, property, value);

  // Convert Gladys value to Zigbee value
  if (zigbeeValue === undefined) {
    switch (deviceFeature.type) {
      case 'binary':
        zigbeeValue = value ? `ON` : `OFF`;
        break;
      case 'color': {
        const [r, g, b] = intToRgb(parseInt(value, 10));
        zigbeeValue = { rgb: `${r},${g},${b}` };
        break;
      }
      default:
        zigbeeValue = value;
    }
  }

  // Send message to Zigbee2mqtt topics
  const mqttPaylad = JSON.stringify({ [property]: zigbeeValue });
  this.mqttClient.publish(`zigbee2mqtt/${topic}/set`, mqttPaylad);
}

module.exports = {
  setValue,
};
