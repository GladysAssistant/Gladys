const { STATE } = require('../../../../utils/constants');
const { COMMAND_CLASSES, SCENE_VALUES, SMOKE_ALARM_VALUES, PROPERTIES, ENDPOINTS } = require('../constants');

/**
 * @description Bind value.
 * @param {object} valueId - Value ID.
 * @param {object} value - Value object to send.
 * @returns {object} Return the value adapted.
 * @example
 * const value = bindValue({}, '8');
 */
function bindValue(valueId, value) {
  if (valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY) {
    return value === 1;
  }
  if (valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL) {
    return Number.parseInt(value, 10);
  }
  if (valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_NOTIFICATION) {
    return value === '8';
  }
  if (
    valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_COLOR &&
    valueId.property === PROPERTIES.HEX_COLOR
  ) {
    return `"${value.toString(16).padStart(6, '0')}"`;
  }
  if (
    valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_COLOR &&
    valueId.property === PROPERTIES.TARGET_COLOR &&
    valueId.endpoint === ENDPOINTS.TARGET_COLOR
  ) {
    return Math.round((value / 100) * 255);
  }
  return value;
}

/**
 * @description Unbind value.
 * @param {object} valueId - Value ID.
 * @param {object} value - Value object received.
 * @returns {object} Return the value adapted.
 * @example
 * const value = unbindValue({}, true);
 */
function unbindValue(valueId, value) {
  if (
    valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY ||
    valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SENSOR_BINARY
  ) {
    return value ? STATE.ON : STATE.OFF;
  }
  if (valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_NOTIFICATION) {
    if (valueId.fullProperty === PROPERTIES.MOTION_ALARM) {
      return value === 8 ? 1 : 0;
    }
    if (valueId.fullProperty === PROPERTIES.SMOKE_ALARM) {
      return SMOKE_ALARM_VALUES[value];
    }
  }
  if (valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_CENTRAL_SCENE) {
    return value === '' ? 0 : SCENE_VALUES[value % 10];
  }
  if (valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SCENE_ACTIVATION) {
    return SCENE_VALUES[value % 10];
  }
  if (
    valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_COLOR &&
    valueId.property === PROPERTIES.HEX_COLOR
  ) {
    if (value.substring) {
      if (value.charAt(0) === '"') {
        // Case value updated message
        return parseInt(value.substring(1, value.length - 1), 16);
      }
      // Case getNodes message
      return parseInt(value, 16);
    }
    return value;
  }
  if (
    valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_COLOR &&
    valueId.property === PROPERTIES.TARGET_COLOR &&
    valueId.endpoint === ENDPOINTS.TARGET_COLOR
  ) {
    return Math.round((value / 255) * 100);
  }
  return value;
}

module.exports = {
  bindValue,
  unbindValue,
};
