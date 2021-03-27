/**
 * @description Unsubscribe to Broadlink events.
 * @example
 * gladys.broadlink.stop();
 */
function stop() {
  Object.values(this.broadlinkDevices).forEach((device) => {
    device.removeAllListeners();
  });
  this.broadlink.removeAllListeners();
  this.broadlinkDevices = {};
  this.peripherals = {};
}

module.exports = {
  stop,
};
