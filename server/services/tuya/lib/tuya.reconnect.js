const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/tuya.constants');

const QUICK_RECONNECT_ATTEMPTS = 3;
const QUICK_RECONNECT_DELAY_MS = 1000 * 3;
const RECONNECT_INTERVAL_MS = 1000 * 60 * 30;

/**
 * @description Attempt to reconnect to Tuya if configured and not manually disconnected.
 * @returns {Promise<boolean>} Returns true if reconnect should be retried, false otherwise.
 * @example
 * await this.tryReconnect();
 */
async function tryReconnect() {
  try {
    if (!this.autoReconnectAllowed) {
      return false;
    }
    const status = await this.getStatus();
    if (!status.configured || status.manual_disconnect) {
      return false;
    }
    if (
      this.status === STATUS.CONNECTED ||
      this.status === STATUS.CONNECTING ||
      this.status === STATUS.DISCOVERING_DEVICES
    ) {
      return false;
    }
    logger.info('Tuya is disconnected, attempting auto-reconnect...');
    const configuration = await this.getConfiguration();
    await this.connect(configuration);
    return this.status !== STATUS.CONNECTED;
  } catch (e) {
    logger.warn('Auto-reconnect to Tuya failed:', e.message || e);
    return true;
  }
}

/**
 * @description Schedule quick reconnect attempts when disconnected.
 * @returns {Promise<void>} Resolves once the current attempt is finished.
 * @example
 * await this.scheduleQuickReconnects();
 */
function scheduleQuickReconnects() {
  if (this.quickReconnectInProgress) {
    return Promise.resolve();
  }
  this.quickReconnectInProgress = true;
  let attempts = 0;

  const runAttempt = async () => {
    attempts += 1;
    const shouldRetry = await this.tryReconnect();
    const isConnecting =
      this.status === STATUS.CONNECTED ||
      this.status === STATUS.CONNECTING ||
      this.status === STATUS.DISCOVERING_DEVICES;

    if (!shouldRetry || isConnecting) {
      this.clearQuickReconnects();
      return;
    }

    if (attempts < QUICK_RECONNECT_ATTEMPTS) {
      const timeoutId = setTimeout(runAttempt, QUICK_RECONNECT_DELAY_MS);
      if (timeoutId && typeof timeoutId.unref === 'function') {
        timeoutId.unref();
      }
      this.quickReconnectTimeouts.push(timeoutId);
      return;
    }

    this.quickReconnectInProgress = false;
  };

  return runAttempt();
}

/**
 * @description Clear pending quick reconnect timers and reset state.
 * @example
 * this.clearQuickReconnects();
 */
function clearQuickReconnects() {
  if (this.quickReconnectTimeouts && this.quickReconnectTimeouts.length > 0) {
    this.quickReconnectTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.quickReconnectTimeouts = [];
  }
  this.quickReconnectInProgress = false;
}

/**
 * @description Start the reconnect manager (quick reconnects + periodic interval).
 * @example
 * this.startReconnect();
 */
function startReconnect() {
  if (this.status !== STATUS.CONNECTED && this.autoReconnectAllowed) {
    this.scheduleQuickReconnects();
  }
  if (!this.reconnectInterval) {
    this.reconnectInterval = setInterval(() => this.scheduleQuickReconnects(), RECONNECT_INTERVAL_MS);
  }
}

/**
 * @description Stop the reconnect manager and clear all timers.
 * @example
 * this.stopReconnect();
 */
function stopReconnect() {
  if (this.reconnectInterval) {
    clearInterval(this.reconnectInterval);
    this.reconnectInterval = null;
  }
  this.clearQuickReconnects();
}

module.exports = {
  tryReconnect,
  scheduleQuickReconnects,
  clearQuickReconnects,
  startReconnect,
  stopReconnect,
};
