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
  // Remove first 'sonoff:' substring
  const externalId = device.external_id;

  if (!externalId.startsWith('sonoff:')) {
    throw new BadParameters(`Sonoff device external_id is invalid : "${externalId}" should starts with "sonoff:"`);
  }
  const topic = externalId.substring(7);
  if (topic.length === 0) {
    throw new BadParameters(`Sonoff device external_id is invalid : "${externalId}" have no MQTT topic`);
  }

  let powerId = '';
  const splittedPowerId = deviceFeature.external_id.split(':');
  if (splittedPowerId.length > 4) {
    [, , , , powerId] = splittedPowerId;
  }

  // Send message to Sonoff topics
  this.mqttService.device.publish(`cmnd/${topic}/power${powerId}`, value ? 'ON' : 'OFF');
}

module.exports = {
  setValue,
};
