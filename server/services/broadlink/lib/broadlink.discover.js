/**
 * @description Search for Broadlink compatible peripherals and store them into 'peripherals' property.
 * @example
 * gladys.broadlink.discover();
 */
function discover() {
  this.broadlinkDevices = {};
  this.peripherals = {};
  this.broadlink.discover();
}

module.exports = {
  discover,
};
