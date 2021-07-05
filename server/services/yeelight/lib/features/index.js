const { flatten, intersection, isEmpty } = require('lodash');
const { DEVICE_POLL_FREQUENCIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { DEVICE_EXTERNAL_ID_BASE, DEVICE_IP_ADDRESS, DEVICE_PORT_ADDRESS } = require('../utils/constants');

// Features
const binaryFeature = require('./binary');
const brightnessFeature = require('./brightness');
const temperatureFeature = require('./temperature');
const colorFeature = require('./color');

const AVAILABLE_FEATURE_MODELS = {
  binary: {
    id: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    capabilities: ['set_power'],
    feature: binaryFeature,
  },
  brightness: {
    id: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    capabilities: ['set_bright'],
    feature: brightnessFeature,
  },
  temperature: {
    id: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
    capabilities: ['set_ct_abx'],
    feature: temperatureFeature,
  },
  color: {
    id: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    capabilities: ['set_rgb', 'set_hsv'],
    feature: colorFeature,
  },
};

const getDeviceModel = (device) => {
  switch (device.model) {
    case 'mono':
      return 'White';
    case 'color':
      return 'RGBW';
    case 'stripe':
      return 'Stripe';
    case 'ceiling1':
      return 'Ceiling';
    case 'ceiling':
      return 'Ceiling color';
    case 'bslamp1':
    case 'bslamp':
      return 'Bedside';
    case 'desklamp':
      return 'Desklamp';
    case 'ct_bulb':
      return 'Color';
    default:
      return 'Unknown';
  }
};

const getDeviceName = (device) => {
  const modelName = getDeviceModel(device);
  return device.name || `Yeelight ${modelName}`;
};

/**
 * @description Get the external ID of the Yeelight device.
 * @param {Object} device - The Yeelight device.
 * @returns {string} Return the external ID of the Gladys device.
 * @example
 * getExternalId(device, 1);
 */
function getExternalId(device) {
  return [DEVICE_EXTERNAL_ID_BASE, device.id].join(':');
}

/**
 * @description Parse the external ID of the Gladys device.
 * @param {string} externalId - External ID of the Gladys device.
 * @returns {Object} Return the prefix, the device ID and the type.
 * @example
 * parseExternalId('yeelight:0x00000000035ac142:power');
 */
function parseExternalId(externalId) {
  const [prefix, deviceId, type] = externalId.split(':');
  return { prefix, deviceId, type };
}

/**
 * @description Create an Yeelight device for Gladys.
 * @param {string} serviceId - The UUID of the service.
 * @param {Object} device - The Yeelight device.
 * @returns {Object} Return Gladys device.
 * @example
 * getDevice(serviceId, device, channel);
 */
function getDevice(serviceId, device) {
  const name = getDeviceName(device);
  const modelName = getDeviceModel(device);
  const externalId = getExternalId(device);

  const isUnhandled = isEmpty(
    intersection(
      flatten(Object.keys(AVAILABLE_FEATURE_MODELS).map((feature) => AVAILABLE_FEATURE_MODELS[feature].capabilities)),
      device.capabilities,
    ),
  );

  const createdDevice = {
    name,
    model: modelName,
    external_id: externalId,
    selector: externalId,
    should_poll: false,
    features: [],
    service_id: serviceId,
    params: [
      {
        name: DEVICE_IP_ADDRESS,
        value: device.host || '?.?.?.?',
      },
      {
        name: DEVICE_PORT_ADDRESS,
        value: device.port || '?',
      },
    ],
  };

  if (isUnhandled) {
    createdDevice.model = 'unhandled';
    createdDevice.not_handled = true;
    createdDevice.raw_yeelight_device = device;
  } else {
    createdDevice.should_poll = true;
    createdDevice.poll_frequency = DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS;

    Object.keys(AVAILABLE_FEATURE_MODELS).forEach((feature) => {
      const hasFeature = !isEmpty(intersection(AVAILABLE_FEATURE_MODELS[feature].capabilities, device.capabilities));
      if (hasFeature) {
        const featureExternalId = [externalId, AVAILABLE_FEATURE_MODELS[feature].id].join(':');
        const deviceFeature = {
          ...AVAILABLE_FEATURE_MODELS[feature].feature.generateFeature(name),
          external_id: featureExternalId,
          selector: featureExternalId,
        };

        logger.debug(`Yeelight: Add feature "${feature}" to device "${device.id}"`);
        createdDevice.features.push(deviceFeature);
      }
    });
  }

  return createdDevice;
}

module.exports = {
  getExternalId,
  parseExternalId,
  getDevice,
};
