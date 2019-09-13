/**
 * @description Forward websocket message to Gateway.
 * @param {Object} event - Websocket event.
 * @example
 * forwardWebsockets({
 *   type: ''
 *   payload: {}
 * });
 */
async function forwardWebsockets(event) {
  this.gladysGatewayClient.newEventInstance(event.type, event.payload);
}

module.exports = {
  forwardWebsockets,
};
