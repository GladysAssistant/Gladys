const uuid = require('uuid');
const get = require('get-value');
const { EVENTS, ACTIONS, ACTIONS_STATUS } = require('../../../utils/constants');
const { BadParameters, NotFoundError } = require('../../../utils/coreErrors');
const { writeValues, readValues } = require('./deviceMappings');

/**
 * @public
 * @param {Object} body - The body of the request.
 * @description Returns response.
 * @example
 * onExecute();
 */
function onExecute(body) {
  const directiveNamespace = get(body, 'directive.header.namespace');
  const directiveName = get(body, 'directive.header.name');
  const endpointId = get(body, 'directive.endpoint.endpointId');
  const correlationToken = get(body, 'directive.header.correlationToken');
  let value;
  switch (directiveNamespace) {
    case 'Alexa.PowerController':
      value = writeValues['Alexa.PowerController'](directiveName);
      break;
    default:
      throw new BadParameters(`Unkown directive ${directiveNamespace}`);
  }
  const deviceFeatureInMemory = this.gladys.stateManager.get('deviceFeature', endpointId);
  if (!deviceFeatureInMemory) {
    throw new NotFoundError(`Device "${endpointId}" not found`);
  }
  const action = {
    type: ACTIONS.DEVICE.SET_VALUE,
    status: ACTIONS_STATUS.PENDING,
    value,
    device: endpointId,
    feature_category: deviceFeatureInMemory.category,
    feature_type: deviceFeatureInMemory.type,
  };
  this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
  const response = {
    event: {
      header: {
        namespace: 'Alexa',
        name: 'Response',
        payloadVersion: '3',
        messageId: uuid.v4(),
        correlationToken,
      },
      endpoint: body.directive.endpoint,
      payload: {},
    },
    context: {
      properties: [
        {
          namespace: 'Alexa.PowerController',
          name: 'powerState',
          value: readValues[deviceFeatureInMemory.category][deviceFeatureInMemory.type](value),
          timeOfSample: new Date().toISOString(),
          uncertaintyInMilliseconds: 500,
        },
      ],
    },
  };
  return response;
}

module.exports = {
  onExecute,
};
