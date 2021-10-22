const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { slugify } = require('../../../../utils/slugify');
const { getCategory } = require('../utils/getCategory');
const { getUnit } = require('../utils/getUnit');
const { getDeviceFeatureExternalId, getDeviceExternalId, getDeviceName } = require('../utils/externalId');
const logger = require('../../../../utils/logger');

/**
 * @description Split Node into each endpoints.
 * @param {Object} node - Z-Wave node .
 * @returns {Array} Splitted nodes.
 * @example
 * const nodes = zwaveManager.splitNode({});
 */
function splitNode(node) {
  if (node.endpoints.length === 1) {
    node.endpoint = 0;
    return node;
  }
  return node.endpoints.map((endpoint) => {
    const eNode = Object.assign({}, node);
    eNode.endpoint = endpoint.index;
    eNode.classes = {};
    Object.keys(node.classes).forEach((comclass) => {
      const valuesClass = node.classes[comclass];
      if (valuesClass[endpoint.index]) {
        eNode.classes[comclass] = {};
        eNode.classes[comclass][endpoint.index] = valuesClass[endpoint.index];
      }
    });
    return eNode;
  });
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
  const nodes = nodeIds.map((nodeId) => this.nodes[nodeId]).flatMap((node) => splitNode(node));
  // foreach node in RAM, we format it with the gladys device format
  return nodes
    .map((node) => {
      const newDevice = {
        name: getDeviceName(node),
        service_id: this.serviceId,
        external_id: getDeviceExternalId(node),
        ready: node.ready,
        rawZwaveNode: {
          id: node.id,
          type: node.type,
          product: node.product,
          keysClasses: Object.keys(node.classes),
          deviceDatabaseUrl: node.deviceDatabaseUrl,
        },
        features: [],
        params: [],
      };

      const comclasses = Object.keys(node.classes);
      comclasses.forEach((comclass) => {
        const valuesClass = node.classes[comclass];
        const endpoints = Object.keys(valuesClass);
        endpoints.forEach((endpoint) => {
          const value = node.classes[comclass][endpoint];
          const properties = Object.keys(value);
          properties.forEach((inst) => {
            const { min, max } = value[inst];
            if (value[inst].genre === 'user') {
              const { category, type } = getCategory(node, value[inst]);
              if (category !== 'unknown') {
                newDevice.features.push({
                  name: value[inst].label,
                  selector: slugify(
                    `zwave-${value[inst].property}-${value[inst].endpoint}-${value[inst].label}-${node.product}-node-${node.nodeId}`,
                  ),
                  category,
                  type,
                  external_id: getDeviceFeatureExternalId(value[inst]),
                  read_only: value[inst].read_only,
                  unit: getUnit(value[inst].units),
                  has_feedback: true,
                  min,
                  max,
                });
              } else {
                logger.info(`Unkown category/type for ${JSON.stringify(value[inst])}`);
              }
            } else {
              newDevice.params.push({
                name: slugify(`${value[inst].label}-${value[inst].value_id}`),
                value: value[inst].value || '',
              });
            }
          });
        });
      });
      return newDevice;
    })
    .sort(function sortByNodeReady(a, b) {
      return b.ready - a.ready || a.rawZwaveNode.id - b.rawZwaveNode.id;
    });
}

module.exports = {
  getNodes,
};
