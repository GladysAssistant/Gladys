const fs = require('fs/promises');
const { constants } = require('fs');
const path = require('path');
const yaml = require('yaml');
const portfinder = require('portfinder');

const logger = require('../../../utils/logger');
const { DEFAULT } = require('./constants');
const { DEFAULT_KEY, CONFIG_KEYS, ADAPTERS_BY_CONFIG_KEY } = require('../adapters');

const YAML_CONFIG = { singleQuote: true };

/**
 * @description Configure Z2M container.
 * @param {string} basePathOnContainer - Zigbee2mqtt base path.
 * @param {object} config - Gladys Z2M stored configuration.
 * @param {boolean} setupMode - In setup mode.
 * @returns {Promise} Indicates if the configuration file has been created or modified.
 * @example
 * await this.configureContainer({});
 */
async function configureContainer(basePathOnContainer, config, setupMode = false) {
  logger.info('Z2M Docker container is being configured...');

  // Create configuration path (if not exists)
  const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
  await fs.mkdir(path.dirname(configFilepath), {
    recursive: true,
  });

  // Check if config file not already exists
  let configCreated = false;
  try {
    // eslint-disable-next-line no-bitwise
    await fs.access(configFilepath, constants.R_OK | constants.W_OK);
    logger.info('Z2M configuration file already exists.');
  } catch (e) {
    logger.info('Writing default Z2M configuration...');
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

  // Setup TCP port
  const { frontend = {} } = loadedConfig;
  const { port } = frontend;

  const existingPortConfig = !Number.isNaN(Number(port));
  const generateRandomPort =
    (setupMode || !existingPortConfig) && (config.z2mTcpPort === null || Number.isNaN(Number(config.z2mTcpPort)));

  // Only if incoming port
  if (generateRandomPort) {
    // Set random port
    logger.debug('Generated random z2m port...');
    const { min, max, defaultPort } = DEFAULT.CONFIGURATION_PORTS;
    try {
      config.z2mTcpPort = await portfinder.getPortPromise({
        port: min,
        stopPort: max,
      });
    } catch (e) {
      logger.error('Unable to get a random port for zigbee2mqtt configuration', e);
      config.z2mTcpPort = defaultPort;
    }
  } else if (existingPortConfig) {
    // TCP Port is not found in config, but z2m is alrady configured
    // For upgrade Gladys mode
    logger.debug('Keep default z2m port...');
    config.z2mTcpPort = port;
  }

  // Check for requested changes
  if (config.z2mTcpPort !== port) {
    loadedConfig.frontend = {
      port: Number(config.z2mTcpPort),
    };
    configChanged = true;
  }

  if (configChanged) {
    logger.info('Writing custom zigbee2mqtt configuration file...');
    await fs.writeFile(configFilepath, yaml.stringify(loadedConfig, YAML_CONFIG));
  }

  return configCreated || configChanged;
}

module.exports = {
  configureContainer,
};
