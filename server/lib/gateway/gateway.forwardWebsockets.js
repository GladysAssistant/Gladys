const logger = require('../../utils/logger');

/**
 * @description Forward websocket message to Gateway.
 * @param {object} event - Websocket event.
 * @example
 * forwardWebsockets({
 *   type: ''
 *   payload: {}
 * });
 */
async function forwardWebsockets(event) {
  if (!this.connected) {
    logger.debug('Gateway: not connected. Prevent forwarding event.');

    return;
  }

  logger.debug(`Gateway : Forward websocket message : ${event.type}`);
  try {
    if (event.userId) {
      await this.gladysGatewayClient.newEventInstanceUser(event.type, event.userId, event.payload);
    } else {
      await this.gladysGatewayClient.newEventInstance(event.type, event.payload);
    }
  } catch (e) {
    logger.debug('Unable to forward websocket to Gladys Gateway');
    logger.debug(e);
  }
}

module.exports = {
  forwardWebsockets,
};
