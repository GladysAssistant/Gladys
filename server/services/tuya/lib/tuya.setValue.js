const logger = require('../../../utils/logger');
const { API, INFRARED_MODELS } = require('./utils/tuya.constants');
const { BadParameters } = require('../../../utils/coreErrors');
const { writeValues } = require('./device/tuya.deviceMapping');

/**
 * @description Send the new device value over device protocol.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
async function setValue(device, deviceFeature, value) {
  const externalId = deviceFeature.external_id;
  const [prefix, topic, command] = deviceFeature.external_id.split(':');

  if (prefix !== 'tuya') {
    throw new BadParameters(`Tuya device external_id is invalid: "${externalId}" should starts with "tuya:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Tuya device external_id is invalid: "${externalId}" have no network indicator`);
  }

  //Can't use this for infrared devices
  if (topic.includes('_')) {
    logger.debug(`Change value for devices ${topic}/${command} to value ${value}...`);
    const [deviceId, gatewayId] = topic.split('_');

    const commandObject = {};

    device.features.forEach((feature) => {
      const [prefixFeatureF, topicFeature, commandFeature] = feature.external_id.split(':');
      if (feature.external_id === deviceFeature.external_id) {
        commandObject[commandFeature] = value;
      } else {
        commandObject[commandFeature] = feature.last_value;
      }
    });

    if (device.model === INFRARED_MODELS.INFRARED_AC) {
      const response = await this.connector.request({
        method: 'POST',
        path: `${API.VERSION_2_0}/infrareds/${gatewayId}/air-conditioners/${deviceId}/scenes/command`,
        body: commandObject,
      });
      logger.debug(`[Tuya][setValue] ${JSON.stringify(response)}`);
    } else if (device.model === INFRARED_MODELS.INFRARED_TV) {
      const [name, categoryId, keyId] = deviceFeature.name.split(':');
      const payload = {
        category_id: categoryId,
        key: command,
        key_id: keyId,
      };
      const response = await this.connector.request({
        method: 'POST',
        path: `/v2.0/infrareds/${gatewayId}/remotes/${deviceId}/raw/command`,
        body: payload,
      });
      logger.debug(`[Tuya][setValue] ${JSON.stringify(response)}`);
    }
  } else {
    const transformedValue = writeValues[deviceFeature.category][deviceFeature.type](value);
    logger.debug(`Change value for devices ${topic}/${command} to value ${transformedValue}...`);

    const response = await this.connector.request({
      method: 'POST',
      path: `${API.VERSION_1_0}/devices/${topic}/commands`,
      body: {
        commands: [
          {
            code: command,
            value: transformedValue,
          },
        ],
      },
    });
    logger.debug(`[Tuya][setValue] ${JSON.stringify(response)}`);
  }
}

module.exports = {
  setValue,
};
