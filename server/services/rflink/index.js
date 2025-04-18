const logger = require('../../utils/logger');
const RfLinkManager = require('./lib');
const RflinkController = require('./api/rflink.controller');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');

const RFLINK_PATH = 'RFLINK_PATH';

module.exports = function RfLink(gladys, serviceId) {
  const rfLinkManager = new RfLinkManager(gladys, serviceId);
  let RflinkPath;

  /**
   * @public
   * @description Start rflink service.
   * @example
   * gladys.services.rflink.start();
   */
  async function start() {
    RflinkPath = await gladys.variable.getValue(RFLINK_PATH, serviceId);
    if (!RflinkPath) {
      throw new ServiceNotConfiguredError('RFLINK_PATH_NOT_FOUND');
    } else {
      logger.info('Starting Rflink service');
    }
    try {
      rfLinkManager.connect(RflinkPath);
    } catch (err) {
      Promise.reject(Error(err));
    }
    const currentMilightGateway = await gladys.variable.getValue('CURRENT_MILIGHT_GATEWAY', serviceId);
    rfLinkManager.currentMilightGateway = currentMilightGateway;
    if (rfLinkManager.currentMilightGateway === null) {
      rfLinkManager.currentMilightGateway = 'F746';
    }
  }

  /**
   * @public
   * @description Stop rfllink service.
   * @example
   * gladys.services.rflink.stop();
   */
  async function stop() {
    logger.info('Stopping Rflink service');
    await rfLinkManager.disconnect();
  }

  return Object.freeze({
    start,
    stop,
    device: rfLinkManager,
    controllers: RflinkController(gladys, rfLinkManager, serviceId),
  });
};
