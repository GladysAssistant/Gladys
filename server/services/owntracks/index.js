const logger = require('../../utils/logger');
const OwntracksHandler = require('./lib');

module.exports = function OwntracksService(gladys, serviceId) {

  const owntracksHandler = new OwntracksHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts the OwntracksService service
   * @example
   * gladys.services.owntracks.start();
   */
  async function start() {
    logger.log('starting Owntracks service');
    owntracksHandler.connect();
  }

  /**
   * @public
   * @description This function stops the OwntracksService service
   * @example
   * gladys.services.owntracks.stop();
   */
  async function stop() {
    logger.log('stopping Owntracks service');
    owntracksHandler.disconnect();
  }

  return Object.freeze({
    start,
    stop,
  });
};
