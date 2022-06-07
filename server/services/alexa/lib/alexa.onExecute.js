const uuid = require('uuid');
const get = require('get-value');
const {
  EVENTS,
  ACTIONS,
  ACTIONS_STATUS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
} = require('../../../utils/constants');
const { DIRECTIVE_NAMESPACES } = require('./alexa.constants');
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
  let nameOfAlexaFeature;
  const deviceInMemory = this.gladys.stateManager.get('device', endpointId);
  if (!deviceInMemory) {
    throw new NotFoundError(`Device "${endpointId}" not found`);
  }
  let deviceFeature;
  let brightnessDeviceFeature;
  let binaryDeviceFeature;

  const controlPower = (category, binaryValue) => {
    const action = {
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: binaryValue,
      device: endpointId,
      feature_category: category,
      feature_type: 'binary',
    };
    this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
  };

  const setBrightness = (brightness) => {
    const action = {
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: brightness,
      device: endpointId,
      feature_category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      feature_type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    };
    this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
  };

  switch (directiveNamespace) {
    case DIRECTIVE_NAMESPACES.PowerController:
      deviceFeature = deviceInMemory.features.find(
        (f) =>
          (f.category === DEVICE_FEATURE_CATEGORIES.SWITCH || f.category === DEVICE_FEATURE_CATEGORIES.LIGHT) &&
          f.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      );
      value = writeValues[DIRECTIVE_NAMESPACES.PowerController](directiveName);

      if (deviceFeature.category === DEVICE_FEATURE_CATEGORIES.LIGHT) {
        brightnessDeviceFeature = deviceInMemory.features.find(
          (f) => f.category === DEVICE_FEATURE_CATEGORIES.LIGHT && f.type === DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
        );

        // if light is turned on, but brightness is 0, put to 100
        if (brightnessDeviceFeature && brightnessDeviceFeature.last_value === 0 && value === 1) {
          setBrightness(100);
        }
      }
      nameOfAlexaFeature = 'powerState';
      break;
    case DIRECTIVE_NAMESPACES.BrightnessController:
      binaryDeviceFeature = deviceInMemory.features.find(
        (f) =>
          (f.category === DEVICE_FEATURE_CATEGORIES.SWITCH || f.category === DEVICE_FEATURE_CATEGORIES.LIGHT) &&
          f.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      );
      deviceFeature = deviceInMemory.features.find(
        (f) => f.category === DEVICE_FEATURE_CATEGORIES.LIGHT && f.type === DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
      );
      value = writeValues[DIRECTIVE_NAMESPACES.BrightnessController](
        directiveName,
        get(body, 'directive.payload'),
        deviceFeature.last_value,
        binaryDeviceFeature.last_value,
      );
      nameOfAlexaFeature = 'brightness';
      // if the brightness is set to 0, turn off the light
      if (value === 0) {
        controlPower(deviceFeature.category, 0);
      } else {
        // if the brightness is set to something positive, make
        // sure the light is on
        controlPower(deviceFeature.category, 1);
      }
      break;
    case DIRECTIVE_NAMESPACES.ColorController:
      deviceFeature = deviceInMemory.features.find(
        (f) => f.category === DEVICE_FEATURE_CATEGORIES.LIGHT && f.type === DEVICE_FEATURE_TYPES.LIGHT.COLOR,
      );
      value = writeValues[DIRECTIVE_NAMESPACES.ColorController](get(body, 'directive.payload.color'));
      nameOfAlexaFeature = 'color';
      // Make sure the light is on if we change the light color
      controlPower(deviceFeature.category, 1);
      break;
    default:
      throw new BadParameters(`Unkown directive ${directiveNamespace}`);
  }

  const action = {
    type: ACTIONS.DEVICE.SET_VALUE,
    status: ACTIONS_STATUS.PENDING,
    value,
    device: endpointId,
    feature_category: deviceFeature.category,
    feature_type: deviceFeature.type,
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
          namespace: directiveNamespace,
          name: nameOfAlexaFeature,
          value: readValues[deviceFeature.category][deviceFeature.type](value),
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
