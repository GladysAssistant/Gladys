const logger = require('../../../../utils/logger');

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
  logger.trace(`SmartThings connector: "integrationDeletedHandler" not implemented : ${accessToken}`);
}

module.exports = {
  integrationDeletedHandler,
};
