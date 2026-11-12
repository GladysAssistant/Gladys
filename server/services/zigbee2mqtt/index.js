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

  // The operations on the integration only count themselves (see runningOperations): their end is checked this often
  const OPERATIONS_CHECK_INTERVAL_IN_MS = 250;

  // End of the installation and of the operations waited for by a stop of the service
  let idleWait = null;

  const installationRunning = () => zigbee2mqttManager.installation.state === INSTALLATION_STATE.RUNNING;
  const busy = () => installationRunning() || zigbee2mqttManager.runningOperations > 0;

  /**
   * @description Wait for the running installation and the running operations (init, disconnect, reset, ezsp
   * fallback) to end, if any.
   * @returns {Promise} Resolve once none runs.
   * @example
   * await waitUntilIdle();
   */
  async function waitUntilIdle() {
    if (busy()) {
      logger.info('Zigbee2mqtt: waiting for the installation and the running operations to end before stopping');
    }
    // Both checked again each time: a setup sent meanwhile starts another installation, and the init of an update
    // whose download failed goes on with the containers once its installation ended
    while (busy()) {
      // eslint-disable-next-line no-await-in-loop
      await (installationRunning()
        ? zigbee2mqttManager.installationEnd
        : new Promise((resolve) => {
            setTimeout(resolve, OPERATIONS_CHECK_INTERVAL_IN_MS);
          }));
    }
  }

  /**
   * @public
   * @description This function stops the service, once the running installation and operations end: removed
   * meanwhile, the containers they create would be left half done, or created again right after. The setup page
   * refuses to disable or reset the integration then, the settings of the services stop it this way.
   * @example
   *  gladys.services.zigbee2mqtt.stop();
   */
  async function stop() {
    logger.log('Stopping Zigbee2mqtt service');
    // Sent again while the first one waits, as the settings still show the service running: the first one stops it
    if (idleWait !== null) {
      await idleWait;
      return;
    }
    idleWait = waitUntilIdle();
    try {
      await idleWait;
    } finally {
      idleWait = null;
    }
    // Shown stopped once the containers are removed: started again meanwhile, they would be created as they are removed
    await zigbee2mqttManager.disconnect();
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
