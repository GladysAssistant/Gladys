const logger = require('../../../../utils/logger');
const { getNodeInfoByExternalId } = require('../utils/externalId');
const { getCommandClass } = require('../comClass/factory');

/**
 * @description Set value.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The device feature to control.
 * @param {number} value - The value to set.
 * @example
 * zwave.setValue();
 */
function setValue(device, deviceFeature, value) {
  const { nodeId, comclass, index, instance } = getNodeInfoByExternalId(deviceFeature.external_id);
  const node = this.nodes[nodeId];
  if (!node) {
    return;
  }

  logger.debug(`Zwave : Setting value ${deviceFeature.external_id} -> ${value}`);

  node.classes[comclass][index].value = getCommandClass(comclass).getTransformedValue(
    node,
    comclass,
    index,
    instance,
    value,
  );

  this.zwave.setValue({ node_id: nodeId, class_id: comclass, instance, index }, node.classes[comclass][index].value);
}

module.exports = {
  setValue,
};
