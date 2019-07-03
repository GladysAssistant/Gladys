const { EVENTS } = require('../../utils/constants');

/**
 * @description Handle a new Gladys Gateway message.
 * @param {Object} data - Gateway message.
 * @param {Object} rawMessage - Message with metadata.
 * @param {Function} cb - Callback.
 * @example
 * handleNewMessage({
 *  type: 'gladys-api-call',
 * });
 */
async function handleNewMessage(data, rawMessage, cb) {
  if (!rawMessage.local_user_id) {
    cb({
      status: 400,
      error: 'GATEWAY_USER_NOT_LINKED',
    });
  }
  if (data.type === 'gladys-api-call' && rawMessage.local_user_id) {
    const user = await this.user.getById(rawMessage.local_user_id);
    this.event.emit(
      EVENTS.GATEWAY.NEW_MESSAGE_API_CALL,
      user,
      data.options.method,
      data.options.url,
      data.options.query,
      data.options.data,
      cb,
    );
  }
  return null;
}

module.exports = {
  handleNewMessage,
};
