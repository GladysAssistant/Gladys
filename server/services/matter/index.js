const logger = require('../../utils/logger');
const MatterHandler = require('./lib');
const MatterController = require('./api/matter.controller');

module.exports = function MatterService(gladys, serviceId) {
  const MatterMain = require('@matter/main');
  const ProjectChipMatter = require('@project-chip/matter.js');
  const matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, serviceId);

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services['matter'].start();
   */
  async function start() {
    logger.info('Starting Matter service');
    await matterHandler.init();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services['matter'].stop();
   */
  async function stop() {
    logger.info('Stopping Matter service');
    await matterHandler.stop();
  }

  /**
   * @public
   * @description This function return true if the service is used.
   * @returns {Promise<boolean>} Resolves with a boolean.
   * @example
   *  const isUsed = await gladys.services['matter'].isUsed();
   */
  async function isUsed() {
    return matterHandler.devices.length > 0;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: matterHandler,
    controllers: MatterController(matterHandler),
  });
};
