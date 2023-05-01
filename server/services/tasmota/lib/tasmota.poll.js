/**
 * @description Polling requested device.
 * @param {object} device - Device to poll.
 * @example
 * tasmotaManager.poll({}),
 */
function poll(device) {
  const protocol = this.getProtocolFromDevice(device);
  this.getHandler(protocol).getValue(device);
}

module.exports = {
  poll,
};
