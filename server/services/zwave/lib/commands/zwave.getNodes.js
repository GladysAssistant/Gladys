const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { slugify } = require('../../../../utils/slugify');
const { getCategory } = require('../utils/getCategory');
const { getUnit } = require('../utils/getUnit');
const { getMinMax } = require('../utils/getMinMax');
const { getDeviceFeatureExternalId } = require('../utils/externalId');
const { GENRES, UNKNOWN_CATEGORY } = require('../constants');

/**
 * @description Parse a instance value to fill the device data.
 *
 * @param {Object} device - Device to store parsed data.
 * @param {Object} node - The zWave node infos.
 * @param {string} comClass - The commandClass number.
 * @param {string} idx - CommandClass Index.
 * @param {string} inst - Index Instance.
 *
 * @returns {undefined}
 *
 * @example
 * processInstance(device, node, comClass, idx, '1');
 */
function processInstance(device, node, comClass, idx, inst) {
  const value = node.classes[comClass][idx][inst];
  if (value.genre !== GENRES.USER) {
    device.params.push({
      name: slugify(`${value.label}-${value.value_id}`),
      value: value.value || '',
    });

    return;
  }

  const { min, max } = getMinMax(node, parseInt(comClass, 10), parseInt(idx, 10), parseInt(inst, 10));
  const { category, type } = getCategory(node, value);
  if (category === UNKNOWN_CATEGORY) {
    return;
  }

  device.features.push({
    name: `${value.label}`,
    selector: slugify(`zwave-${inst}-${idx}-${value.label}-${node.product}-node-${node.id}`),
    category,
    type,
    external_id: getDeviceFeatureExternalId(value),
    read_only: value.read_only,
    unit: getUnit(value.units),
    has_feedback: true,
    min,
    max
  });
}

/**
 * @description Parse all instances for the given index and
 * fill the device data.
 *
 * @param {Object} device - Device to store parsed data.
 * @param {Object} node - The zWave node infos.
 * @param {string} comClass - The commandClass number.
 * @param {string} idx - CommandClass Index.
 *
 * @example
 * processInstances(device, node, comClass, '1');
 */
function processInstances(device, node, comClass, idx) {
  Object.keys(node.classes[comClass][idx]).forEach((inst) => {
    processInstance(device, node, comClass, idx, inst);
  });
}

/**
 * @description Parses all indexes for the given comClass and fill the device
 * data.
 *
 * @param {Object} device - Device to store parsed data.
 * @param {Object} node - The zWave node infos.
 * @param {string} comClass - The commandClass number.
 *
 * @example
 * processIndexes(device, node, '38');
 */
function processIndexes(device, node, comClass) {
  Object.keys(node.classes[comClass]).forEach((idx) => {
    processInstances(device, node, comClass, idx);
  });
}

/**
 * @description Create a device from infos of node.
 *
 * @param {Object} node - The node to parse.
 * @param {string} serviceId - The zWave Manager serviceId.
 * @returns {Object} The parsed Device.
 *
 * @example
 * const device = createDeviceFromNode(node);
 */
function createDeviceFromNode(node, serviceId) {
  const newDevice = {
    name: node.product,
    service_id: serviceId,
    external_id: `zwave:node_id:${node.id}`,
    ready: node.ready,
    rawZwaveNode: node,
    features: [],
    params: [],
  };

  Object.keys(node.classes).forEach((comClass) => {
    processIndexes(newDevice, node, comClass);
  });

  return newDevice;
}

/**
 * @description Return array of Nodes.
 * @returns {Array} Return list of nodes.
 * @example
 * const nodes = zwaveManager.getNodes();
 */
function getNodes() {
  if (!this.connected) {
    throw new ServiceNotConfiguredError('ZWAVE_DRIVER_NOT_RUNNING');
  }
  const nodeIds = Object.keys(this.nodes);

  // transform object in array
  const nodes = nodeIds.map((nodeId) => Object.assign({}, { id: nodeId }, this.nodes[nodeId]));

  // foreach node in RAM, we format it with the gladys device format
  return nodes
    .map((node) => createDeviceFromNode(node, this.serviceId))
    .sort(function sortByNodeReady(a, b) {
      return b.ready - a.ready || a.rawZwaveNode.id - b.rawZwaveNode.id;
    });
}

module.exports = {
  getNodes,
};
