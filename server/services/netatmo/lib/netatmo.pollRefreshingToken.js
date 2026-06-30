const logger = require('../../../utils/logger');
const { STATUS, RECONNECT_BACKOFF_MS, RECONNECT_RECURRENT_MS } = require('./utils/netatmo.constants');

/**
 * @description Schedule the next short-retry attempt after a transient refresh failure.
 *
 * Cadence: backoff steps from RECONNECT_BACKOFF_MS, then RECONNECT_RECURRENT_MS recurrent.
 * Tokens are kept across retries so a manual reconnect remains possible.
 * @example
 * this.scheduleReconnectAttempt();
 */
function scheduleReconnectAttempt() {
  const step = this.reconnectAttempt || 0;
  const delay = step < RECONNECT_BACKOFF_MS.length ? RECONNECT_BACKOFF_MS[step] : RECONNECT_RECURRENT_MS;
  this.reconnectAttempt = step + 1;
  logger.warn(`Netatmo: scheduling reconnect attempt #${this.reconnectAttempt} in ${delay}ms`);
  clearTimeout(this.reconnectTimeout);
  this.reconnectTimeout = setTimeout(async () => {
    try {
      await this.refreshingTokens();
      this.reconnectTimeout = undefined;
      clearInterval(this.pollRefreshToken);
      await this.pollRefreshingToken();
      if (!this.pollRefreshValues) {
        await this.refreshNetatmoValues();
      }
      if (this.status === STATUS.RECONNECTING) {
        this.scheduleReconnectAttempt();
        return;
      }
      if (!this.pollRefreshValues) {
        await this.pollRefreshingValues();
      }
      this.reconnectAttempt = 0;
    } catch (e) {
      if (e && e.transient) {
        this.scheduleReconnectAttempt();
      } else {
        logger.error('Netatmo: reconnect attempt failed with non-transient error, stopping retries: ', e);
        this.reconnectAttempt = 0;
        this.reconnectTimeout = undefined;
      }
    }
  }, delay);
}

/**
 * @description Refresh Netatmo tokens once and re-arm the polling interval if expiration changes.
 * @example
 * await this.refreshNetatmoTokens();
 */
async function refreshNetatmoTokens() {
  const { expireInToken } = this;
  try {
    await this.refreshingTokens();
    this.reconnectAttempt = 0;
    if (this.expireInToken !== expireInToken) {
      logger.warn(`New expiration access_token : ${this.expireInToken}ms `);
      clearInterval(this.pollRefreshToken);
      await this.pollRefreshingToken();
    }
  } catch (e) {
    if (e && e.transient) {
      this.scheduleReconnectAttempt();
    }
  }
}

/**
 * @description Start polling the Netatmo refresh token endpoint at the access-token expiry cadence.
 * @example
 * this.pollRefreshingToken();
 */
function pollRefreshingToken() {
  if (this.expireInToken > 0) {
    this.pollRefreshToken = setInterval(this.refreshNetatmoTokens.bind(this), this.expireInToken * 1000);
  }
}

module.exports = {
  pollRefreshingToken,
  refreshNetatmoTokens,
  scheduleReconnectAttempt,
};
