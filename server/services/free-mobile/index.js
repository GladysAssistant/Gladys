const logger = require('../../utils/logger');
const MessageHandler = require('./lib');

module.exports = function FreeMobileService(gladys, serviceId) {
  const axios = require('axios');
  const messageHandler = new MessageHandler(gladys, axios, serviceId);

  /**
   * @description Migrate the legacy global Free Mobile configuration (stored without
   * a user) to a per-user configuration attached to the admin user.
   * @example
   * await migrateGlobalConfiguration();
   */
  async function migrateGlobalConfiguration() {
    const globalUsername = await gladys.variable.getValue('FREE_MOBILE_USERNAME', serviceId);
    const globalAccessToken = await gladys.variable.getValue('FREE_MOBILE_ACCESS_TOKEN', serviceId);

    // Nothing to migrate
    if (!globalUsername && !globalAccessToken) {
      return;
    }

    const admins = await gladys.user.getByRole('admin');
    if (admins.length === 0) {
      logger.warn('Free Mobile: no admin user found, cannot migrate global configuration');
      return;
    }
    const [admin] = admins;

    const adminUsername = await gladys.variable.getValue('FREE_MOBILE_USERNAME', serviceId, admin.id);
    const adminAccessToken = await gladys.variable.getValue('FREE_MOBILE_ACCESS_TOKEN', serviceId, admin.id);

    if (!adminUsername && !adminAccessToken) {
      // The admin has no per-user configuration yet: copy the legacy pair only if it is complete,
      // to avoid creating a mismatched username/token pair
      if (!globalUsername || !globalAccessToken) {
        logger.warn('Free Mobile: legacy global configuration is incomplete, keeping it as-is');
        return;
      }
      logger.info(`Free Mobile: migrating global configuration to admin user ${admin.selector}`);
      await gladys.variable.setValue('FREE_MOBILE_USERNAME', globalUsername, serviceId, admin.id);
      await gladys.variable.setValue('FREE_MOBILE_ACCESS_TOKEN', globalAccessToken, serviceId, admin.id);
    } else if (!adminUsername || !adminAccessToken) {
      // The admin has a partial per-user configuration: don't mix it with legacy values,
      // and keep the legacy variables so they remain recoverable
      logger.warn('Free Mobile: admin user has a partial configuration, keeping the legacy global configuration');
      return;
    }

    // The admin now has a complete pair: remove the legacy global variables
    await gladys.variable.destroy('FREE_MOBILE_USERNAME', serviceId);
    await gladys.variable.destroy('FREE_MOBILE_ACCESS_TOKEN', serviceId);
  }

  /**
   * @public
   * @description This function starts the FreeMobile service.
   * @example
   * gladys.services.free-mobile.start();
   */
  async function start() {
    logger.info('Starting Free Mobile service');
    await migrateGlobalConfiguration();
  }

  /**
   * @public
   * @description This function stops the FreeMobile service.
   * @example
   *  gladys.services.free-mobile.stop();
   */
  async function stop() {
    logger.info('Stopping Free Mobile service');
  }

  /**
   * @public
   * @description This function returns if the Free Mobile service is used.
   * @returns {Promise<boolean>} Returns true if the Free Mobile service is used.
   * @example
   * const used = await gladys.services.free-mobile.isUsed();
   */
  async function isUsed() {
    const [usernames, accessTokens] = await Promise.all([
      gladys.variable.getVariables('FREE_MOBILE_USERNAME', serviceId),
      gladys.variable.getVariables('FREE_MOBILE_ACCESS_TOKEN', serviceId),
    ]);
    const usersWithToken = new Set(
      accessTokens.filter((variable) => variable.user_id && variable.value).map((variable) => variable.user_id),
    );
    return usernames.some((variable) => variable.user_id && variable.value && usersWithToken.has(variable.user_id));
  }

  return Object.freeze({
    start,
    stop,
    message: messageHandler,
    isUsed,
  });
};
