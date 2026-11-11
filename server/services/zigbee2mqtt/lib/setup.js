const logger = require('../../../utils/logger');
const { CONFIGURATION, SETUP_VARIABLES, ADAPTER_MODE, INSTALLATION_KIND, INSTALLATION_STATE } = require('./constants');
const { validateSetup } = require('../utils/validateSetup');

/**
 * @description Get the coordinator a configuration points Zigbee2mqtt to: the URL of a network coordinator, or the port
 * of a USB dongle, as for the configurations older than the adapter mode. A URL never equals a port, so another
 * adapter mode gives another coordinator.
 * @param {string} adapterMode - Adapter mode, network or USB.
 * @param {string} driverPath - Port of the USB dongle.
 * @param {string} networkAdapterUrl - URL of the network coordinator.
 * @returns {string|null} The URL or the port, null when no coordinator is configured.
 * @example
 * const coordinator = getCoordinator('usb', '/dev/ttyUSB0', null);
 */
function getCoordinator(adapterMode, driverPath, networkAdapterUrl) {
  return (adapterMode === ADAPTER_MODE.NETWORK ? networkAdapterUrl : driverPath) || null;
}

/**
 * @description Setup Zigbee2mqtt properties, then install Zigbee2mqtt in the background: the setup page follows the
 * installation through its progress, its failure is reported there and in its job.
 * @param {object} config - Configuration about Zigbee2Mqtt service.
 * @example
 * await this.setup({ ZIGBEE2MQTT_DRIVER_PATH: '/dev/tty0', ZIGBEE_DONGLE_NAME: 'zzh' });
 */
async function setup(config) {
  logger.debug('Zigbee2mqtt: storing setp...', config);
  const validatedConfig = validateSetup(config);

  const { z2mAdapterMode, z2mDriverPath, z2mNetworkAdapterUrl } = await this.getConfiguration();
  // As saved below: a variable missing from the setup keeps its stored value
  const getSavedValue = (key, storedValue) => (validatedConfig[key] !== undefined ? validatedConfig[key] : storedValue);
  const storedCoordinator = getCoordinator(z2mAdapterMode, z2mDriverPath, z2mNetworkAdapterUrl);
  const savedCoordinator = getCoordinator(
    getSavedValue(CONFIGURATION.Z2M_ADAPTER_MODE, z2mAdapterMode),
    getSavedValue(CONFIGURATION.Z2M_DRIVER_PATH, z2mDriverPath),
    getSavedValue(CONFIGURATION.Z2M_NETWORK_ADAPTER_URL, z2mNetworkAdapterUrl),
  );
  // A switch replaces the configured coordinator: not when the same one is saved again, after a failed installation,
  // or when only another setting changes, like the port of the interface
  const coordinatorSwitched = storedCoordinator !== null && savedCoordinator !== storedCoordinator;
  // Refused while an installation runs, as it reads the stored setup, or while an init runs, alongside which the init
  // of the installation would run. Started before saving it, with no wait since the check: another setup sent meanwhile
  // is refused too, and the setup page reads the installation at once.
  this.refuseWhileInstalling('save the setup');
  this.startInstallation(coordinatorSwitched ? INSTALLATION_KIND.SWITCH : INSTALLATION_KIND.INSTALL);
  try {
    await Promise.all(
      SETUP_VARIABLES.filter((key) => validatedConfig[key] !== undefined).map((key) =>
        this.saveOrDestroyVariable(key, validatedConfig[key]),
      ),
    );
  } catch (e) {
    this.finishInstallation(e);
    throw e;
  }

  const { installation } = this;
  // Reload z2m container with new coordinator configuration, without waiting for it
  // eslint-disable-next-line promise/prefer-await-to-then
  this.runInstallation().catch((e) => {
    // The installation tells its own failure, unless its job failed to start. Only this installation: the job wrapper
    // saves the failure of the job before rejecting, and a setup sent meanwhile may have started another one
    if (this.installation === installation && installation.state === INSTALLATION_STATE.RUNNING) {
      logger.error('Zigbee2mqtt: installation job failed to start:', e);
      this.finishInstallation(e);
    }
  });
}

module.exports = {
  setup,
};
