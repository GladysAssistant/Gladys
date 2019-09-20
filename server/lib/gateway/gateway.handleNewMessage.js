const get = require('get-value');

const { NotFoundError } = require('../../utils/coreErrors');
const { EVENTS } = require('../../utils/constants');

/**
 * @description Handle a new Gladys Gateway message.
 * @param {Object} data - Gateway message.
 * @param {Object} rawMessage - Message with metadata.
 * @param {Function} cb - Callback.
 * @returns {Promise} Resolve when finished.
 * @example
 * handleNewMessage({
 *  type: 'gladys-api-call',
 * });
 */
async function handleNewMessage(data, rawMessage, cb) {
  // first, we verify that the user has the right to control the instance
  const usersKeys = JSON.parse(await this.variable.getValue('GLADYS_GATEWAY_USERS_KEYS'));
  const rsaPublicKey = await this.gladysGatewayClient.generateFingerprint(rawMessage.rsaPublicKeyRaw);
  const ecdsaPublicKey = await this.gladysGatewayClient.generateFingerprint(rawMessage.ecdsaPublicKeyRaw);

  const found = usersKeys.find(
    (user) => user.rsa_public_key === rsaPublicKey && user.ecdsa_public_key === ecdsaPublicKey,
  );

  if ((!found || !found.accepted) && get(data, 'options.url') !== '/api/v1/user') {
    cb({
      status: 403,
      error: 'USER_NOT_ACCEPTED_LOCALLY',
      message: 'User not allowed to control this Gladys instance',
    });
    return;
  }
  if (!rawMessage.local_user_id && get(data, 'options.url') !== '/api/v1/user') {
    cb({
      status: 400,
      error: 'GATEWAY_USER_NOT_LINKED',
    });
    return;
  }
  if (data.type === 'gladys-api-call') {
    try {
      const user = rawMessage.local_user_id ? await this.user.getById(rawMessage.local_user_id) : null;
      this.event.emit(
        EVENTS.GATEWAY.NEW_MESSAGE_API_CALL,
        user,
        data.options.method,
        data.options.url,
        data.options.query,
        data.options.data,
        cb,
      );
    } catch (e) {
      if (e instanceof NotFoundError && e.message === `User "${rawMessage.local_user_id}" not found`) {
        cb({
          status: 404,
          error: 'LINKED_USER_NOT_FOUND',
        });
      } else {
        cb(e);
      }
    }
  }
}

module.exports = {
  handleNewMessage,
};
