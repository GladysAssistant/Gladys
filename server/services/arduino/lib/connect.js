const logger = require('../../../utils/logger');
const serialport = require('serialport');
const SerialPort = serialport.SerialPort;

/**
 * @description Send a message to the Arduino
 * @param {Object} device - The Arduino device.
 * @example
 * send(device);
 */
async function connect(device) {
    try {
        const path = device.params.findIndex((param) => param.name === 'ARDUINO_PATH');
        var port = new SerialPort(path, {
            parser: serialport.parsers.readline('\n')
        });
    } catch (e) {
        logger.warn('Unable to send message');
        logger.debug(e);
    }
}

module.exports = {
    connect,
};
