const { BadParameters } = require('../../../utils/coreErrors');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');
const { setSwitchValue, setLightValue } = require('./cmdValue');

/**
 * @description Send the new device value over MQTT.
 * @param {Object} device - Updated Gladys device.
 * @param {Object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
function setValue(device, deviceFeature, value) {
  const externalId = deviceFeature.external_id;
  const splittedPowerId = deviceFeature.external_id.split(':');
  const [prefix, topic, , , relayId] = splittedPowerId;

  if (prefix !== 'tasmota') {
    throw new BadParameters(`Tasmota device external_id is invalid: "${externalId}" should starts with "tasmota:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Tasmota device external_id is invalid: "${externalId}" have no MQTT topic`);
  }

  let cmnd;
  const { category } = deviceFeature;

  switch (category) {
    case DEVICE_FEATURE_CATEGORIES.LIGHT: {
      cmnd = setLightValue(deviceFeature, value);
      break;
    }
    case DEVICE_FEATURE_CATEGORIES.SWITCH: {
      cmnd = setSwitchValue(deviceFeature, value);
      break;
    }
    default:
      throw new BadParameters(`Tasmota device category not managed to set value on "${externalId}"`);
  }

  // Send message to Tasmota topics
  this.mqttService.device.publish(`cmnd/${topic}/${cmnd.topic}${relayId || ''}`, cmnd.value);
}

module.exports = {
  setValue,
};
