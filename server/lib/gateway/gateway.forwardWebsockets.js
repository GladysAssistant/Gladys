const logger = require('../../utils/logger');

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
  logger.debug(`Gateway : Forward websocket message : ${event.type}`);
  if (event.userId) {
    this.gladysGatewayClient.newEventInstanceUser(event.type, event.userId, event.payload);
  } else {
    this.gladysGatewayClient.newEventInstance(event.type, event.payload);
  }
}

module.exports = {
  forwardWebsockets,
};
