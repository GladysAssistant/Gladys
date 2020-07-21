/* eslint-disable no-prototype-builtins */
/* eslint-disable no-restricted-syntax */

/**
 * @description Add device.
 * @param {Object} deviceList - Device list to add.
 * @example
 * Rflink.addDevice(device);
 */
function addDevice(deviceList) {
  if (deviceList !== undefined) {
    this.devices = deviceList;
  }
}

module.exports = { addDevice };
