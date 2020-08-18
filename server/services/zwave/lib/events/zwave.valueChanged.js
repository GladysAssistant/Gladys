const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { getDeviceFeatureExternalId } = require('../utils/externalId');
const { getMode } = require('../utils/getMode');
const { VALUE_MODES } = require('../constants');
const { getCommandClass } = require('../comClass/factory');

/**
 * @description When a value changed, update the in-memory node
 * if necessary.
 *
 * @param {number} nodeId - ID of the node.
 * @param {number} comClass - ZWave comClass.
 * @param {Object} value - The zWave value changed.
 * @returns {undefined}
 *
 * @example
 * zwave.on('value changed', this.valueChanged);
 */
function valueChanged(nodeId, comClass, value) {
  logger.debug(
    `Zwave : Value Changed, nodeId = ${nodeId}, comClass = ${comClass}, index = ${value.index}, instance = ${value.instance}, value = ${value.value}`,
  );
  const node = this.nodes[nodeId];
  if (!node.ready) {
    return;
  }

  const commandClass = getCommandClass(comClass);
  const changedValue = commandClass.getChangedValue(node, value);

  if (changedValue === null) {
    logger.debug('No matching changedValue.');
    return;
  }

  // If the value is the same as the one in memory, don't do anything except if READ only.
  if (node.classes[comClass][changedValue.index].value === changedValue.value) {
    if (getMode(changedValue) !== VALUE_MODES.READ_ONLY) {
      logger.debug('Ignoring change. Memory already in sync.');

      return;
    }
  }

  node.classes[comClass][changedValue.index] = changedValue;
  this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: getDeviceFeatureExternalId(changedValue),
    state: changedValue.value,
  });
}

module.exports = {
  valueChanged,
};
