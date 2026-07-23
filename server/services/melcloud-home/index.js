const logger = require('../../utils/logger');
const melCloudHomeController = require('./api/melcloud-home.controller');

const MELCloudHomeHandler = require('./lib');
const { STATUS } = require('./lib/utils/melcloud-home.constants');

module.exports = function MELCloudHomeService(gladys, serviceId) {
  const axios = require('axios');

  const client = axios.create({
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const melCloudHomeHandler = new MELCloudHomeHandler(gladys, serviceId, client);

  /**
   * @public
   * @description This function starts the service.
   * @example
   * gladys.services['melcloud-home'].start();
   */
  async function start() {
    logger.info('Starting MELCloud Home service', serviceId);
    await melCloudHomeHandler.init();
    await melCloudHomeHandler.loadDevices();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services['melcloud-home'].stop();
   */
  async function stop() {
    logger.info('Stopping MELCloud Home service');
    await melCloudHomeHandler.disconnect();
  }

  /**
   * @public
   * @description Test if MELCloud Home is running.
   * @returns {Promise<boolean>} Returns true if MELCloud Home is used.
   * @example
   *  const used = await gladys.services['melcloud-home'].isUsed();
   */
  async function isUsed() {
    return melCloudHomeHandler.status === STATUS.CONNECTED && melCloudHomeHandler.accessToken !== null;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: melCloudHomeHandler,
    controllers: melCloudHomeController(melCloudHomeHandler),
  });
};
