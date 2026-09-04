const fs = require('fs/promises');
const { constants } = require('fs');
const path = require('path');
const yaml = require('yaml');
const portfinder = require('portfinder');

const logger = require('../../../utils/logger');
const { DEFAULT, ADAPTER_MODE } = require('./constants');
const {
  DEFAULT_KEY,
  CONFIG_KEYS,
  ADAPTERS_BY_CONFIG_KEY,
  SERIAL_OPTIONS_BY_ADAPTER,
  MANAGED_SERIAL_OPTION_KEYS,
} = require('../adapters');

const YAML_CONFIG = { singleQuote: true };
// A network coordinator serial port is a URL ('tcp://', 'socket://', 'mdns://'...),
// while a USB one is a device path
const NETWORK_SERIAL_PORT_REGEX = /^[a-z][a-z0-9+.-]*:\/\//i;

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
  let adapterChanged = false;
  if (mqtt.user !== config.mqttUsername || mqtt.password !== config.mqttPassword) {
    mqtt.user = config.mqttUsername;
    mqtt.password = config.mqttPassword;
    loadedConfig.mqtt = mqtt;
    configChanged = true;
  }

  // Setup adapter
  const { serial = {} } = loadedConfig;
  let adapterKey;
  let serialPort = serial.port;
  // Serial settings specific to the selected coordinator model, such as the ConBee III baudrate
  let serialOptions = {};
  if (config.z2mAdapterMode === ADAPTER_MODE.NETWORK) {
    // Network coordinator: Z2M reaches it over TCP, the adapter type is given by the user
    adapterKey = config.z2mNetworkAdapterType || DEFAULT_KEY;
    serialPort = config.z2mNetworkAdapterUrl;
  } else {
    adapterKey = Object.values(CONFIG_KEYS).find((configKey) =>
      ADAPTERS_BY_CONFIG_KEY[configKey].includes(config.z2mDongleName),
    );
    // Set default adapter if not found
    adapterKey = adapterKey || DEFAULT_KEY;
    serialOptions = SERIAL_OPTIONS_BY_ADAPTER[config.z2mDongleName] || {};
    if (NETWORK_SERIAL_PORT_REGEX.test(`${serialPort}`)) {
      // Coming back from a network coordinator: restore the USB device path bound in the container
      serialPort = DEFAULT.CONFIGURATION_CONTENT.serial.port;
    }
  }

  const newSerial = { ...serial, port: serialPort, adapter: adapterKey, ...serialOptions };
  // Drop the model-specific settings of a previously selected coordinator: a baudrate left behind
  // by another dongle would prevent the new one from talking to its firmware
  MANAGED_SERIAL_OPTION_KEYS.filter((key) => !(key in serialOptions)).forEach((key) => delete newSerial[key]);

  const serialChanged =
    Object.keys(newSerial).length !== Object.keys(serial).length ||
    Object.entries(newSerial).some(([key, value]) => serial[key] !== value);
  if (serialChanged) {
    loadedConfig.serial = newSerial;
    configChanged = true;
    adapterChanged = true;
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

  return { configChanged: configCreated || configChanged, adapterChanged };
}

module.exports = {
  configureContainer,
};
