/**
 * @description Polling requested device.
 * @param {object} device - Device to poll.
 * @example
 * nukiManager.poll({}),
 */
async function poll(device) {
  const protocol = this.getProtocolFromDevice(device);
  const handler = this.getHandler(protocol);
  await handler.getValue(device);
}

module.exports = {
  poll,
};
