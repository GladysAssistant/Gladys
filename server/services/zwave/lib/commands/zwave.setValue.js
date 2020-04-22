const logger = require('../../../../utils/logger');
const { getNodeInfoByExternalId } = require('../utils/externalId');

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
  if (null === node) {
    return;
  }
  
  logger.debug(`Zwave : Setting value`, {deviceFeature, value});
  node['classes'][comclass][index].value = transformValueForNode(node, comclass, index, value);
  this.zwave.setValue({ node_id: nodeId, class_id: comclass, instance, index }, node['classes'][comclass][index].value);
}

const transformValueHandlers = {
  'bool': (nodeValue, value) => !!value, // Send to zWave a real boolean value
};

/**
 * @description Tranform the value to the right format for the targetted node.
 * @param {Object} node - Targetted node
 * @param {number} comclass - Comclass of the value to change
 * @param {number} index - Index of the value to change
 * @param {any} value - Value coming from userland (Gladys UI)
 */
function transformValueForNode(node, comclass, index, value) {
  const nodeValue = node['classes'][comclass][index];
  if (!transformValueHandlers.hasOwnProperty(nodeValue.type)) {
    return value;
  }

  return transformValueHandlers[nodeValue.type](nodeValue, value);
}

module.exports = {
  setValue,
};
