const logger = require('../../utils/logger');
const { EVENTS, SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

/**
 * @description Init Gladys Gateway.
 * @example
 * init();
 */
async function init() {
  try {
    // try to connect instance to Gladys Gateway
    const gladysGatewayRefreshToken = await this.variable.getValue('GLADYS_GATEWAY_REFRESH_TOKEN');
    const gladysGatewayRsaPrivateKey = await this.variable.getValue('GLADYS_GATEWAY_RSA_PRIVATE_KEY');
    const gladysGatewayEcdsaPrivateKey = await this.variable.getValue('GLADYS_GATEWAY_ECDSA_PRIVATE_KEY');

    if (gladysGatewayRefreshToken && gladysGatewayRsaPrivateKey && gladysGatewayEcdsaPrivateKey) {
      // refreshing local cache of user keys
      this.refreshUserKeys();
      // connecting instance
      await this.gladysGatewayClient.instanceConnect(
        gladysGatewayRefreshToken,
        JSON.parse(gladysGatewayRsaPrivateKey),
        JSON.parse(gladysGatewayEcdsaPrivateKey),
        this.handleNewMessage.bind(this),
      );
      this.connected = true;
      // try to backup, if needed
      this.event.emit(EVENTS.GATEWAY.CHECK_IF_BACKUP_NEEDED);

      // check if google home is connected
      const value = await this.variable.getValue(
        SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_GOOGLE_HOME_USER_IS_CONNECTED_WITH_GATEWAY,
      );
      if (value !== null) {
        this.googleHomeConnected = true;
      }
    }
  } catch (e) {
    logger.debug(e);
    this.connected = false;
  }

  if (process.env.NODE_ENV === 'production') {
    try {
      await this.getLatestGladysVersion();
    } catch (e) {
      logger.debug(e);
    }
  }
}

module.exports = {
  init,
};
