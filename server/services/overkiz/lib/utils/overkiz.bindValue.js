const { DEVICE_STATES, HEATING_MODES } = require('../overkiz.constants');
const { getNodeStateInfoByExternalId } = require('./overkiz.externalId');

/**
 * @description Bind value.
 * @param {object} device - Device.
 * @param {object} deviceFeature - Device feature.
 * @param {object} value - Value to send.
 * @returns {object} Return the value adapted.
 * @example
 * const value = bindValue({}, {}}, 1);
 */
function bindValue(device, deviceFeature, value) {
  const { state } = getNodeStateInfoByExternalId(deviceFeature);
  if (state === DEVICE_STATES.OCCUPANCY_STATE) {
    return value === 0 ? 'noPersonInside' : 'personInside';
  }
  if (state === DEVICE_STATES.HEATING_LEVEL_STATE) {
    return HEATING_MODES[value];
  }
  if (state === DEVICE_STATES.COMFORT_TEMPERATURE_STATE || state === DEVICE_STATES.ECO_TEMPERATURE_STATE) {
    return parseFloat(value);
  }
  return value;
}

/**
 * @description Unbind value.
 * @param {object} device - Device.
 * @param {string} stateName - Device state name.
 * @param {string} stateValue - Device state value.
 * @returns {object} Return the value adapted.
 * @example
 * const value = unbindValue({}, 'name', 1);
 */
function unbindValue(device, stateName, stateValue) {
  if (stateName === DEVICE_STATES.OCCUPANCY_STATE) {
    return stateValue === 'noPersonInside' ? 0 : 1;
  }
  if (stateName === DEVICE_STATES.HEATING_LEVEL_STATE) {
    return HEATING_MODES.indexOf(stateValue);
  }
  return stateValue;
}

module.exports = {
  bindValue,
  unbindValue,
};
