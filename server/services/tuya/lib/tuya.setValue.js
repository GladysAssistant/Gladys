const logger = require('../../../utils/logger');
const { API } = require('./utils/tuya.constants');
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

module.exports = {
  setValue,
};
