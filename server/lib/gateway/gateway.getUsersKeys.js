const get = require('get-value');
const Promise = require('bluebird');
const logger = require('../../utils/logger');
const { ERROR_MESSAGES } = require('../../utils/constants');
const { Error500 } = require('../../utils/httpErrors');

/**
 * @description Return list of keys of the Gateway.
 * @returns {Promise} Resolve with the list of keys.
 * @example
 * getUsersKeys();
 */
async function getUsersKeys() {
  try {
    const onlineUsers = await this.gladysGatewayClient.getUsersInstance();
    let localUsers = await this.variable.getValue('GLADYS_GATEWAY_USERS_KEYS');
    localUsers = localUsers !== null ? JSON.parse(localUsers) : [];

    await Promise.map(onlineUsers, async (onlineUser) => {
      // save keys as fingerprint
      onlineUser.ecdsa_public_key = await this.gladysGatewayClient.generateFingerprint(onlineUser.ecdsa_public_key);
      onlineUser.rsa_public_key = await this.gladysGatewayClient.generateFingerprint(onlineUser.rsa_public_key);

      const found = localUsers.find((elem) => {
        return (
          elem.id === onlineUser.id &&
          elem.rsa_public_key === onlineUser.rsa_public_key &&
          elem.ecdsa_public_key === onlineUser.ecdsa_public_key
        );
      });

      if (!found) {
        onlineUser.accepted = false;
        localUsers.push(onlineUser);
      }
    });

    return localUsers;
  } catch (e) {
    logger.debug(e);
    const status = get(e, 'response.status');
    if (status) {
      throw new Error500();
    } else {
      throw new Error500(ERROR_MESSAGES.NO_CONNECTED_TO_THE_INTERNET);
    }
  }
}

module.exports = {
  getUsersKeys,
};
