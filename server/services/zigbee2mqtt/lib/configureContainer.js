const { randomUUID } = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const yaml = require('yaml');
const portfinder = require('portfinder');
const cloneDeep = require('lodash.clonedeep');

const logger = require('../../../utils/logger');
const { findManagedContainer } = require('../../../utils/dockerContainers');
const { CONFIGURATION, DEFAULT, ADAPTER_MODE } = require('./constants');
const {
  DEFAULT_KEY,
  CONFIG_KEYS,
  ADAPTERS_BY_CONFIG_KEY,
  SERIAL_OPTIONS_BY_ADAPTER,
  MANAGED_SERIAL_OPTION_KEYS,
} = require('../adapters');

const containerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');

const YAML_CONFIG = { singleQuote: true };
const CONFIGURATION_FILE = path.basename(DEFAULT.CONFIGURATION_PATH);
const COORDINATOR_BACKUP_FILE = 'coordinator_backup.json';
// A value Zigbee2mqtt reads from another file (`!secret.yaml auth_token`): its own rule (`parseValueRef` of its
// settings), a "!" followed further by a space, so that a password such as `!MyPassw0rd` stays a password
const VALUE_REFERENCE = /!(.*) (.*)/;

/**
 * @description Read the Z2M configuration file. A file Gladys cannot read is not one to replace: its error is thrown.
 * @param {string} configFilepath - Path of the configuration file.
 * @returns {Promise<object>} The configuration (`config`), null when there is none to keep: no file, an empty one, or
 * one zeroed by a power cut. `invalid` tells a file that is not a YAML mapping (an edit by hand, a write cut short),
 * whose content may still be the only copy of the network settings.
 * @example
 * const { config, invalid } = await readConfigFile('/var/lib/gladysassistant/zigbee2mqtt/z2m/configuration.yaml');
 */
async function readConfigFile(configFilepath) {
  let fileContent;
  try {
    fileContent = await fs.readFile(configFilepath);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return { config: null, invalid: false };
    }
    throw e;
  }
  if (fileContent.every((byte) => byte === 0)) {
    return { config: null, invalid: false };
  }
  let config;
  try {
    config = yaml.parse(fileContent.toString());
  } catch (e) {
    config = undefined;
  }
  // A file without settings (comments only) is read as null, nothing to keep
  if (typeof config !== 'object' || Array.isArray(config)) {
    return { config: null, invalid: true };
  }
  return { config, invalid: false };
}

/**
 * @description Write the Z2M configuration file, in a temporary file renamed once written: a write cut short never
 * leaves a part of it.
 * @param {string} configFilepath - Path of the configuration file.
 * @param {object} config - The configuration.
 * @example
 * await writeConfigFile('/var/lib/gladysassistant/zigbee2mqtt/z2m/configuration.yaml', config);
 */
async function writeConfigFile(configFilepath, config) {
  // One per write, not to rename the file of another write
  const temporaryFilepath = `${configFilepath}.${randomUUID()}.tmp`;
  // Given the permissions of the file it replaces, which a write in place keeps: never wider when created, then
  // exactly them (the creation is limited by the umask)
  const currentFile = await fs.stat(configFilepath).catch(() => null);
  const options = currentFile ? { mode: currentFile.mode } : {};
  try {
    await fs.writeFile(temporaryFilepath, yaml.stringify(config, YAML_CONFIG), options);
    if (currentFile) {
      await fs.chmod(temporaryFilepath, currentFile.mode);
    }
    await fs.rename(temporaryFilepath, configFilepath);
  } catch (e) {
    await fs.rm(temporaryFilepath, { force: true });
    throw e;
  }
}

/**
 * @description Tell if a configuration is the one Zigbee2mqtt writes when started without configuration file (its
 * data folder removed while its container ran), flagged "onboarding": it waits at every start for the user to fill its
 * onboarding page, never shown by Gladys. Never completed, it holds nothing to keep. Its network key still "GENERATE"
 * (replaced by Zigbee2mqtt once its network started) tells it from a used file.
 * @param {object} config - The configuration, null without one.
 * @returns {boolean} True for such a configuration.
 * @example
 * const toReplace = waitsForOnboarding(loadedConfig);
 */
function waitsForOnboarding(config) {
  return config !== null && Boolean(config.onboarding) && (config.advanced || {}).network_key === 'GENERATE';
}

/**
 * @description Tell if a file is there but does not hold JSON, as a write cut short (a disk full) leaves it.
 * @param {string} filepath - Path of the file.
 * @returns {Promise<boolean>} True for such a file, false without file.
 * @example
 * const cutShort = await holdsNoJson('/app/data/coordinator_backup.json');
 */
async function holdsNoJson(filepath) {
  try {
    JSON.parse((await fs.readFile(filepath)).toString());
    return false;
  } catch (e) {
    if (e instanceof SyntaxError) {
      return true;
    }
    if (e.code === 'ENOENT') {
      return false;
    }
    throw e;
  }
}

