const uuid = require('uuid');
const get = require('get-value');
const {
  EVENTS,
  ACTIONS,
  ACTIONS_STATUS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
} = require('../../../utils/constants');
const { BadParameters } = require('../../../utils/coreErrors');

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
      value = directiveName === 'TurnOn' ? 1 : 0;
      break;
    default:
      throw new BadParameters(`Unkown directive ${directiveName}`);
  }
  const action = {
    type: ACTIONS.DEVICE.SET_VALUE,
    status: ACTIONS_STATUS.PENDING,
    value,
    device: endpointId,
    feature_category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    feature_type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
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
      context: {
        properties: [
          {
            namespace: 'Alexa.PowerController',
            name: 'powerState',
            value: value === 1 ? 'ON' : 'OFF',
            timeOfSample: new Date().toISOString(),
            uncertaintyInMilliseconds: 500,
          },
        ],
      },
    },
  };
  return response;
}

module.exports = {
  onExecute,
};
