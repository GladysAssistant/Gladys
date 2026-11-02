const logger = require('../../utils/logger');

/**
 * @description Return if gateway is connected.
 * @returns {Promise} Return status.
 * @example
 * getStatus();
 */
async function getStatus() {
  const gladysGatewayRefreshToken = await this.variable.getValue('GLADYS_GATEWAY_REFRESH_TOKEN');
  const gladysGatewayRsaPrivateKey = await this.variable.getValue('GLADYS_GATEWAY_RSA_PRIVATE_KEY');
  const gladysGatewayEcdsaPrivateKey = await this.variable.getValue('GLADYS_GATEWAY_ECDSA_PRIVATE_KEY');

  const configured =
    gladysGatewayRefreshToken !== null && gladysGatewayRsaPrivateKey !== null && gladysGatewayEcdsaPrivateKey !== null;

  // the connection and subscription state must not depend on the health read
  let backupHealth = null;
  try {
    backupHealth = await this.getBackupHealth();
  } catch (e) {
    logger.warn('Gateway: unable to read the health of the backups');
    logger.warn(e);
  }
  return {
    configured,
    connected: this.connected,
    subscription_active: this.subscriptionActive,
    payment_required_since: this.subscriptionPaymentRequiredSince,
    backup_health: backupHealth,
  };
}

module.exports = {
  getStatus,
};
