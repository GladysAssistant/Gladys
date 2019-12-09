
/**
 * @description Add device.
 * @param {string} sid - Xiaomi SID.
 * @param {Object} device - Device to add.
 * @example
 * xiaomi.addDevice(sid, device);
 */
function addDevice(sid, device) {
  console.log(this.netatmo)
  const doesntExistYet = this.devices[sid] === undefined;
  this.devices[sid] = device;
  if (doesntExistYet) {
    this.devices[sid] = device;
  }
}

module.exports = {
  addDevice,
};
