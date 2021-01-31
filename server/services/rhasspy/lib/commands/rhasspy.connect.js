const logger = require('../../../../utils/logger');
/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connect();
 */
async function connect() {
  if (this.configured === true) {
    logger.info('Connected to rhasspy, initialize websocket');
    // initialization of websocket
  } else {
    logger.warn('Rhasspy is not running')
  }
}

module.exports = {
  connect,
};
