const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { slugify } = require('../../../../utils/slugify');
const { getCategory } = require('../utils/getCategory');
const { getUnit } = require('../utils/getUnit');
const { getDeviceFeatureExternalId, getDeviceExternalId, getDeviceName } = require('../utils/externalId');

/**
 * @description Split Node into each endpoints.
 * @param {Object} node - Z-Wave node .
 * @returns {Array} Splitted nodes.
 * @example
 * const nodes = zwaveManager.splitNode({});
 */
function splitNode(node) {
  if (node.endpoints.length < 2) {
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
      // logger.info(`{"id":"${node.nodeId}","classes":${JSON.stringify(node.classes)}}`);

      const newDevice = {
        name: getDeviceName(node),
        model: `${node.product} ${node.firmwareVersion}`,
        service_id: this.serviceId,
        external_id: getDeviceExternalId(node),
        ready: node.ready,
        rawZwaveNode: {
          id: node.nodeId,
          type: node.type,
          product: node.product,
          keysClasses: Object.keys(node.classes),
          // classes: node.classes, If set, HTTP 413 - Request entity too loarge
          deviceDatabaseUrl: node.deviceDatabaseUrl,
        },
        features: [],
        params: [],
      };

      Object.keys(node.classes).forEach((commandClassKey) => {
        Object.keys(node.classes[commandClassKey]).forEach((endpointKey) => {
          const properties = node.classes[commandClassKey][endpointKey];
          Object.keys(properties).forEach((propertyKey) => {
            const { property, genre, label, type: propertyType, unit, commandClass, endpoint, writeable } = properties[
              propertyKey
            ];
            let { min, max } = properties[propertyKey];
            if (genre === 'user') {
              const { category, type, min: categoryMin, max: categoryMax, hasFeedback } = getCategory(node, {
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
                newDevice.features.push({
                  name: label,
                  selector: slugify(`zwave-node-${node.nodeId}-${property}-${commandClass}-${endpoint}-${label}`),
                  category,
                  type,
                  external_id: getDeviceFeatureExternalId({ nodeId: node.nodeId, commandClass, endpoint, property }),
                  read_only: !writeable,
                  unit: getUnit(unit),
                  has_feedback: hasFeedback,
                  min,
                  max,
                });
              } else {
                // logger.info(`Unkown category/type for ${JSON.stringify(properties[property])}`);
              }
            } else {
              newDevice.params.push({
                name: slugify(`${endpointKey}-${label}-${properties[propertyKey].value_id}`),
                value: properties[propertyKey].value || '',
              });
            }
          });
        });
      });

      // logger.info(`{"id":"${node.nodeId}","features":${JSON.stringify(newDevice.features)}}`);

      return newDevice;
    })
    .sort(function sortByNodeReady(a, b) {
      return b.ready - a.ready || a.rawZwaveNode.id - b.rawZwaveNode.id;
    });
}

module.exports = {
  getNodes,
};
