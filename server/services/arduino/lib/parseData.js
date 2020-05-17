const logger = require('../../../utils/logger');
const SerialPort = require('serialport');

/**
 * @description Send a message to the Arduino
 * @param {Object} data - The data received.
 * @example
 * parseData(data);
 */
async function parseData(data) {
    try {

        logger.warn("parseData to code !")


    } catch (e) {
        logger.warn('parseData to code ! (It\'s an error)');
        logger.debug(e);
    }
}

module.exports = {
    parseData,
};
