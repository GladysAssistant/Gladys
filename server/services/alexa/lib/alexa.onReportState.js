const uuid = require('uuid');
const get = require('get-value');

const { mappings, readValues } = require('./deviceMappings');
const { NotFoundError } = require('../../../utils/coreErrors');

/**
 * @public
 * @param {object} body - The body of the request.
 * @description Returns response.
 * @returns {object} Return report state response.
 * @example
 * onReportState();
 */
function onReportState(body) {
  const deviceSelector = get(body, 'directive.endpoint.endpointId');
  const device = this.gladys.stateManager.get('device', deviceSelector);
  if (!device) {
    throw new NotFoundError(`Device "${deviceSelector}" not found`);
  }
  const properties = [];
  const now = new Date().toISOString();
  device.features.forEach((feature) => {
    const func = get(readValues, `${feature.category}.${feature.type}`);
    const mapping = get(mappings, `${feature.category}.capabilities.${feature.type}`);
    if (func && mapping && feature.read_only === false) {
      properties.push({
        namespace: mapping.interface,
        name: get(mapping, 'properties.supported.0.name'),
        value: func(feature.last_value, feature),
        timeOfSample: now,
        uncertaintyInMilliseconds: 0,
      });
    }
  });
  const response = {
    event: {
      header: { ...body.directive.header, name: 'StateReport', messageId: uuid.v4() },
      endpoint: body.directive.endpoint,
      payload: {},
    },
    context: {
      properties,
    },
  };
  return response;
}

module.exports = {
  onReportState,
};
