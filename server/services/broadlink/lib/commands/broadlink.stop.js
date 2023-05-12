/**
 * @description Unsubscribe to Broadlink events.
 * @returns {null} Returns when stopped.
 * @example
 * gladys.broadlink.stop();
 */
function stop() {
  // Stop discovering
  this.broadlinkDevices = {};
  this.peripherals = {};

  Object.values(this.learnTimers).forEach((timer) => clearTimeout(timer));
  this.learnTimers = {};

  return null;
}

module.exports = {
  stop,
};
