const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description Handler Error from event
 * @example
 * errorHandler(device);
 */
async function errorHandler() {
  this.api.on('error', (error) => {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR,
    });
    logger.debug(error);
    logger.debug(`NETATMO threw an error login`);
  });
}

module.exports = {
  errorHandler,
};
