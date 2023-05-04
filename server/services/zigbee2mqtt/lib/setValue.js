const { BadParameters } = require('../../../utils/coreErrors');
const exposesMap = require('../exposes');

/**
 * @description Set the new device value from Gladys to MQTT.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param {string} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
function setValue(device, deviceFeature, value) {
  const externalId = deviceFeature.external_id;

  if (!externalId.startsWith('zigbee2mqtt:')) {
    throw new BadParameters(
      `Zigbee2mqtt device external_id is invalid: "${externalId}" should starts with "zigbee2mqtt:"`,
    );
  }

  const [, topic = '', , , property = '', featureIndex] = externalId.split(':');
  if (topic.length === 0) {
    throw new BadParameters(`Zigbee2mqtt device external_id is invalid: "${externalId}" have no MQTT topic`);
  } else if (property.length === 0) {
    throw new BadParameters(`Zigbee2mqtt device external_id is invalid: "${externalId}" have no Zigbee property`);
  }

  let zigbeeValue;

  // Looks mapping from exposes
  const expose = this.findMatchingExpose(topic, property);
  if (expose) {
    zigbeeValue = exposesMap[expose.type].writeValue(expose, value, featureIndex);
    // Send message to Zigbee2mqtt topics
    const mqttPaylad = JSON.stringify({ [property]: zigbeeValue });
    this.mqttClient.publish(`zigbee2mqtt/${topic}/set`, mqttPaylad);
  } else {
    throw new BadParameters(`Zigbee2mqtt expose not found: "${externalId}" with property "${property}"`);
  }
}

module.exports = {
  setValue,
};
