const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { HOME_ASSISTANT } = require('./homeAssistant/constants');

/**
 * @description Control a remote MQTT device.
 * @param {object} device - The device to control.
 * @param {object} deviceFeature - The binary deviceFeature to control.
 * @param {string|number} value - The new value.
 * @returns {Promise} Resolve when the mqtt message is published.
 * @example
 * setValue({ external_id: 'mqtt:light'}, { external_id: 'mqtt:light:binary'}, 1);
 */
async function setValue(device, deviceFeature, value) {
  logger.debug(
    `Changing state of device = ${device.external_id}, feature = ${deviceFeature.external_id}, value = ${value}`,
  );

  if (!this.mqttClient) {
    throw new ServiceNotConfiguredError();
  }

  // Devices created through the Home Assistant discovery protocol
  // are controlled with their own command topics
  if (device.external_id.startsWith(`${HOME_ASSISTANT.EXTERNAL_ID_PREFIX}:`)) {
    return this.setValueHomeAssistant(device, deviceFeature, value);
  }

  const topic = `gladys/device/${device.external_id}/feature/${deviceFeature.external_id}/state`;
  return new Promise((resolve, reject) => {
    this.mqttClient.publish(topic, value.toString(), undefined, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  setValue,
};
