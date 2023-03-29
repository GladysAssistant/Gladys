const { slugify } = require('../../../../utils/slugify');
const { getCategory } = require('../utils/getCategory');
const { getUnit } = require('../utils/getUnit');
const {
  getDeviceFeatureExternalId,
  getDeviceExternalId,
  getDeviceName,
  getDeviceFeatureName,
} = require('../utils/externalId');
const logger = require('../../../../utils/logger');
const { unbindValue } = require('../utils/bindValue');
const { splitNode } = require('../utils/splitNode');
const { transformClasses } = require('../utils/transformClasses');

/**
 * @description Check if keyword matches value.
 * @param {string} value - Value to check.
 * @param {string} keyword - Keyword to match.
 * @returns {boolean} True if keyword matches value.
 * @example
 * const res = zwaveManager.match('test', 'te');
 */
function match(value, keyword) {
  return value ? value.toLowerCase().includes(keyword.toLowerCase()) : true;
}

/**
 * @description Return array of Nodes.
 * @param {Object} options - Filtering, ordering.
 * @returns {Array} Return list of nodes.
 * @example
 * const nodes = zwaveManager.getNodes();
 */
function getNodes({ orderDir, search } = {}) {
  const nodeIds = Object.keys(this.nodes);

  // transform object in array
  const nodes = nodeIds.map((nodeId) => this.nodes[nodeId]).flatMap((node) => splitNode(node));
  return nodes
    .filter((node) =>
      search
        ? match(node.name, search) ||
          match(node.productLabel, search) ||
          match(node.productDescription, search) ||
          match(node.nodeId.toString(), search)
        : true,
    )
    .map((node) => {
      const newDevice = {
        name: getDeviceName(node),
        selector: slugify(`zwave-js-ui-node-${node.nodeId}-${getDeviceName(node)}`),
        model: `${node.product} ${node.firmwareVersion}`,
        service_id: this.serviceId,
        external_id: getDeviceExternalId(node),
        ready: node.ready,
        rawZwaveNode: {
          id: node.nodeId,
          product: node.product,
          loc: node.loc,
          keysClasses: Object.keys(node.classes),
        },
        features: [],
        params: [],
      };

      Object.entries(transformClasses(node)).forEach(([commandClassKey, commandClassValue]) => {
        Object.entries(commandClassValue).forEach(([endpointKey, endpointValue]) => {
          Object.entries(endpointValue).forEach(([propertyKey, propertyValue]) => {
            const {
              property,
              genre,
              label,
              type: propertyType,
              unit,
              commandClass,
              endpoint,
              writeable,
            } = propertyValue;
            let { min, max } = propertyValue;
            const { value } = propertyValue;
            if (genre === 'user') {
              const { category, type, min: categoryMin, max: categoryMax, hasFeedback, prefLabel } = getCategory(node, {
                commandClass,
                endpoint,
                property,
              });
              if (category !== 'unknown') {
                if (min === undefined) {
                  min = propertyType === 'boolean' ? 0 : categoryMin;
                }
                if (max === undefined) {
                  max = propertyType === 'boolean' ? 1 : categoryMax;
                }
                const valueUnbind = unbindValue(
                  {
                    commandClass,
                    endpoint,
                    property,
                  },
                  value,
                );
                newDevice.features.push({
                  name: getDeviceFeatureName({ label, prefLabel, endpoint }),
                  selector: slugify(`zwave-js-ui-node-${node.nodeId}-${property}-${commandClass}-${endpoint}-${label}`),
                  category,
                  type,
                  external_id: getDeviceFeatureExternalId({ nodeId: node.nodeId, commandClass, endpoint, property }),
                  read_only: !writeable,
                  unit: getUnit(unit),
                  has_feedback: hasFeedback,
                  min,
                  max,
                  last_value: valueUnbind,
                });
              } else {
                logger.info(
                  `Unkown category/type for property ${JSON.stringify(propertyValue)} of node ${node.nodeId}, product ${
                    node.product
                  }`,
                );
              }
            } else {
              newDevice.params.push({
                name: slugify(`${endpointKey}-${label}-${propertyValue.value_id}`),
                value: propertyValue.value || '',
              });
            }
          });
        });
      });

      return newDevice;
    })
    .sort((a, b) => {
      return orderDir === 'asc'
        ? b.ready - a.ready || a.rawZwaveNode.id - b.rawZwaveNode.id
        : a.ready - b.ready || b.rawZwaveNode.id - a.rawZwaveNode.id;
    });
}

module.exports = {
  getNodes,
};