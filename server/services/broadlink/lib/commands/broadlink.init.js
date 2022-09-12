const Promise = require('bluebird');

/**
 * @description Subscribe to Broadlink events.
 * @returns {Promise} Null.
 * @example
 * await gladys.broadlink.init();
 */
async function init() {
  const devices = await this.broadlink.discover();
  await Promise.each(devices, (device) => this.addPeripheral(device));
  return null;
}

module.exports = {
  init,
};
