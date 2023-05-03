const { EVENTS } = require('../../../utils/constants');
const { mappings } = require('./deviceMappings');

/**
 * @description Add delay before send new state to Homekit.
 * @param {object} accessories - HomeKit accessories.
 * @param {object} event - Gladys event to forward to HomeKit.
 * @returns {undefined}
 * @example
 * notifyChange(accessories, event)
 */
function notifyChange(accessories, event) {
  if (event.type !== EVENTS.DEVICE.NEW_STATE) {
    return;
  }

  const feature = this.gladys.stateManager.get('deviceFeature', event.device_feature);
  const hkAccessory = accessories.find((accessory) => accessory.UUID === feature.device_id);
  if (!hkAccessory || !mappings[feature.category] || !mappings[feature.category].capabilities[feature.type]) {
    return;
  }

  const delay = mappings[feature.category].capabilities[feature.type].notifDelay || 5000;
  if (!this.notifyTimeouts[event.device_feature]) {
    this.notifyTimeouts[event.device_feature] = {
      timeout: setTimeout(() => {
        this.sendState(hkAccessory, feature, event);
      }, delay),
      startDateTime: new Date().getTime(),
    };

    return;
  }

  clearTimeout(this.notifyTimeouts[event.device_feature].timeout);

  const now = new Date().getTime();
  if (now - this.notifyTimeouts[event.device_feature].startDateTime < 2 * delay) {
    this.notifyTimeouts[event.device_feature].timeout = setTimeout(() => {
      this.sendState(hkAccessory, feature, event);
    }, delay);

    return;
  }

  this.sendState(hkAccessory, feature, event);
}

module.exports = {
  notifyChange,
};
