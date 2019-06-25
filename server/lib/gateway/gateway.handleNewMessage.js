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
function handleNewMessage(data, rawMessage, cb) {}

module.exports = {
  handleNewMessage,
};
