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
