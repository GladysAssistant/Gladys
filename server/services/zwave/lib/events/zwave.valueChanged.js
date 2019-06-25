const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { getDeviceFeatureExternalId } = require('../utils/externalId');

/**
 * @description When a value changed.
 * @param {number} nodeId - The ID of the node.
 * @param {number} comClass - Zwave comclass.
 * @param {Object} value - The value.
 * @example
 * zwave.on('value changed', this.valueChanged);
 */
function valueChanged(nodeId, comClass, value) {
  logger.debug(`Zwave : Value Changed, nodeId = ${nodeId}, comClass = ${comClass}, value = ${JSON.stringify(value)}`);
  if (this.nodes[nodeId].ready) {
    logger.debug(
      'node%d: changed: %d:%s:%s->%s',
      nodeId,
      comClass,
      value.label,
      this.nodes[nodeId].classes[comClass][value.index].value,
      value.value,
    );
    this.nodes[nodeId].classes[comClass][value.index] = value;
    this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: getDeviceFeatureExternalId(value),
      state: value.value,
    });
  }
}

module.exports = {
  valueChanged,
};
