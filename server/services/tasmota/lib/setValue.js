const { BadParameters } = require('../../../utils/coreErrors');
const { FEATURE_TEMPLATES } = require('./features');
const { setHttpValue } = require('./http/tasmota.http.setHttpValue');

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
  const [prefix, topic, command] = deviceFeature.external_id.split(':');

  if (prefix !== 'tasmota') {
    throw new BadParameters(`Tasmota device external_id is invalid: "${externalId}" should starts with "tasmota:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Tasmota device external_id is invalid: "${externalId}" have no MQTT topic`);
  }

  const gladysKey = `Gladys.${command}`;
  const featureTemplate = FEATURE_TEMPLATES.find((template) => {
    return template.keyMatcher.test(gladysKey);
  });

  if (featureTemplate) {
    const tasmotaValue = typeof featureTemplate.writeValue === 'function' ? featureTemplate.writeValue(value) : value;

    const httpInterface = device.params.findIndex((p) => p.name === 'interface' && p.value === 'http');
    if (httpInterface >= 0) {
      setHttpValue(topic, command, tasmotaValue, this);
    } else {
      // Send message to Tasmota topics
      this.mqttService.device.publish(`cmnd/${topic}/${command}`, `${tasmotaValue}`);
    }
  } else {
    throw new BadParameters(`Tasmota device external_id is not managed: "${externalId}" have no MQTT topic`);
  }
}

module.exports = {
  setValue,
};
