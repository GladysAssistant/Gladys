const logger = require('../../utils/logger');
const melCloudController = require('./api/melcloud.controller');

const MELCloudHandler = require('./lib');
const { STATUS, MELCLOUD_ENDPOINT } = require('./lib/utils/melcloud.constants');

module.exports = function MELCloudService(gladys, serviceId) {
  const axios = require('axios');

  const client = axios.create({
    baseURL: MELCLOUD_ENDPOINT,
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const melCloudHandler = new MELCloudHandler(gladys, serviceId, client);

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services.melcloud.start();
   */
  async function start() {
    logger.info('Starting MELCloud service', serviceId);
    await melCloudHandler.init();
    await melCloudHandler.loadDevices();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services.melcloud.stop();
   */
  async function stop() {
    logger.info('Stopping MELCloud service');
    await melCloudHandler.disconnect();
  }

  /**
   * @public
   * @description Test if MELCloud is running.
   * @returns {Promise<boolean>} Returns true if MELCloud is used.
   * @example
   *  const used = await gladys.services.melcloud.isUsed();
   */
  async function isUsed() {
    return melCloudHandler.status === STATUS.CONNECTED && melCloudHandler.connector !== null;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: melCloudHandler,
    controllers: melCloudController(melCloudHandler),
  });
};
