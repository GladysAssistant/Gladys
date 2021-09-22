const logger = require('../../../../utils/logger');
const { COMMAND_CLASSES, INDEXES } = require('../constants');

/**
 * @description Test if provided comClass support V4 ZWave Swith.
 *
 * @param {Object} comClass - The comClass zWave object.
 *
 * @returns {boolean} True if the current node supports V4. False otherwise.
 *
 * @example
 *  const isSupportingV4 = supportsV4ZWaveSwitch(zWaveComClassObject);
 */
function supportsV4ZWaveSwitch(comClass) {
    return (
        Object.keys(comClass).filter((key) => parseInt(key, 10) === INDEXES.INDEX_SWITCH_MULTILEVEL_TARGET).length === 1
    );
}

/**
 * @description Get the value following a value changed event
 * for a Switch Multilevel Command Class.
 * 
 * @param {Object} node - The node the value change occurs.
 * @param {Object} valueChanged - The value changed.
 * @returns {Object?} - The zWave value to update. NULL if change MUST be
 * prevented.
 */
function getSwitchMultilevelChangedValue(node, valueChanged) {
    const comClass = node.classes[COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL];
  
    // Specific case handling for Switch Multilevel with V4 implementations.
    // In the V4 implementation, the level should be based on the target value
    // and not the level one.
    // See following docs:
    //  - Silabs  Application  Command Class Specification §4.72 - Multilevel Switch Command Class, version 4:
    //      https://www.silabs.com/documents/login/miscellaneous/SDS13781-Z-Wave-Application-Command-Class-Specification.pdf
    //  - OpenZwave 1.6 Update:
    //      https://github.com/OpenZWave/open-zwave/wiki/OpenZWave-1.6-Release-Notes#switchmultilevel-commandclass
  
    if (!supportsV4ZWaveSwitch(comClass)) {
      return valueChanged;
    }
  
    if (valueChanged.index === INDEXES.INDEX_SWITCH_MULTILEVEL_TARGET) {
      logger.debug('Target value identified. Setting the level value instead');
      const levelValue = comClass[INDEXES.INDEX_SWITCH_MULTILEVEL_LEVEL][valueChanged.instance];
  
      // Clone levelValue to the expected object to set.
      // We need to clone the object to avoid future side effect with object
      // in-memory.
      const updatedLevel = { ...levelValue };
      updatedLevel.value = valueChanged.value;
  
      return updatedLevel;
    }
  
    if (valueChanged.index === INDEXES.INDEX_SWITCH_MULTILEVEL_LEVEL) {
      // Ignore the value event
      logger.debug('Ignoring level');
  
      return null;
    }
  
    // It's not the LEVEL neither the TARGET value. Return as it.
    return valueChanged;
}

/**
 * @description Get the value following a value changed event.
 *
 * @param {number} comClassId - comClassId.
 * @param {Object} node - The node the value changed occurs.
 * @param {Object} valueChanged - The value changed.
 *
 * @returns {Object?} - The zWave value to update. NULL if change MUST be
 * prevented.
 *
 * @example
 *     const changedValue = getChangedValue(comClassId, node, value);
 */
 function getChangedValue(comClassId, node, valueChanged) {
     if (comClassId===COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL) {
         return getSwitchMultilevelChangedValue(node, valueChanged);
     }

    return valueChanged;
}
  

module.exports = {
    getChangedValue,
};
