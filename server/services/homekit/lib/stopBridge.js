const { EVENTS } = require('../../../utils/constants');

/**
 * @description Stop HomeKit bridge.
 * @returns {Promise} HomeKit bridge to expose.
 * @example
 * stopBridge()
 */
async function stopBridge() {
  Object.keys(this.notifyTimeouts).forEach((key) => {
    clearTimeout(this.notifyTimeouts[key].timeout);
  });
  this.notifyTimeouts = {};

  if (this.notifyCb) {
    this.gladys.event.removeListener(EVENTS.TRIGGERS.CHECK, this.notifyCb);
    this.notifyCb = null;
  }

  if (this.bridge) {
    await this.bridge.unpublish();
    this.bridge = null;
  }
}

module.exports = {
  stopBridge,
};
