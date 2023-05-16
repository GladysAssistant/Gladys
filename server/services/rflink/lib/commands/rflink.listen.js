const logger = require('../../../../utils/logger');
/**
 * @description Listen to usb port.
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
