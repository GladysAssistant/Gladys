const logger = require('../../utils/logger');
const { JOB_TYPES } = require('../../utils/constants');
const { BACKUP_RULE } = require('./lib/constants');
const MatterBridge = require('./lib/MatterBridge');
const MatterBridgeController = require('./api/matterBridge.controller');
const { loadMatter } = require('./lib/loadMatter');

module.exports = function MatterBridgeService(gladys, serviceId) {
  const bridge = new MatterBridge(gladys, serviceId, loadMatter);
  const backup = gladys.job.wrapper(JOB_TYPES.SERVICE_MATTER_BRIDGE_BACKUP, () => bridge.backup());
  let backupJob = null;

  /**
   * @public
   * @description Start the Matter bridge, when it is enabled.
   * @returns {Promise} Resolves once the bridge is started.
   * @example
   * gladys.services['matter-bridge'].start();
   */
  async function start() {
    logger.info('Starting Matter bridge service');
    await bridge.start();
    // The pairings are backed up every night, to be part of the Gladys backups.
    if (!backupJob) {
      backupJob = gladys.scheduler.scheduleJob(BACKUP_RULE, async () => {
        try {
          await backup();
        } catch (e) {
          logger.error(`Matter bridge: unable to back up: ${e.message}`);
        }
      });
    }
  }

  /**
   * @public
   * @description Stop the Matter bridge.
   * @returns {Promise} Resolves once the bridge is stopped.
   * @example
   * gladys.services['matter-bridge'].stop();
   */
  async function stop() {
    logger.info('Stopping Matter bridge service');
    if (backupJob) {
      backupJob.cancel();
      backupJob = null;
    }
    await bridge.stop();
  }

  return Object.freeze({
    start,
    stop,
    bridge,
    backup,
    controllers: MatterBridgeController(bridge),
  });
};