/**
 * @description Read the settings of the network formed by Zigbee2mqtt from the coordinator backup it writes in its
 * data folder (open coordinator backup format, read as zigbee-herdsman does). The backup tells that there is a network
 * on the coordinator: one that does not hold all its settings, valid, throws, as other settings would make
 * Zigbee2mqtt leave this network.
 * @param {string} backupFilepath - Path of coordinator_backup.json.
 * @returns {Promise<object>} The network settings, as in the "advanced" section of the configuration, null without
 * backup.
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
  let backup;
  try {
    backup = JSON.parse(fileContent.toString());
  } catch (e) {
    backup = null;
  }
  const { network_key: networkKey, pan_id: panId, extended_pan_id: extendedPanId, channel } = backup || {};
  const key = networkKey && networkKey.key;
  const panIdValue = Number.parseInt(panId, 16);
  const valid =
    /^[0-9a-f]{32}$/i.test(key) &&
    /^[0-9a-f]{16}$/i.test(extendedPanId) &&
    /^[0-9a-f]{1,4}$/i.test(panId) &&
    panIdValue >= 1 &&
    panIdValue <= 0xfffe &&
    Number.isInteger(channel) &&
    channel >= 11 &&
    channel <= 26;
  if (!valid) {
    throw new Error(`Zigbee2mqtt: ${backupFilepath} does not hold the settings of the Zigbee network`);
  }
  const toBytes = (hex) => [...Buffer.from(hex, 'hex')];
  return { network_key: toBytes(key), pan_id: panIdValue, ext_pan_id: toBytes(extendedPanId), channel };
}

/**
 * @description Tell if the network of the coordinator was formed before Gladys asked Zigbee2mqtt to draw its
 * settings: Zigbee2mqtt was installed by an earlier start, and Gladys never asked for them.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - Id of the Zigbee2mqtt service.
 * @returns {Promise<boolean>} True for such a network.
 * @example
 * const formedBefore = await isNetworkFormedBeforeDrawnSettings(this.gladys, this.serviceId);
 */
async function isNetworkFormedBeforeDrawnSettings(gladys, serviceId) {
  const networkGenerated = await gladys.variable.getValue(CONFIGURATION.Z2M_NETWORK_GENERATED, serviceId);
  if (networkGenerated) {
    return false;
  }
  // Saved once Zigbee2mqtt is installed, destroyed by a reset
  const installedVersion = await gladys.variable.getValue(CONFIGURATION.DOCKER_Z2M_VERSION, serviceId);
  return Boolean(installedVersion);
}

/**
 * @description Write the Z2M configuration file again when there is none to keep: from the Z2M backup saved by Gladys,
 * with the network settings of the coordinator backup left by Zigbee2mqtt, which describe the network the coordinator
 * carries. A file that is not a YAML mapping is only replaced by the one of the Z2M backup: without it, the error is
 * thrown and the file left in place, for the user to fix it, as it may hold the only copy of the network settings.
 * @param {object} manager - Zigbee2mqtt manager.
 * @param {string} configFilepath - Path of the configuration file.
 * @param {boolean} configInvalid - Is the file in place not a YAML mapping?
 * @returns {Promise<object>} The configuration written.
 * @example
 * const loadedConfig = await recoverConfigFile(this, configFilepath, false);
 */
