const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');

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
    // Delete all variables related to the Gateway
    await this.variable.destroy('GLADYS_GATEWAY_REFRESH_TOKEN');
    await this.variable.destroy('GLADYS_GATEWAY_RSA_PRIVATE_KEY');
    await this.variable.destroy('GLADYS_GATEWAY_ECDSA_PRIVATE_KEY');
    await this.variable.destroy('GLADYS_GATEWAY_RSA_PUBLIC_KEY');
    await this.variable.destroy('GLADYS_GATEWAY_ECDSA_PUBLIC_KEY');
    await this.variable.destroy('GLADYS_GATEWAY_BACKUP_KEY');
    await this.variable.destroy('GLADYS_GATEWAY_USERS_KEYS');
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
