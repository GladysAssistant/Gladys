/**
 * @description Format a websocket message.
 * @param {string} type - The type of the websocket message.
 * @param {*} payload - The payload of the message.
 * @example
 * formatWebsocketMessage('message.new', { text: 'test' });
 */
function formatWebsocketMessage(type, payload) {
  const message = {
    type,
    payload,
  };
  return JSON.stringify(message);
}

/**
 * @description Parse a websocket message.
 * @param {string} message - Websocket message.
 * @example
 * parseWebsocketMessage('{}');
 */
function parseWebsocketMessage(message) {
  try {
    const parsedPayload = JSON.parse(message);
    return parsedPayload;
  } catch (e) {
    throw new Error('Unable to parse websocket message');
  }
}

module.exports = {
  formatWebsocketMessage,
  parseWebsocketMessage,
};
