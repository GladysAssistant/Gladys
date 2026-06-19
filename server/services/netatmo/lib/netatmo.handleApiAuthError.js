const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/netatmo.constants');

const NETATMO_AUTH_ERROR_STATUSES = new Set([401, 403, 406]);

/**
 * @description Trigger an auto-reconnect cycle when a Netatmo business API call returns an auth/app status.
 *
 * Statuses considered as auth/app errors:
 * - 401 Unauthorized (token rejected)
 * - 403 Forbidden (missing scopes / permission revoked)
 * - 406 Not Acceptable (Netatmo's way of signaling "Application is deactivated", error code 5)
 *
 * The status is always flipped to `RECONNECTING` so the UI and downstream callers
 * (e.g. `refreshNetatmoValues`, `discoverDevices`) do not overwrite it with `CONNECTED`
 * on their happy-path tail. The scheduling itself is idempotent: a new reconnect
 * cycle is only triggered when none is already in progress.
 *
 * Keeps the existing tokens; `scheduleReconnectAttempt` will call `refreshingTokens` which
 * decides whether the failure is transient (keep tokens) or fatal (clear tokens + disconnect).
 * @param {number} status - HTTP status returned by the failing call.
 * @returns {boolean} True if a reconnect cycle was triggered.
 * @example
 * this.handleApiAuthError(406);
 */
function handleApiAuthError(status) {
  if (!NETATMO_AUTH_ERROR_STATUSES.has(status)) {
    return false;
  }
  this.saveStatus({ statusType: STATUS.RECONNECTING, message: 'api_auth_error' });
  if (this.reconnectAttempt && this.reconnectAttempt > 0) {
    return false;
  }
  logger.warn(`Netatmo API call rejected with status ${status}, triggering reconnect cycle`);
  this.scheduleReconnectAttempt();
  return true;
}

module.exports = {
  handleApiAuthError,
};
