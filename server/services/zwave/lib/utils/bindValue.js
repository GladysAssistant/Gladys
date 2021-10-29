const { COMMAND_CLASSES, SCENE_VALUES } = require('../constants');

/**
 * @description Bind value
 * @param {Object} valueId - Value ID.
 * @param {Object} value - Value object to send.
 * @returns {Object} Return the value adapted.
 * @example
 * const value = bindValue(6, 0x4501, 12, 1);
 */
function bindValue(valueId, value) {
  // Zipato Mini Keypad RFID
  /* if (
    // productId === '0x4501' &&
    valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_ALARM &&
    valueId.endpoint === INDEXES.INDEX_ALARM_ACCESS_CONTROL
  ) {
    return value === 6 ? 0 : 1;
  } */
  if (valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY) {
    return value === 1;
  }
  if (valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL) {
    return Number.parseInt(value, 10);
  }
  return value;
}

/**
 * @description Unbind value
 * @param {Object} valueId - Value ID.
 * @param {Object} value - Value object received.
 * @returns {Object} Return the value adapted.
 * @example
 * const value = unbindValue(6, 0x4501, 12, 1);
 */
function unbindValue(valueId, value) {
  if (valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY) {
    return value ? 1 : 0;
  }
  if (valueId.commandClass === COMMAND_CLASSES.COMMAND_CLASS_CENTRAL_SCENE) {
    return SCENE_VALUES[value];
  }
  return value;
}

module.exports = {
  bindValue,
  unbindValue,
};
