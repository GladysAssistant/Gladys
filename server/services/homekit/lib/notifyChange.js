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

  // Nullish and not ||, so that a mapping asking for no delay at all gets it: a smoke alarm and a
  // button press are both events, and `0 || 5000` would silently push them back to the default
  // five seconds.
  const delay = mappings[feature.category].capabilities[feature.type].notifDelay ?? 5000;

  // A zero delay means "no debounce at all", so it must not go through the timeout bookkeeping:
  // two events in the same tick would clear the first timer and only the second would reach
  // HomeKit. Send straight away instead.
  if (delay === 0) {
    this.sendState(hkAccessory, feature, event);

    return;
  }

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
