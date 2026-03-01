const logger = require('../../utils/logger');
const tuyaController = require('./api/tuya.controller');

const TuyaHandler = require('./lib');
const { STATUS } = require('./lib/utils/tuya.constants');

module.exports = function TuyaService(gladys, serviceId) {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);
  const RECONNECT_INTERVAL_MS = 1000 * 60 * 30;
  const QUICK_RECONNECT_ATTEMPTS = 3;
  const QUICK_RECONNECT_DELAY_MS = 1000 * 3;
  let reconnectInterval = null;
  let quickReconnectTimeouts = [];
  let quickReconnectInProgress = false;

  /**
   * @description Attempt to reconnect to Tuya if configured and not manually disconnected.
   * @returns {Promise<boolean>} Returns true if reconnect should be retried, false otherwise.
   * @example
   * await tryReconnect();
   */
  async function tryReconnect() {
    try {
      if (!tuyaHandler.autoReconnectAllowed) {
        return false;
      }
      const status = await tuyaHandler.getStatus();
      if (!status.configured || status.manual_disconnect) {
        return false;
      }
      if (
        tuyaHandler.status === STATUS.CONNECTED ||
        tuyaHandler.status === STATUS.CONNECTING ||
        tuyaHandler.status === STATUS.DISCOVERING_DEVICES
      ) {
        return false;
      }
      logger.info('Tuya is disconnected, attempting auto-reconnect...');
      const configuration = await tuyaHandler.getConfiguration();
      await tuyaHandler.connect(configuration);
      return tuyaHandler.status !== STATUS.CONNECTED;
    } catch (e) {
      logger.warn('Auto-reconnect to Tuya failed:', e.message || e);
      return true;
    }
  }

  /**
   * @description Clear pending quick reconnect timers and reset state.
   * @example
   * clearQuickReconnects();
   */
  function clearQuickReconnects() {
    if (quickReconnectTimeouts.length > 0) {
      quickReconnectTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      quickReconnectTimeouts = [];
    }
    quickReconnectInProgress = false;
  }

  /**
   * @description Schedule quick reconnect attempts when disconnected.
   * @returns {Promise<void>} Resolves once the current attempt is finished.
   * @example
   * await scheduleQuickReconnects();
   */
  function scheduleQuickReconnects() {
    if (quickReconnectInProgress) {
      return Promise.resolve();
    }
    quickReconnectInProgress = true;
    let attempts = 0;

    const runAttempt = async () => {
      attempts += 1;
      const shouldRetry = await tryReconnect();
      const isConnecting =
        tuyaHandler.status === STATUS.CONNECTED ||
        tuyaHandler.status === STATUS.CONNECTING ||
        tuyaHandler.status === STATUS.DISCOVERING_DEVICES;

      if (!shouldRetry || isConnecting) {
        clearQuickReconnects();
        return;
      }

      if (attempts < QUICK_RECONNECT_ATTEMPTS) {
        const timeoutId = setTimeout(runAttempt, QUICK_RECONNECT_DELAY_MS);
        if (timeoutId && typeof timeoutId.unref === 'function') {
          timeoutId.unref();
        }
        quickReconnectTimeouts.push(timeoutId);
        return;
      }

      quickReconnectInProgress = false;
    };

    return runAttempt();
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
    if (tuyaHandler.status !== STATUS.CONNECTED && tuyaHandler.autoReconnectAllowed) {
      scheduleQuickReconnects();
    }
    if (!reconnectInterval) {
      reconnectInterval = setInterval(scheduleQuickReconnects, RECONNECT_INTERVAL_MS);
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
    clearQuickReconnects();
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
