const { DEVICE_FEATURE_TYPES, DEVICE_FUNCTION } = require('../../../utils/constants');

const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');

/**
 * @description Change value of a device
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @param {string|number} value - The new value.
 * @example
 * setValue(device, deviceFeature, value);
 */
async function setValue(device, deviceFeature, value) {

  const arduinoSelectorIndex = device.params.findIndex((param) => param.name === 'ARDUINO_LINKED');
  const arduinoSelector = device.params[arduinoSelectorIndex].value;
  const arduino = await this.gladys.device.getBySelector(arduinoSelector);
  const pathIndex = arduino.params.findIndex((param) => param.name === 'ARDUINO_PATH');
  const path = arduino.params[pathIndex].value;

  const functionName = device.params.find((param) => param.name === 'FUNCTION').value;

  var message = {
    function: functionName,
    parameters: {
      data_pin: device.params.find((param) => param.name === 'DATA_PIN').value,
    },
  };

  switch (functionName) {
    case DEVICE_FUNCTION.EMIT_433:
      message.parameters['code'] = device.params.find((param) => param.name === 'CODE').value;
      message.parameters['bit_length'] = device.params.find((param) => param.name === 'BIT_LENGTH').value;
      break;
    case DEVICE_FUNCTION.EMIT_IR:
      message.parameters['code'] = device.params.find((param) => param.name === 'CODE').value;
      break;
    default:
      break;
  }

  logger.debug(message);

  //Récupérer l'Arduino rattaché au device                                                    --OK
  //En récupérer son path                                                                     --OK
  //Créer le JSON, message qui sera à transmettre à l'Arduino
  //Appeler sendValue avec le path et le JSON

  /*logger.debug(`Changing state of light ${device.external_id} with value = ${value}`);
  const { lightId, bridgeSerialNumber } = parseExternalId(device.external_id);
  const hueApi = this.hueApisBySerialNumber.get(bridgeSerialNumber);
  if (!hueApi) {
    throw new NotFoundError(`HUE_API_NOT_FOUND`);
  }
  let state;
  switch (deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.LIGHT.BINARY:
      state = value === 1 ? new this.LightState().on() : new this.LightState().off();
      break;
    default:
      logger.debug(`Philips Hue : Feature type = "${deviceFeature.type}" not handled`);
      break;
  }
  await hueApi.lights.setLightState(lightId, state);*/
}

module.exports = {
  setValue,
};
