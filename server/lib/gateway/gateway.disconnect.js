const logger = require('../../utils/logger');
const { EVENTS, SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

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
    this.subscriptionActive = true;
    this.subscriptionPaymentRequiredSince = null;
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
