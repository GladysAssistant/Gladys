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
        this.handleNewMessage.bind(this),
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

    if (!this.connected) {
      return;
    }

    try {
      const backups = await this.getBackups();
      let shouldBackup = false;
      if (backups.length === 0) {
        shouldBackup = true;
      } else {
        const lastBackupTimestamp = new Date(backups[0].created_at).getTime();
        const yesterday = new Date().getTime() - 24 * 60 * 60 * 1000;
        if (lastBackupTimestamp <= yesterday) {
          shouldBackup = true;
        }
      }
      if (shouldBackup) {
        logger.debug(`Trying to backup instance to Gladys Gateway`);
        await this.backup();
      } else {
        logger.debug(`Not backing up instance to Gladys Gateway, last backup is recent.`);
      }
    } catch (e) {
      logger.debug(e);
    }
  }
}

module.exports = {
  init,
};
