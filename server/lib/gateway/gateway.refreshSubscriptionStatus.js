const { EVENTS } = require('../../utils/constants');
const { Error402 } = require('../../utils/httpErrors');

/**
 * @description Ask Gladys Plus whether the subscription is active, with one cheap
 * plan-gated call. Used by the "check again" button of the settings, and at
 * startup when the instance was locked before the restart: a customer who paid
 * while the instance was off must be unlocked as soon as it is back.
 *
 * When the subscription just came back, the daily backup check is run right away
 * so that the instance does not wait for the next night to be backed up again.
 * @returns {Promise<object>} Resolve with the gateway status.
 * @example
 * const status = await gateway.refreshSubscriptionStatus();
 */
async function refreshSubscriptionStatus() {
  const status = await this.getStatus();
  if (!status.configured) {
    return status;
  }
  const wasActive = this.subscriptionActive;
  try {
    // getBackups is behind the "plus" plan check on Gladys Plus:
    // it succeeds only when the subscription is active, and marks it so
    await this.getBackups();
  } catch (e) {
    if (!(e instanceof Error402)) {
      throw e;
    }
  }
  if (!wasActive && this.subscriptionActive) {
    this.event.emit(EVENTS.GATEWAY.CHECK_IF_BACKUP_NEEDED);
  }
  return this.getStatus();
}

module.exports = {
  refreshSubscriptionStatus,
};
