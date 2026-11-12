const logger = require('../../utils/logger');
const Zigbee2mqttManager = require('./lib');
const Zigbee2mqttController = require('./api/zigbee2mqtt.controller');
const { INSTALLATION_STATE } = require('./lib/constants');

module.exports = function Zigbee2mqttService(gladys, serviceId) {
  const mqtt = require('mqtt');
  const zigbee2mqttManager = new Zigbee2mqttManager(gladys, mqtt, serviceId);

  /**
   * @public
   * @description This function starts service. Nothing to do while an installation runs: it starts Zigbee2mqtt, a
   * second init alongside it would create the same containers.
   * @example
   * gladys.services.zigbee2mqtt.start();
   */
  async function start() {
    logger.log('Starting Zigbee2mqtt service');
    if (zigbee2mqttManager.installation.state === INSTALLATION_STATE.RUNNING) {
      logger.info('Zigbee2mqtt: an installation is running, it starts Zigbee2mqtt');
      return;
    }
    await zigbee2mqttManager.init();
  }

  // End of the installation waited for by a stop of the service
  let installationWait = null;

  /**
   * @description Wait for the running installation to end, if any.
   * @returns {Promise} Resolve once no installation runs.
   * @example
   * await waitForInstallationEnd();
   */
  async function waitForInstallationEnd() {
    // Checked again once it ends: a setup sent meanwhile starts another one
    while (zigbee2mqttManager.installation.state === INSTALLATION_STATE.RUNNING) {
      logger.info('Zigbee2mqtt: waiting for the installation to end before stopping');
      // eslint-disable-next-line no-await-in-loop
      await zigbee2mqttManager.installationEnd;
    }
  }

  /**
   * @public
   * @description This function stops the service, once the running installation ends: removed meanwhile, the
   * containers it creates would be left half done. The setup page refuses to disable or reset the integration then, the
   * settings of the services stop it this way.
   * @example
   *  gladys.services.zigbee2mqtt.stop();
   */
  async function stop() {
    logger.log('Stopping Zigbee2mqtt service');
    // Sent again while the first one waits, as the settings still show the service running: the first one stops it
    if (installationWait !== null) {
      await installationWait;
      return;
    }
    installationWait = waitForInstallationEnd();
    try {
      await installationWait;
    } finally {
      installationWait = null;
    }
    zigbee2mqttManager.disconnect();
  }

  /**
   * @public
   * @description Test if Zigbee2mqtt is running.
   * @returns {Promise<boolean>} Returns true if Z2M is used.
   * @example
   *  const used = await gladys.services.zigbee2mqtt.isUsed();
   */
  async function isUsed() {
    return zigbee2mqttManager.gladysConnected && zigbee2mqttManager.zigbee2mqttConnected;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: zigbee2mqttManager,
    controllers: Zigbee2mqttController(gladys, zigbee2mqttManager),
  });
};
