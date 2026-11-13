const fs = require('fs/promises');
const path = require('path');
const yaml = require('yaml');
const portfinder = require('portfinder');
const cloneDeep = require('lodash.clonedeep');

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

/**
 * @description Read the Z2M configuration file. A file that is not a YAML mapping (a write cut short, a file zeroed
 * by a power cut) is set aside, as configuration.yaml.invalid, for the user to get back what it held. A file Gladys
 * cannot read is not one to replace: its error is thrown.
 * @param {string} configFilepath - Path of the configuration file.
 * @returns {Promise<object>} The configuration, null when there is none to keep: no file, an empty one, or one set
 * aside.
 * @example
 * const loadedConfig = await readConfigFile('/var/lib/gladysassistant/zigbee2mqtt/z2m/configuration.yaml');
 */
async function readConfigFile(configFilepath) {
  let fileContent;
  try {
    fileContent = await fs.readFile(configFilepath);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return null;
    }
    throw e;
  }
  let loadedConfig;
  try {
    loadedConfig = yaml.parse(fileContent.toString());
  } catch (e) {
    loadedConfig = undefined;
  }
  if (loadedConfig === null) {
    return null;
  }
  if (typeof loadedConfig !== 'object' || Array.isArray(loadedConfig)) {
    logger.warn('Z2M configuration file is not a YAML mapping, set aside as configuration.yaml.invalid');
    await fs.rename(configFilepath, `${configFilepath}.invalid`);
    return null;
  }
  return loadedConfig;
}

/**
 * @description Read the settings of the network formed by Zigbee2mqtt from the coordinator backup it writes in its
 * data folder (open coordinator backup format, read as zigbee-herdsman does).
 * @param {string} backupFilepath - Path of coordinator_backup.json.
 * @returns {Promise<object>} The network settings, as in the "advanced" section of the configuration, null without
 * backup or with one that is not in this format. A backup Gladys cannot read throws its error.
 * @example
 * const networkSettings = await readCoordinatorBackup('/app/data/coordinator_backup.json');
 * // { network_key: [24, 27, ...], pan_id: 52140, ext_pan_id: [121, 167, ...], channel: 11 }
 */
async function readCoordinatorBackup(backupFilepath) {
  let fileContent;
  try {
    fileContent = await fs.readFile(backupFilepath);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return null;
    }
    throw e;
  }
  try {
    const backup = JSON.parse(fileContent.toString());
    const toBytes = (hex) => [...Buffer.from(hex, 'hex')];
    return {
      network_key: toBytes(backup.network_key.key),
      pan_id: Number.parseInt(backup.pan_id, 16),
      ext_pan_id: toBytes(backup.extended_pan_id),
      channel: backup.channel,
    };
  } catch (e) {
    logger.warn('Zigbee2mqtt: unreadable coordinator backup, its network settings are not kept', e);
    return null;
  }
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
  const configFolder = path.dirname(configFilepath);
  await fs.mkdir(configFolder, {
    recursive: true,
  });

  let loadedConfig = await readConfigFile(configFilepath);
  // Started without configuration file (its data folder removed while its container ran), Zigbee2mqtt writes its
  // own, flagged "onboarding", and waits at every start for the user to fill its onboarding page, never shown by
  // Gladys. Never completed, this file holds nothing to keep: it is handled as if there was none, like an empty file
  // (a write cut short). Its network key still "GENERATE" (replaced by Zigbee2mqtt once its network started) tells
  // it from a used file, left untouched.
  const waitsForOnboarding =
    loadedConfig !== null && loadedConfig.onboarding && (loadedConfig.advanced || {}).network_key === 'GENERATE';

  let configCreated = false;
  if (loadedConfig !== null && !waitsForOnboarding) {
    logger.info('Z2M configuration file already exists.');
  } else {
    // A network already formed gets back its settings, and its devices, from the Z2M backup saved by Gladys, whether
    // the container was created again or not. A file left in place would stop the restore.
    logger.info('No Z2M configuration file to keep, restoring its backup...');
    await fs.rm(configFilepath, { force: true });
    try {
      await this.restoreZ2mBackup(configFolder);
      loadedConfig = await readConfigFile(configFilepath);
      if (!loadedConfig) {
        logger.info('Writing default Z2M configuration...');
        loadedConfig = cloneDeep(DEFAULT.CONFIGURATION_CONTENT);
      }
      // The coordinator backup left by Zigbee2mqtt in its folder holds the settings of the network the coordinator
      // carries, newer than those of a restored file: they win, as other settings would make Zigbee2mqtt leave this
      // network (ember) or stop on "configuration-adapter mismatch" (z-stack). Without it nor a Z2M backup, the
      // default configuration lets Zigbee2mqtt form a new network.
      const networkSettings = await readCoordinatorBackup(path.join(configFolder, 'coordinator_backup.json'));
      if (networkSettings) {
        loadedConfig.advanced = { ...loadedConfig.advanced, ...networkSettings };
      }
      await fs.writeFile(configFilepath, yaml.stringify(loadedConfig, YAML_CONFIG));
    } catch (e) {
      // A file restored but not given the coordinator settings, or written in part, would be kept as is by the next
      // call: it is removed, for the next call to do it all again. It can only be the file written above.
      await fs.rm(configFilepath, { force: true });
      throw e;
    }
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
