const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { slugify } = require('../../../../utils/slugify');
const { getCategory } = require('../utils/getCategory');
const { getUnit } = require('../utils/getUnit');
const { getDeviceFeatureExternalId, getDeviceExternalId } = require('../utils/externalId');
const logger = require('../../../../utils/logger');

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
    .map((node) => {
      const newDevice = {
        name: node.name,
        service_id: this.serviceId,
        external_id: getDeviceExternalId({ nodeId: node.id }),
        ready: node.ready,
        rawZwaveNode: {
          id: node.id,
          type: node.type,
          manufacturer: node.manufacturer,
          product: node.product,
          producttype: node.producttype,
          productid: node.productid,
          keysClasses: Object.keys(node.classes),
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
                  name: `${value[inst].label}`,
                  selector: slugify(
                    `zwave-${value[inst].property}-${value[inst].endpoint}-${value[inst].label}-${node.product}-node-${node.id}`,
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
              } else if (
                value[inst].commandClass !== 112 &&
                value[inst].commandClass !== 114 &&
                value[inst].commandClass !== 134
              ) {
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
