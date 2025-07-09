const logger = require('../../../../utils/logger');
const { getTopicFromExternalId } = require('../utils/nuki.externalId');

/**
 * @description Set value value.
 * @param {object} device - Device.
 * @param {string} command - Command to send.
 * @param {string} value - Value to send.
 * @example
 * nukiMQTTHandler.setValue(device, command, value);
 */
async function setValue(device, command, value) {
  logger.debug(`set value for ${device.external_id}`);
  // Send message to Nuki topics
  const topic = getTopicFromExternalId(device);
  await this.mqttService.device.publish(`${topic}${command}`, `true`);
}

module.exports = {
  setValue,
};
