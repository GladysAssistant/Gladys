const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { getDeviceFeatureExternalId } = require('../utils/externalId');
const { getMode } = require('../utils/getMode');
const { COMMAND_CLASSES, INDEXES, VALUE_MODES } = require('../constants');

/**
 * @description When a value changed.
 * @param {number} nodeId - The ID of the node.
 * @param {number} comClass - Zwave comclass.
 * @param {Object} value - The value.
 * @example
 * zwave.on('value changed', this.valueChanged);
 */
function valueChanged(nodeId, comClass, value) {
  logger.debug(`Zwave : Value Changed, nodeId = ${nodeId}, comClass = ${comClass}, index = ${value.index}, value = ${value.value}`);
  if (!this.nodes[nodeId].ready) {
    return;
  }

  if (comClass == COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL) {
    // Specific case handling for Switch Multilevel with V4 implementations.
    // In the V4 implementation, the level should be based on the target value
    // and not the level one.
    // See following docs:
    //  - Silabs  Application  Command Class Specification §4.72 - Multilevel Switch Command Class, version 4: 
    //      https://www.silabs.com/documents/login/miscellaneous/SDS13781-Z-Wave-Application-Command-Class-Specification.pdf
    //  - OpenZwave 1.6 Update:
    //      https://github.com/OpenZWave/open-zwave/wiki/OpenZWave-1.6-Release-Notes#switchmultilevel-commandclass
    if (value.index === INDEXES.INDEX_SWITCH_MULTILEVEL_TARGET) {
      logger.debug('Target value identified. Setting the level value instead');
      const levelValue = this.nodes[nodeId].classes[comClass][INDEXES.INDEX_SWITCH_MULTILEVEL_LEVEL];
      if (levelValue.value === value.value) {
        // Don't do anything if the value is already correct in memory
        logger.debug('Ignoring change. Memory already in sync.');

        return;
      }

      // clone levelValue to the expected object to set
      let updatedLevel = { ... levelValue };
      updatedLevel.value = value.value;
      value = updatedLevel;
    } else if (value.index === INDEXES.INDEX_SWITCH_MULTILEVEL_LEVEL) {
      // If the Target index exists, ignore the value event
      if (this.nodes[nodeId].classes[comClass][INDEXES.INDEX_SWITCH_MULTILEVEL_TARGET] !== null) {
        logger.debug('Ignoring level');

        return;
      }
    }
  }

  // If the value is the same as the one in memory, don't do anything except if READ only.
  if (this.nodes[nodeId].classes[comClass][value.index].value === value.value) {
    if (getMode(value) !== VALUE_MODES.READ ) {
      logger.debug('Ignoring change. Memory already in sync.');
      return;
    }
  }

  this.nodes[nodeId].classes[comClass][value.index] = value;
  this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: getDeviceFeatureExternalId(value),
    state: value.value,
  });
}

module.exports = {
  valueChanged,
};
