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
  if (data.type === 'gladys-api-call') {
    data.sender_id = '97fddeef-ab7f-444d-bafe-19acdec67634';
    const users = await this.user.get();
    this.event.emit(
      EVENTS.GATEWAY.NEW_MESSAGE_API_CALL,
      users[0],
      data.options.method,
      data.options.url,
      data.options.query,
      data.options.data,
      cb,
    );
  }
}

module.exports = {
  handleNewMessage,
};
