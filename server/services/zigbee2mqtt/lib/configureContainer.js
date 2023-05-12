const fs = require('fs/promises');
const { constants } = require('fs');
const path = require('path');
const yaml = require('yaml');

const logger = require('../../../utils/logger');
const { DEFAULT } = require('./constants');
const { DEFAULT_KEY, CONFIG_KEYS, ADAPTERS_BY_CONFIG_KEY } = require('../adapters');

/**
 * @description Configure Z2M container.
 * @param {string} basePathOnContainer - Zigbee2mqtt base path.
 * @param {object} config - Gladys Z2M stored configuration.
 * @returns {Promise} Indicates if the configuration file has been creted or modified.
 * @example
 * await this.configureContainer({});
 */
async function configureContainer(basePathOnContainer, config) {
  logger.info('Z2M Docker container is being configured...');

  // Create configuration path (if not exists)
  const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
  await fs.mkdir(path.dirname(configFilepath), { recursive: true });

  // Check if config file not already exists
  let configCreated = false;
  try {
    // eslint-disable-next-line no-bitwise
    await fs.access(configFilepath, constants.R_OK | constants.W_OK);
    logger.info('Z2M configuration file already exists.');
  } catch (e) {
    logger.info('Writting default Z2M configuration...');
    await fs.writeFile(configFilepath, yaml.stringify(DEFAULT.CONFIGURATION_CONTENT));
    configCreated = true;
  }

  // Check for changes
  const fileContent = await fs.readFile(configFilepath);
  const loadedConfig = yaml.parse(fileContent.toString());
  const { mqtt = {} } = loadedConfig;

  let configChanged = false;
  if (mqtt.user !== config.mqttUsername || mqtt.password !== config.mqttPassword) {
    mqtt.user = config.mqttUsername;
    mqtt.password = config.mqttPassword;
    loadedConfig.mqtt = mqtt;
    configChanged = true;
  }

  // Setup adapter
  const adapterKey = Object.values(CONFIG_KEYS).find((configKey) =>
    ADAPTERS_BY_CONFIG_KEY[configKey].includes(config.z2mDongleName),
  );
  const adapterSetup = adapterKey && adapterKey !== DEFAULT_KEY;
  const { serial = {} } = loadedConfig;

  if (!adapterSetup && serial.adapter) {
    delete loadedConfig.serial.adapter;
    configChanged = true;
  } else if (adapterSetup && serial.adapter !== adapterKey) {
    loadedConfig.serial.adapter = adapterKey;
    configChanged = true;
  }

  if (configChanged) {
    logger.info('Writting MQTT and USB adapter information to Z2M configuration...');
    await fs.writeFile(configFilepath, yaml.stringify(loadedConfig));
  }

  return configCreated || configChanged;
}

module.exports = {
  configureContainer,
};
