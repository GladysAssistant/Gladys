const handlers = require('../modules');

/**
 * @description Subscribe to Broadlink events.
 * @example
 * gladys.broadlink.init();
 */
function init() {
  this.handlers = handlers.map((Handler) => new Handler(this.gladys, this.serviceId));

  this.broadlinkDevices = {};
  this.peripherals = {};
  this.broadlink.on('discover', this.addPeripheral);
  this.broadlink.discover();

  return null;
}

module.exports = {
  init,
};
