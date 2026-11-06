const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

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
      // The lock survives restarts, whether the connection below succeeds or
      // not: the features stay off until Gladys Plus confirms the subscription
      // is paid, which is checked right away (one call, only for locked
      // instances) in case the payment was made while the instance was off.
      const paymentRequiredSince = await this.variable.getValue(
        SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE,
      );
      this.subscriptionActive = paymentRequiredSince === null;
      this.subscriptionPaymentRequiredSince = paymentRequiredSince;

      try {
        await this.gladysGatewayClient.instanceConnect(
          gladysGatewayRefreshToken,
          JSON.parse(gladysGatewayRsaPrivateKey),
          JSON.parse(gladysGatewayEcdsaPrivateKey),
          this.handleNewMessage.bind(this),
        );
        this.connected = true;

        try {
          await this.getUsersKeys();
        } catch (syncError) {
          logger.debug(syncError);
        }

        const value = await this.variable.getValue(
          SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_GOOGLE_HOME_USER_IS_CONNECTED_WITH_GATEWAY,
        );
        if (value !== null) {
          this.googleHomeConnected = true;
        }
      } catch (e) {
        logger.debug(e);
        this.connected = false;
      }

      await this.refreshUserKeys();

      if (this.connected && !this.subscriptionActive) {
        try {
          await this.refreshSubscriptionStatus();
        } catch (e) {
          logger.debug(e);
        }
      }
    }
  } catch (e) {
    logger.debug(e);
    this.connected = false;
  }

  if (this.backupSchedule && this.backupSchedule.cancel) {
    this.backupSchedule.cancel();
  }
  if (this.backupCatchUpSchedule && this.backupCatchUpSchedule.cancel) {
    this.backupCatchUpSchedule.cancel();
  }
  clearTimeout(this.backupCatchUpInitTimer);
  // schedule the nightly backup check
  const timezone = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);

  const rule = { tz: timezone, hour: 2, minute: 0, second: 0 };
  this.backupSchedule = this.scheduler.scheduleJob(rule, this.checkIfBackupNeeded.bind(this));
  // The check only backs up when no backup was made today, so it can run
  // again without harm: once in the daytime, for the instances that were off
  // or offline at night (an internet box switched off at night, say), and a
  // few minutes after start-up, for the instances that are off every night or
  // restarted during the backup window
  const catchUpRule = { tz: timezone, hour: this.backupCatchUpHour, minute: 0, second: 0 };
  this.backupCatchUpSchedule = this.scheduler.scheduleJob(catchUpRule, this.checkIfBackupNeeded.bind(this));
  this.backupCatchUpInitTimer = setTimeout(async () => {
    try {
      await this.checkIfBackupNeeded();
    } catch (e) {
      logger.warn('Gateway: backup catch-up check failed after start-up');
      logger.warn(e);
    }
  }, this.backupCatchUpInitTimeout);

  try {
    await this.scheduleWeeklyDigest();
  } catch (e) {
    logger.warn('Weekly digest scheduling failed during init', e);
  }

  // Get latest Gladys version in 5 minutes
  // To let the system initialize
  // (only official release images actually call Gladys Plus, see getLatestGladysVersion)
  setTimeout(async () => {
    try {
      await this.getLatestGladysVersion();
    } catch (e) {
      logger.debug(e);
    }
  }, this.getLatestGladysVersionInitTimeout);
}

module.exports = {
  init,
};
