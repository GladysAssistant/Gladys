const turnOn = require('./plug.turnOn');
const turnOff = require('./plug.turnOff');

/**
 * @description Send the new device value over MQTT.
 * @param {Object} device - Updated Gladys device.
 * @param {Object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
function setValue(device, deviceFeature, value) {
  return value ? this.turnOn(device, deviceFeature) : this.turnOff(device, deviceFeature);
}

module.exports = setValue;
