/**
 * @description Unsubscribe to Broadlink events.
 * @example
 * gladys.broadlink.stop();
 */
function stop() {
  this.handlers = [];

  // Stop discovering
  const { sockets = [] } = this.broadlink;
  sockets.forEach((socket) => socket.close());

  this.broadlink.removeAllListeners();
  this.broadlinkDevices = {};
  this.peripherals = {};

  return null;
}

module.exports = {
  stop,
};
