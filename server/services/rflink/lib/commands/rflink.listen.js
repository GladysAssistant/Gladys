const logger = require('../../../../utils/logger');
/**
 * @description listen
 * @example
 * rflink.listen();
 */
function listen() {
  this.usb.on('data', (data) => {
    this.message(data);
    logger.log(`Rflink : message reçu : ${data}`);
  });
}

module.exports = {
  listen,
};
