const fs = require('fs/promises');
const { constants } = require('fs');
const path = require('path');
const yaml = require('yaml');
const portfinder = require('portfinder');
const cloneDeep = require('lodash.clonedeep');

const logger = require('../../../utils/logger');
const { DEFAULT, ADAPTER_MODE, CONFIGURATION } = require('./constants');
const {
  DEFAULT_KEY,
  CONFIG_KEYS,
  ADAPTERS_BY_CONFIG_KEY,
  SERIAL_OPTIONS_BY_ADAPTER,
  MANAGED_SERIAL_OPTION_KEYS,
} = require('../adapters');

const YAML_CONFIG = { singleQuote: true };

// Drawn by Zigbee2mqtt when it starts its network, and written in place of these values
const NEW_NETWORK_SETTINGS = {
  network_key: 'GENERATE',
  pan_id: 'GENERATE',
  ext_pan_id: 'GENERATE',
};

/**
 * @description Build the default Z2M configuration, written when there is no file to keep. For a network not formed
 * yet, Zigbee2mqtt draws its key and identifiers at its first start, as in the files it creates itself. A network
 * already formed (its data folder lost with no backup to restore) keeps the settings it was formed with: new ones
 * would form another network, and every device would have to be paired again. It is told by the Z2M backup saved
 * by Gladys, or by the Zigbee2mqtt devices of Gladys.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - Zigbee2mqtt service id.
 * @returns {Promise<object>} The default Z2M configuration.
 * @example
 * const defaultConfig = await getDefaultConfiguration(gladys, serviceId);
 */
async function getDefaultConfiguration(gladys, serviceId) {
  const defaultConfig = cloneDeep(DEFAULT.CONFIGURATION_CONTENT);
  const networkFormed =
    (await gladys.variable.getValue(CONFIGURATION.Z2M_BACKUP, serviceId)) !== null ||
    (await gladys.device.get({ service: 'zigbee2mqtt', take: 1 })).length > 0;
  if (!networkFormed) {
    logger.info('Zigbee2mqtt will draw the settings of its new network at its first start');
    defaultConfig.advanced = { ...NEW_NETWORK_SETTINGS };
  }
  return defaultConfig;
}

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
    await fs.writeFile(configFilepath, yaml.stringify(await getDefaultConfiguration(this.gladys, this.serviceId)));
    configCreated = true;
  }

  // Check for changes
  const fileContent = await fs.readFile(configFilepath);
  let loadedConfig = yaml.parse(fileContent.toString());
  // Started without configuration file (its data folder removed while its container ran), Zigbee2mqtt writes its
  // own, flagged "onboarding", and waits at every start for the user to fill its onboarding page, never shown by
  // Gladys. Never completed, this file holds nothing to keep: it is replaced as if there was none. Its network key
  // still "GENERATE" (replaced by Zigbee2mqtt once its network started) tells it from a used file, left untouched.
  // Its network settings are not kept either: like a missing file, it gets those of the default configuration.
  if (loadedConfig.onboarding && (loadedConfig.advanced || {}).network_key === 'GENERATE') {
    logger.info('Z2M configuration file waits for an onboarding, writing default Z2M configuration...');
    loadedConfig = await getDefaultConfiguration(this.gladys, this.serviceId);
    await fs.writeFile(configFilepath, yaml.stringify(loadedConfig));
    configCreated = true;
  }
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
    // The container only exposes the USB dongle at this fixed path, whatever its path on the host is
    // (/dev/ttyUSB0, /dev/ttyACM1...). Any other value (a network URL left by a previous network
    // coordinator, or the host path of the dongle) would make Z2M fail to open the serial port.
    serialPort = DEFAULT.CONFIGURATION_CONTENT.serial.port;
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
