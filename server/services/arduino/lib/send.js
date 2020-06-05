// const SerialPort = require('serialport');
const logger = require('../../../utils/logger');

/**
 * @description Send a message to the Arduino
 * @param {Object} path - The Arduino path.
 * @param {Object} message - The message to send.
 * @param {Object} pulseLength - The pulse length.
 * @example
 * send(path, message, pulse_length);
 */
async function send(path, message, pulseLength) {
  try {
    const textToSend = `${JSON.stringify(message)}%`;
    const gladysInstance = this.gladys;
    /* if(this.arduinosPorts[path] === undefined){
      this.arduinosPorts[path] = new this.SerialPort(path, { baudRate: 9600, lock: false });
    } */

    const port = new this.SerialPort(path, { baudRate: 9600, lock: false });
    // const port = this.arduinosPorts[path];

    if (!port.isOpen) {
      port.on('open', function() {
        this.gladys = gladysInstance;
        logger.warn('Arduino: port opened');
        for (let i = 0; i < pulseLength; i += 1) {
          port.write(textToSend);
        }
        this.gladys.event.emit('open');
      });
    }
  } catch (e) {
    logger.warn('Unable to send message');
    logger.debug(e);
  }
}

module.exports = {
  send,
};
