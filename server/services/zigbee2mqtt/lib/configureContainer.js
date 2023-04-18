const fs = require('fs/promises');
const { constants } = require('fs');
const path = require('path');
const yaml = require('yaml');

const logger = require('../../../utils/logger');
const { DEFAULT } = require('./constants');

/**
 * @description Configure Z2M container.
 * @param {string} basePathOnContainer - Zigbee2mqtt base path.
 * @param {object} config - Gladys Z2M stored configuration.
 * @example
 * await this.configureContainer({});
 */
async function configureContainer(basePathOnContainer, config) {
  logger.info('Z2M Docker container is being configured...');

  // Create configuration path (if not exists)
  const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
  await fs.mkdir(path.dirname(configFilepath), { recursive: true });

  // Check if config file not already exists
  try {
    // eslint-disable-next-line no-bitwise
    await fs.access(configFilepath, constants.R_OK | constants.W_OK);
    logger.info('Z2M configuration file already exists.');
  } catch (e) {
    logger.info('Writting default eclipse-mosquitto configuration...');
    await fs.writeFile(configFilepath, yaml.stringify(DEFAULT.CONFIGURATION_CONTENT));
  }

  // Check for changes
  const fileContent = await fs.readFile(configFilepath);
  const loadedConfig = yaml.parse(fileContent.toString());
  const { mqtt = {} } = loadedConfig;

  if (mqtt.user !== config.mqttUsername || mqtt.password !== config.mqttPassword) {
    mqtt.user = config.mqttUsername;
    mqtt.password = config.mqttPassword;
    loadedConfig.mqtt = mqtt;

    await fs.writeFile(configFilepath, yaml.stringify(loadedConfig));
  }
}

module.exports = {
  configureContainer,
};
