const { BadParameters } = require('../../../utils/coreErrors');
const { FEATURE_TEMPLATES } = require('./features');

/**
 * @description Send the new device value over device protocol.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
function setValue(device, deviceFeature, value) {
  const externalId = deviceFeature.external_id;
  const [prefix, topic, command] = deviceFeature.external_id.split(':');

  if (prefix !== 'tasmota') {
    throw new BadParameters(`Tasmota device external_id is invalid: "${externalId}" should starts with "tasmota:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Tasmota device external_id is invalid: "${externalId}" have no network indicator`);
  }

  const gladysKey = `Gladys.${command}`;
  const featureTemplate = FEATURE_TEMPLATES.find((template) => {
    return template.keyMatcher.test(gladysKey);
  });

  if (featureTemplate) {
    const tasmotaValue = typeof featureTemplate.writeValue === 'function' ? featureTemplate.writeValue(value) : value;

    const deviceProtocol = this.getProtocolFromDevice(device);
    this.getHandler(deviceProtocol).setValue(device, topic, command, tasmotaValue);
  } else {
    throw new BadParameters(`Tasmota device external_id is not managed: "${externalId}"`);
  }
}

module.exports = {
  setValue,
};
