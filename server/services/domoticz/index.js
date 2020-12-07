const axios = require('axios').default;
const logger = require('../../utils/logger');
const DomoticzManager = require('./lib');
const DomoticzController = require('./api/domoticz.controller');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');

module.exports = function DomoticzService(gladys, serviceId) {
  const domoticzManager = new DomoticzManager(gladys, serviceId);

  /**
   * @public
   * @description This function starts the service
   * @example
   * gladys.services.domoticz.start();
   */
  async function start() {
    logger.info('Starting Domoticz service');
    const [serverAddress, serverPort] = await Promise.all([
      gladys.variable.getValue('DOMOTICZ_SERVER_ADDRESS', serviceId),
      gladys.variable.getValue('DOMOTICZ_SERVER_PORT', serviceId),
    ]);
    if (!serverAddress) {
      throw new ServiceNotConfiguredError('DOMOTICZ_SERVER_ADDRESS');
    }
    if (!serverPort) {
      throw new ServiceNotConfiguredError('DOMOTICZ_SERVER_PORT');
    }

    const client = axios.create({
      baseURL: `${serverAddress}:${serverPort}/`,
      timeout: 2000,
    });
    domoticzManager.connect(client);
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   * gladys.services.domoticz.stop();
   */
  async function stop() {
    logger.info('Stopping Domoticz service');
    domoticzManager.disconnect();
  }

  return Object.freeze({
    start,
    stop,
    device: domoticzManager,
    controllers: DomoticzController(gladys, domoticzManager, serviceId),
  });
};
