const logger = require('../../../../utils/logger');
const { VARIABLES } = require('../../utils/constants');

/**
 * @description Called when the connector is removed from SmartThings. You may want clean up access
 * tokens and other data when that happend.
 * @param {string} accessToken - External cloud access token.
 *
 * @see https://smartthings.developer.samsung.com/docs/devices/smartthings-schema/smartthings-schema-reference.html#Integration-Deleted
 * @see https://github.com/SmartThingsCommunity/st-schema-nodejs
 *
 * @example
 * await smartthingsHandler.integrationDeletedHandler('smartthings-access-token');
 */
async function integrationDeletedHandler(accessToken) {
  // Get current user
  const payload = this.gladys.session.validateAccessToken(accessToken);
  const userId = payload.user_id;

  // Removes callback information for current user
  await this.gladys.variable.destroy(VARIABLES.SMT_CALLBACK_OAUTH, this.serviceId, userId);

  delete this.callbackUsers[userId];

  logger.info(`SmartThings information well removed for user ${userId}`);
}

module.exports = {
  integrationDeletedHandler,
};
