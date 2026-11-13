const { BadParameters, ServiceNotReadyError } = require('../../../utils/coreErrors');
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

  if (!this.discoveredDevices[topic]) {
    // The device list ("bridge/devices", kept in `lastBridgeDevices`) is what tells how to control
    // each device: until it is received, no device can be controlled. That is the case while Gladys
    // starts (its integrations start one after the other) or while it is not connected to Zigbee2mqtt.
    if (!this.lastBridgeDevices) {
      throw new ServiceNotReadyError(
        `Zigbee2mqtt is not ready yet, so "${topic}" cannot be controlled: Gladys has not received the list of devices from Zigbee2mqtt. ` +
          `Gladys may still be starting its integrations, or it is not connected to Zigbee2mqtt (see the status in the Zigbee2mqtt integration).`,
      );
    }
    throw new BadParameters(
      `Zigbee2mqtt device "${topic}" is not in the list of devices sent by Zigbee2mqtt: it may have been removed from Zigbee2mqtt, or renamed there.`,
    );
  }

  // Looks mapping from exposes
  const expose = this.findMatchingExpose(topic, property);
  if (!expose) {
    throw new BadParameters(`Zigbee2mqtt expose not found: "${externalId}" with property "${property}"`);
  }
  const zigbeeValue = exposesMap[expose.type].writeValue(expose, value, featureIndex);
  // Send message to Zigbee2mqtt topics
  const mqttPayload = JSON.stringify({ [property]: zigbeeValue });
  this.mqttClient.publish(`zigbee2mqtt/${topic}/set`, mqttPayload);
}

module.exports = {
  setValue,
};
