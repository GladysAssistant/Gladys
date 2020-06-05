const logger = require('../../../utils/logger');
/**
 * @description Xiaomi onMessage callback.
 * @param {Object} port - The port.
 * @param {Object} textToSend - The text to send.
 * @param {number} pulseLength - The pulse length.
 * @example
 * onPortOpen(port, textToSend, pulseLength);
 */
function onPortOpen(port, textToSend, pulseLength) {
  logger.warn('Arduino: port opened');
  for (let i = 0; i < pulseLength; i += 1) {
    port.write(textToSend);
  }
  // this.gladys.event.emit('open');
}

module.exports = {
  onPortOpen,
};
