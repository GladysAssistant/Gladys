const logger = require('../../../../utils/logger');

/**
 * @description Add a new device.
 * @param {Object} device - Device to add.
 * @example
 * Rflink.addDevice(device);
 */
function addNewDevice(device) {

    logger.log(`ajout du device : ${device}`);
    this.newDevices.push(device);

}

module.exports = { addNewDevice };
