/**
 * @description Subscribe to Broadlink events.
 * @example
 * gladys.broadlink.init();
 */
function init() {
  this.broadlink.on('discover', this.addPeripheral.bind(this));
}

module.exports = {
  init,
};
