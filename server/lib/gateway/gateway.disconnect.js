const logger = require('../../utils/logger');
const { EVENTS, SYSTEM_VARIABLE_NAMES, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description Disconnect Gladys Gateway.
 * @example
 * disconnect();
 */
async function disconnect() {
  try {
    // Disconnect from Gladys Gateway
    this.gladysGatewayClient.disconnect();
    this.connected = false;
    // The payment lock goes with the account. From now on, a transition asked
    // by a call made for this account (a 402 still in flight) is dropped, and
    // the one in progress is left to finish before the state is reset, so that
    // it cannot re-lock the instance for the next account.
    this.subscriptionLinkGeneration += 1;
    await (this.subscriptionTransition || Promise.resolve()).catch(() => null);
    if (!this.subscriptionActive) {
      // the lock goes with the account: the front drops its notice right away
      // (no "active again" chat message: nothing was paid, the link is gone)
      this.subscriptionActive = true;
      this.subscriptionPaymentRequiredSince = null;
      this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.GATEWAY.SUBSCRIPTION_STATUS_CHANGED,
        payload: { subscription_active: true, payment_required_since: null },
      });
    }
    // Delete all variables related to the Gateway
    await this.variable.destroy('GLADYS_GATEWAY_REFRESH_TOKEN');
    await this.variable.destroy('GLADYS_GATEWAY_RSA_PRIVATE_KEY');
    await this.variable.destroy('GLADYS_GATEWAY_ECDSA_PRIVATE_KEY');
    await this.variable.destroy('GLADYS_GATEWAY_RSA_PUBLIC_KEY');
    await this.variable.destroy('GLADYS_GATEWAY_ECDSA_PUBLIC_KEY');
    await this.variable.destroy('GLADYS_GATEWAY_BACKUP_KEY');
    await this.variable.destroy('GLADYS_GATEWAY_USERS_KEYS');
    // the payment lock belongs to the account being unlinked: the next
    // account linked to this instance starts unlocked
    await this.variable.destroy(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE);
  } catch (e) {
    logger.debug(e);
    this.connected = false;
  }
  // Gladys Plus is now unlinked: features depending on the link recompute
  // their availability (e.g. external integration webhooks)
  this.event.emit(EVENTS.GATEWAY.LINK_STATUS_CHANGED);
}

module.exports = {
  disconnect,
};
