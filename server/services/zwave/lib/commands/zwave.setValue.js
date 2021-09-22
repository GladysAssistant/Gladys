const logger = require('../../../../utils/logger');
const { getNodeInfoByExternalId } = require('../utils/externalId');
const { transformValue } = require('../utils/valueBinders');

/**
 * @description Set value.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The device feature to control.
 * @param {number} value - The value to set.
 * @example
 * zwave.setValue();
 */
function setValue(device, deviceFeature, value) {
  logger.debug(`Zwave : Setting value`);
  const { nodeId, comclass, index, instance } = getNodeInfoByExternalId(deviceFeature.external_id);
  const node = this.nodes[nodeId];
  if (!node) {
    return;
  }

  const transformedValue = transformValue(node, comclass, index, instance, value);

  logger.debug(
    `Zwave : Setting value for device ${deviceFeature.external_id} ` +
      `(nodeId=${nodeId},class_id=${comclass},instance=${instance},index=${index}` +
      `,type=${node.classes[comclass][index].type}) -> ${transformedValue} (from value ${value})`,
  );

  node.classes[comclass][index][instance].value = transformedValue;

  this.zwave.setValue(
    { node_id: nodeId, class_id: comclass, instance, index },
    node.classes[comclass][index][instance].value,
  );
}

module.exports = {
  setValue,
};
