const logger = require('../../utils/logger');

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
      await this.gladysGatewayClient.instanceConnect(
        gladysGatewayRefreshToken,
        JSON.parse(gladysGatewayRsaPrivateKey),
        JSON.parse(gladysGatewayEcdsaPrivateKey),
        this.handleNewMessage,
      );
      this.connected = true;
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
