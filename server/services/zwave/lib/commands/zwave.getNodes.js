const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { slugify } = require('../../../../utils/slugify');
const { getCategory } = require('../utils/getCategory');
const { getUnit } = require('../utils/getUnit');
const { getDeviceFeatureExternalId } = require('../utils/externalId');
const { GENRES, UNKNOWN_CATEGORY } = require('../constants');
const { getCommandClass } = require('../comClass/factory');

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
        name: node.product,
        service_id: this.serviceId,
        external_id: `zwave:node_id:${node.id}`,
        ready: node.ready,
        rawZwaveNode: node,
        features: [],
        params: [],
      };

      const comclasses = Object.keys(node.classes);
      comclasses.forEach((comclass) => {
        const valuesClass = node.classes[comclass];
        const commandClass = getCommandClass(parseInt(comclass, 10));

        Object.keys(valuesClass).forEach((idx) => {
          const value = node.classes[comclass][idx];
          Object.keys(value).forEach((inst) => {
            const { min, max, step } = commandClass.getMinMax(node, comclass, idx, inst);

            if (value[inst].genre === GENRES.USER) {
              const { category, type } = getCategory(node, value[inst]);
              if (category !== UNKNOWN_CATEGORY) {
                newDevice.features.push({
                  name: `${value[inst].label}`,
                  selector: slugify(
                    `zwave-${value[inst].instance}-${value[inst].index}-${value[inst].label}-${node.product}-node-${node.id}`,
                  ),
                  category,
                  type,
                  external_id: getDeviceFeatureExternalId(value[inst]),
                  read_only: value[inst].read_only,
                  unit: getUnit(value[inst].units),
                  has_feedback: true,
                  min,
                  max,
                  step,
                });
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
