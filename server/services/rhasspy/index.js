const logger = require('../../utils/logger');
const RhasspyManager = require('./lib');
// const RhasspyController = require('./api/rhasspy.controller');

module.exports = function RhasspyService(gladys, serviceId) {
  const rhasspyManager = new RhasspyManager(gladys, serviceId);
  /**
   * @public
   * @description This function start rhasspy service and connect it
   * @example
   * gladys.services.rhasspy.start();
   */
  async function start() {
    logger.log('Starting rhasspy service');
    rhasspyManager.init();
    await rhasspyManager.installRhasspyContainer();
    await rhasspyManager.listening();
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services.rhasspy.stop();
   */
  async function stop() {
    logger.log('Stopping Rhasspy service');
  }

  return Object.freeze({
    start,
    stop,
    // device: rhasspyManager,
    // controllers: RhasspyController(rhasspyManager),
  });
};
