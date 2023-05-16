const { TuyaContext } = require('@tuya/tuya-connector-nodejs');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError, BadParameters } = require('../../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');

const { STATUS, API } = require('./utils/tuya.constants');

/**
 * @description Send the new device value over device protocol.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param configuration
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

  console.log('setValue', device, deviceFeature, value);
  console.log('setValue', prefix, topic, command);

  await this.connector.request({
    method: 'POST',
    path: `/v1.0/iot-03/devices/${topic}/commands`,
    body: {
      commands: [
        {
          code: command,
          value,
        },
      ],
    },
  });
}

module.exports = {
  setValue,
};
