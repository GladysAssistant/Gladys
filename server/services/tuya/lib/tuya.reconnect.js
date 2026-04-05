const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/tuya.constants');

const QUICK_RECONNECT_ATTEMPTS = 3;
const QUICK_RECONNECT_DELAY_MS = 1000 * 3;
const RECONNECT_INTERVAL_MS = 1000 * 60 * 30;

/**
 * @description Create a reconnect manager for the Tuya handler.
 * @param {object} tuyaHandler - TuyaHandler instance.
 * @returns {object} Reconnect manager with start, stop methods.
 * @example
 * const reconnect = createReconnectManager(tuyaHandler);
 */
function createReconnectManager(tuyaHandler) {
  let reconnectInterval = null;
  let quickReconnectTimeouts = [];
  let quickReconnectInProgress = false;

  /**
   * @description Attempt to reconnect to Tuya if configured and not manually disconnected.
   * @returns {Promise<boolean>} Returns true if reconnect should be retried, false otherwise.
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
   * @description Start the reconnect manager (quick reconnects + periodic interval).
   */
  function start() {
    if (tuyaHandler.status !== STATUS.CONNECTED && tuyaHandler.autoReconnectAllowed) {
      scheduleQuickReconnects();
    }
    if (!reconnectInterval) {
      reconnectInterval = setInterval(scheduleQuickReconnects, RECONNECT_INTERVAL_MS);
    }
  }

  /**
   * @description Stop the reconnect manager and clear all timers.
   */
  function stop() {
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
    clearQuickReconnects();
  }

  return {
    start,
    stop,
  };
}

module.exports = {
  createReconnectManager,
};
