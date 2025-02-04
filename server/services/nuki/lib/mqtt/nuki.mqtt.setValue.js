const logger = require('../../../../utils/logger');

/**
 * @description Set value value.
 * @param {object} device - Device.
 * @param {string} topic - Device network address.
 * @param {string} command - Command to send.
 * @param {string} value - Value to send.
 * @example
 * nukiMQTTHandler.setValue(device, topic, command, value);
 */
async function setValue(device, topic, command, value) {
  logger.debug(`set value for ${device.external_id}`);
  // Send message to Nuki topics
  logger.trace(`nuki/${topic}/${command}`);
  logger.trace(`nuki/${topic}/${value}`);

  await this.mqttService.device.publish(`nuki/${topic}/${command}`, `true`);
}

module.exports = {
  setValue,
};
