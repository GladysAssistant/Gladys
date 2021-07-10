const logger = require('../../../../utils/logger');
/**
 * @description listen
 * @example
 * rflink.listen();
 */
function listen() {
  this.usb.on('data', (data) => {
    this.message(data);
    logger.debug(`Rflink : message reçu : ${data}`);
  });
}

module.exports = {
  listen,
};
