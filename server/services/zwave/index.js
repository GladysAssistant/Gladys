const logger = require('../../utils/logger');
const ZwaveManager = require('./lib');
const ZwaveController = require('./api/zwave.controller');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');

module.exports = function ZwaveService(gladys, serviceId) {
  const ZWaveJS = require('zwave-js');

  const zwaveManager = new ZwaveManager(gladys, ZWaveJS, serviceId);

  /**
   * @public
   * @description This function starts the service
   * @example
   * gladys.services.zwave.start();
   */
  async function start() {
    logger.info('Starting zwave service');
    const zwaveDriverPath = await gladys.variable.getValue('ZWAVE_DRIVER_PATH', serviceId);
    if (!zwaveDriverPath) {
      throw new ServiceNotConfiguredError('ZWAVE_DRIVER_PATH_NOT_FOUND');
    }
    const s2Unauthenticated = await gladys.variable.getValue('S2_Unauthenticated', serviceId);
    const s2Authenticated = await gladys.variable.getValue('S2_Authenticated', serviceId);
    const s2AccessControl = await gladys.variable.getValue('S2_AccessControl', serviceId);
    const s0Legacy = await gladys.variable.getValue('S0_Legacy', serviceId);
    const securityKeys = {};
    if(s2Unauthenticated) {
      securityKeys.S2_Unauthenticated = Buffer.from(s2Unauthenticated, 'hex');
    }
    if(s2Authenticated) {
      securityKeys.S2_Authenticated = Buffer.from(s2Authenticated, 'hex');
    }
    if(s2AccessControl) {
      securityKeys.S2_AccessControl = Buffer.from(s2AccessControl, 'hex');
    }
    if(s0Legacy) {
      securityKeys.S0_Legacy = Buffer.from(s0Legacy, 'hex');
    }
    await zwaveManager.connect(zwaveDriverPath, securityKeys);
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   * gladys.services.zwave.stop();
   */
  async function stop() {
    logger.info('Stopping zwave service');
    zwaveManager.disconnect();
  }

  return Object.freeze({
    start,
    stop,
    device: zwaveManager,
    controllers: ZwaveController(gladys, zwaveManager, serviceId),
  });
};
