/**
 * @description Polling requested device.
 * @param {Object} device - Device to poll.
 * @example
 * tasmotaManager.poll({}),
 */
function poll(device) {
  if (this.isHttpDevice(device)) {
    this.getHttpValue(device, this.gladys.event);
  }
}

module.exports = {
  poll,
};
