const logger = require('../../utils/logger');
const tuyaController = require('./api/tuya.controller');

const TuyaHandler = require('./lib');
const { STATUS } = require('./lib/utils/tuya.constants');

module.exports = function TuyaService(gladys, serviceId) {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);
  const RECONNECT_INTERVAL_MS = 1000 * 60 * 30;
  let reconnectInterval = null;

  /**
   * @description Attempt to reconnect to Tuya if configured and not manually disconnected.
   * @returns {Promise<void>} Promise of nothing.
   * @example
   * await tryReconnect();
   */
  async function tryReconnect() {
    try {
      const status = await tuyaHandler.getStatus();
      if (!status.configured || status.manual_disconnect) {
        return;
      }
      if (
        tuyaHandler.status === STATUS.CONNECTED ||
        tuyaHandler.status === STATUS.CONNECTING ||
        tuyaHandler.status === STATUS.DISCOVERING_DEVICES
      ) {
        return;
      }
      logger.info('Tuya is disconnected, attempting auto-reconnect...');
      const configuration = await tuyaHandler.getConfiguration();
      await tuyaHandler.connect(configuration);
    } catch (e) {
      logger.warn('Auto-reconnect to Tuya failed:', e.message || e);
    }
  }

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services.tuya.start();
   */
  async function start() {
    logger.info('Starting Tuya service', serviceId);
    await tuyaHandler.init();
    if (tuyaHandler.status === STATUS.CONNECTED) {
      await tuyaHandler.loadDevices();
    }
    if (!reconnectInterval) {
      reconnectInterval = setInterval(tryReconnect, RECONNECT_INTERVAL_MS);
    }
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services.tuya.stop();
   */
  async function stop() {
    logger.info('Stopping Tuya service');
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
    await tuyaHandler.disconnect();
  }

  /**
   * @public
   * @description Test if Tuya is running.
   * @returns {Promise<boolean>} Returns true if Tuya is used.
   * @example
   *  const used = await gladys.services.tuya.isUsed();
   */
  async function isUsed() {
    return tuyaHandler.status === STATUS.CONNECTED && tuyaHandler.connector !== null;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: tuyaHandler,
    controllers: tuyaController(tuyaHandler),
  });
};