async function recoverConfigFile(manager, configFilepath, configInvalid) {
  const configFolder = path.dirname(configFilepath);
  // Restarted by Docker meanwhile, Zigbee2mqtt would write its onboarding file in place of a file removed, or start
  // on a restored file not given the coordinator settings yet
  const container = await findManagedContainer(manager.gladys.system, containerDescriptor);
  if (container) {
    await manager.gladys.system.stopContainer(container.id);
  }

  const filesToReplace = [];
  if (configInvalid) {
    logger.warn('Z2M configuration file is not valid YAML, only its backup can replace it');
    filesToReplace.push(CONFIGURATION_FILE);
  } else {
    // A file left in place would stop the restore
    await fs.rm(configFilepath, { force: true });
  }
  const coordinatorBackupFilepath = path.join(configFolder, COORDINATOR_BACKUP_FILE);
  if (await holdsNoJson(coordinatorBackupFilepath)) {
    // Cut short with the configuration file (a disk full): the one of the Z2M backup takes its place
    filesToReplace.push(COORDINATOR_BACKUP_FILE);
  }
  // A network already formed gets back its settings, and its devices, whether the container was created again or not
  await manager.restoreZ2mBackup(configFolder, filesToReplace);

  const { config: restoredConfig, invalid } = await readConfigFile(configFilepath);
  if (invalid) {
    // Zigbee2mqtt stays stopped until the next configuration
    throw new Error(`Zigbee2mqtt: ${configFilepath} is not valid YAML, fix it then restart Gladys`);
  }
  try {
    if (waitsForOnboarding(restoredConfig)) {
      // Started by a concurrent call: Zigbee2mqtt would wait for its onboarding at every start
      throw new Error('Zigbee2mqtt: Zigbee2mqtt wrote its onboarding file while its backup was restored');
    }
    // Newer than those of a restored file, the settings of the coordinator backup win: other settings would make
    // Zigbee2mqtt leave this network (ember) or stop on "configuration-adapter mismatch" (z-stack)
    const networkSettings = await readCoordinatorBackup(coordinatorBackupFilepath);
    const loadedConfig = restoredConfig || cloneDeep(DEFAULT.CONFIGURATION_CONTENT);
    if (networkSettings) {
      loadedConfig.advanced = { ...loadedConfig.advanced, ...networkSettings };
    } else if (!restoredConfig && (await isNetworkFormedBeforeDrawnSettings(manager.gladys, manager.serviceId))) {
      // Without network settings in its file, Zigbee2mqtt comes back on this network, as it did before
      logger.info('Writing default Z2M configuration, without network settings, for its existing network...');
      delete loadedConfig.advanced;
    } else if (!restoredConfig) {
      // A first installation, or one reset: Zigbee2mqtt draws the settings of a new network. Saved before the file is
      // written, so that a network drawn is never taken for one formed before
      logger.info('Writing default Z2M configuration...');
      await manager.gladys.variable.setValue(CONFIGURATION.Z2M_NETWORK_GENERATED, 'true', manager.serviceId);
    }
    await writeConfigFile(configFilepath, loadedConfig);
    return loadedConfig;
  } catch (e) {
    // A file restored but not given the coordinator settings would be kept as is by the next call: it is removed, for
    // the next call to do it all again
    await fs.rm(configFilepath, { force: true });
    throw e;
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
  await fs.mkdir(path.dirname(configFilepath), {
    recursive: true,
  });

  const { config: configInPlace, invalid } = await readConfigFile(configFilepath);
  let loadedConfig = configInPlace;

  let configCreated = false;
  if (loadedConfig !== null && !waitsForOnboarding(loadedConfig)) {
    logger.info('Z2M configuration file already exists.');
  } else {
    logger.info('No Z2M configuration file to keep, restoring its backup...');
    loadedConfig = await recoverConfigFile(this, configFilepath, invalid);
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
  const leftOptionKeys = Object.values(SERIAL_OPTIONS_BY_ADAPTER)
    .filter((options) => Object.entries(options).every(([key, value]) => serial[key] === value))
    .flatMap((options) => Object.keys(options));
  [...MANAGED_SERIAL_OPTION_KEYS, ...leftOptionKeys]
    .filter((key) => !(key in serialOptions))
    .forEach((key) => delete newSerial[key]);

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
  const portConfigured = !(config.z2mTcpPort === null || Number.isNaN(Number(config.z2mTcpPort)));
  const generateRandomPort = (setupMode || !existingPortConfig) && !portConfigured;

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
  } else if (existingPortConfig && !(setupMode && portConfigured)) {
    // TCP Port is not found in config, but z2m is alrady configured
    // For upgrade Gladys mode. A setup keeps the port of Gladys: the user may have changed it on the setup page.
    logger.debug('Keep default z2m port...');
    config.z2mTcpPort = port;
  }

  // Check for requested changes (the port of Gladys is a string, the one of the file a number). Zigbee2mqtt 2 serves
  // its interface only once enabled: enabled when the file does not say; an interface the user turned off by hand stays
  // off.
  if (Number(config.z2mTcpPort) !== port || frontend.enabled === undefined) {
    // The other settings of the interface (host, auth_token…) are kept
    const { enabled = true, port: previousPort, ...otherSettings } = frontend;
    loadedConfig.frontend = {
      enabled,
      port: Number(config.z2mTcpPort),
      ...otherSettings,
    };
    configChanged = true;
  }

  // The password of the interface: one written by hand in the file wins, and Gladys keeps it; else the one of Gladys is
  // written. A reference to another file (`!secret.yaml auth_token`) is left as is: Gladys does not know the password.
  const { auth_token: authToken } = loadedConfig.frontend;
  let passwordChanged = false;
  if (typeof authToken === 'string' && VALUE_REFERENCE.test(authToken)) {
    config.z2mFrontendAuthToken = null;
  } else if (typeof authToken === 'string' && authToken !== '') {
    // Changed in the file since Gladys saved it (by hand, or from the settings of the interface): Zigbee2mqtt may still
    // run with the previous one, restarted for the one Gladys shows and links, without writing the file again
    passwordChanged = authToken !== config.z2mFrontendAuthToken;
    config.z2mFrontendAuthToken = authToken;
  } else if (config.z2mFrontendAuthToken) {
    loadedConfig.frontend.auth_token = config.z2mFrontendAuthToken;
    configChanged = true;
  }

  if (configChanged) {
    logger.info('Writing custom zigbee2mqtt configuration file...');
    await writeConfigFile(configFilepath, loadedConfig);
  }

  return { configChanged: configCreated || configChanged || passwordChanged, adapterChanged };
}

module.exports = {
  configureContainer,
};
