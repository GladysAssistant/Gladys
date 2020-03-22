
/**
 * @description return a list of the rflink devices
 * @example
 * rflink.getDevices();
 * @returns {Object} Devices.
 */
function getDevices () {
    const devices = this.device;
    return devices;

}

module.exports = {
    getDevices,
};