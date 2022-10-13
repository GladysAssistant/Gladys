const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { slugify } = require('../../../../utils/slugify');
const { getCategory } = require('../utils/getCategory');
const { getUnit } = require('../utils/getUnit');
const { getDeviceFeatureExternalId, getDeviceExternalId, getDeviceName, getDeviceFeatureName } = require('../utils/externalId');
const logger = require('../../../../utils/logger');
const { unbindValue } = require('../utils/bindValue');
const { splitNode, splitNodeWithScene } = require('../utils/splitNode');

/**
 * @description Return array of Nodes.
 * @returns {Array} Return list of nodes.
 * @example
 * const nodes = zwaveManager.getNodes();
 */
function getNodes() {
  if (!this.mqttConnected) {
    throw new ServiceNotConfiguredError('ZWAVE_DRIVER_NOT_RUNNING');
  }
  const nodeIds = Object.keys(this.nodes);

  // transform object in array
  const nodes = nodeIds
    .map((nodeId) => this.nodes[nodeId])
    .flatMap((node) => splitNode(node))
    .flatMap((node) => splitNodeWithScene(node));

  // foreach node in RAM, we format it with the gladys device format
  return nodes
    .map((node) => {
      const newDevice = {
        name: getDeviceName(node),
        selector: slugify(`zwavejs2mqtt-node-${node.nodeId}-${getDeviceName(node)}`),
        model: `${node.product} ${node.firmwareVersion}`,
        service_id: this.serviceId,
        external_id: getDeviceExternalId(node),
        ready: node.ready,
        rawZwaveNode: {
          id: node.nodeId,
          type: node.type,
          product: node.product,
          keysClasses: Object.keys(node.classes),
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
            const { value } = properties[propertyKey];
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
                const valueUnbind = unbindValue(
                  {
                    commandClass,
                    endpoint,
                    property,
                  },
                  value,
                );
                newDevice.features.push({
                  name: getDeviceFeatureName({label, endpoint}),
                  selector: slugify(`zwavejs2mqtt-node-${node.nodeId}-${property}-${commandClass}-${endpoint}-${label}`),
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
                  `Unkown category/type for property ${JSON.stringify(properties[property])} of node ${
                    node.nodeId
                  }, product ${node.product}`,
                );
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

      return newDevice;
    })
    .sort(function sortByNodeReady(a, b) {
      return b.ready - a.ready || a.rawZwaveNode.id - b.rawZwaveNode.id;
    });
}

module.exports = {
  getNodes,
};
