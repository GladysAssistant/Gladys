const logger = require('../../../utils/logger');
const { SETUP_VARIABLES, ADAPTER_MODE, INSTALLATION_KIND, INSTALLATION_STATE } = require('./constants');
const { validateSetup } = require('../utils/validateSetup');

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
  const coordinatorConfigured =
    z2mAdapterMode === ADAPTER_MODE.NETWORK ? Boolean(z2mNetworkAdapterUrl) : Boolean(z2mDriverPath);
  // Refused while an installation runs, as it reads the stored setup. Started before saving it, with no wait since
  // the check: another setup sent meanwhile is refused too, and the setup page reads the installation at once.
  this.startInstallation(coordinatorConfigured ? INSTALLATION_KIND.SWITCH : INSTALLATION_KIND.INSTALL);
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

  // Reload z2m container with new coordinator configuration, without waiting for it
  // eslint-disable-next-line promise/prefer-await-to-then
  this.runInstallation().catch((e) => {
    // The installation tells its own failure, unless its job failed to start
    if (this.installation.state === INSTALLATION_STATE.RUNNING) {
      logger.error('Zigbee2mqtt: installation job failed to start:', e);
      this.finishInstallation(e);
    }
  });
}

module.exports = {
  setup,
};
