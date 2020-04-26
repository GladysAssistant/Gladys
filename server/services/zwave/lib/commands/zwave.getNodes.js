const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { slugify } = require('../../../../utils/slugify');
const { getCategory } = require('../utils/getCategory');
const { getUnit } = require('../utils/getUnit');
const { getDeviceFeatureExternalId } = require('../utils/externalId');

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
  return nodes.map((node) => {
    const newDevice = {
      name: node.product,
      service_id: this.serviceId,
      external_id: `zwave:node_id:${node.id}`,
      ready: node.ready,
      rawZwaveNode: {
        id: node.id,
        manufacturer: node.manufacturer,
        type: node.type,
      },
      features: [],
      params: [],
    };

    const comclasses = Object.keys(node.classes);
    comclasses.forEach((comclass) => {
      const valuesClass = node.classes[comclass];   
      const indexes = Object.keys(valuesClass);
      indexes.forEach((idx) => {
        const value = node.classes[comclass][idx]; 
        const instances = Object.keys(value);
        instances.forEach((inst) => {
          const { min, max } = value[inst];
          if (value[inst].genre === 'user') {
            const { category, type } = getCategory(node, value[inst]);
            if (category !== 'unknown') {
              newDevice.features.push({
                name: (`${value[inst].label}`),
                selector: slugify(`zwave-${value[inst].instance}-${value[inst].index}-${value[inst].label}-${node.product}-node-${node.id}`),
                category,
                type,
                external_id: getDeviceFeatureExternalId(value[inst]),
                read_only: value[inst].read_only,
                unit: getUnit(value[inst].units),
                has_feedback: true,
                min,
                max,
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
  });
}

module.exports = {
  getNodes,
};
