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
  let nodes = nodeIds.map((nodeId) => Object.assign({}, { id: nodeId }, this.nodes[nodeId]));

  // remove non-ready nodes
  nodes = nodes.filter((node) => node.ready === true);

  // foreach node in RAM, we format it with the gladys device format
  return nodes.map((node) => {
    const newDevice = {
      name: node.product,
      service_id: this.serviceId,
      external_id: `zwave:node_id:${node.id}`,
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
      const values = node.classes[comclass];
      const indexes = Object.keys(values);
      indexes.forEach((idx) => {
        const { min, max } = values[idx];

        if (values[idx].genre === 'user') {
          const { category, type } = getCategory(node, values[idx]);
          if (category !== 'unknown') {
            newDevice.features.push({
              name: values[idx].label,
              selector: slugify(`zwave-${values[idx].label}-${node.product}-node-${node.id}`),
              category,
              type,
              external_id: getDeviceFeatureExternalId(values[idx]),
              read_only: values[idx].read_only,
              unit: getUnit(values[idx].units),
              has_feedback: true,
              min,
              max,
            });
          }
        } else {
          newDevice.params.push({
            name: slugify(`${values[idx].label}-${values[idx].value_id}`),
            value: values[idx].value || '',
          });
        }
      });
    });
    return newDevice;
  });
}

module.exports = {
  getNodes,
};
