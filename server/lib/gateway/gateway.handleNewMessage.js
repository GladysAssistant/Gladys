const get = require('get-value');

const { NotFoundError } = require('../../utils/coreErrors');
const { EVENTS } = require('../../utils/constants');

/**
 * @description Handle a new Gladys Gateway message.
 * @param {object} data - Gateway message.
 * @param {object} rawMessage - Message with metadata.
 * @param {Function} cb - Callback.
 * @returns {Promise} Resolve when finished.
 * @example
 * handleNewMessage({
 *  type: 'gladys-api-call',
 * });
 */
async function handleNewMessage(data, rawMessage, cb) {
  if (data.type === 'gladys-api-call') {
    const rsaPublicKey = await this.gladysGatewayClient.generateFingerprint(rawMessage.rsaPublicKeyRaw);
    const ecdsaPublicKey = await this.gladysGatewayClient.generateFingerprint(rawMessage.ecdsaPublicKeyRaw);
    const found = this.usersKeys.find(
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
    try {
      let user = null;

      if (rawMessage.local_user_id) {
        user = this.stateManager.get('userById', rawMessage.local_user_id);
        if (user === null) {
          throw new NotFoundError(`User "${rawMessage.local_user_id}" not found`);
        }
      }

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

  // if the message is an open API message
  if (data.type === 'gladys-open-api' && data.action === 'create-owntracks-location') {
    this.event.emit(EVENTS.GATEWAY.NEW_MESSAGE_OWNTRACKS_LOCATION, data.data);
    cb({ status: 200 });
  }

  // if the message is an open API create device state message
  if (data.type === 'gladys-open-api' && data.action === 'create-device-state') {
    this.event.emit(EVENTS.DEVICE.NEW_STATE, data.data);
    cb({ status: 200 });
  }

  // if the message is a Google Home request
  if (data.type === 'gladys-open-api' && data.action === 'google-home-request') {
    await this.handleGoogleHomeMessage(data, rawMessage, cb);
  }

  // if the message is a Alexa request
  if (data.type === 'gladys-open-api' && data.action === 'alexa-request') {
    await this.handleAlexaMessage(data, rawMessage, cb);
  }
}

module.exports = {
  handleNewMessage,
};
