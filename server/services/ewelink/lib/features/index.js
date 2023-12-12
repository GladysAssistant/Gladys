const logger = require('../../../../utils/logger');
const { titleize } = require('../../../../utils/titleize');
const { readParams } = require('../params');
const { getExternalId } = require('../utils/externalId');

// Features
const binaryFeature = require('./binary');
const humidityFeature = require('./humidity');
const temperatureFeature = require('./temperature');

const AVAILABLE_FEATURES = [binaryFeature, humidityFeature, temperatureFeature];

const AVAILABLE_FEATURE_MODELS = {
  binary: {
    uiid: [1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 15],
    feature: binaryFeature,
  },
  humidity: {
    uiid: [15],
    feature: humidityFeature,
  },
  temperature: {
    uiid: [15],
    feature: temperatureFeature,
  },
};

const getDeviceName = (device) => {
  const name =
    device.name !== ''
      ? device.name
      : titleize(
          ''.concat(
            device.brandName && device.brandName.length > 0 ? ` ${device.brandName}` : '',
            device.productModel && device.productModel.length > 0 ? ` ${device.productModel}` : '',
          ),
        );
  return name.trim();
};

/**
 * @description Create an eWeLink device for Gladys.
 * @param {string} serviceId - The UUID of the service.
 * @param {object} device - The eWeLink device.
 * @returns {object} Return Gladys device.
 * @example
 * getDevice(serviceId, device, channel);
 */
function getDevice(serviceId, device) {
  const name = getDeviceName(device);
  const externalId = getExternalId(device);
  const { params = {} } = device;

  const createdDevice = {
    name,
    model: device.productModel,
    external_id: externalId,
    selector: externalId,
    features: [],
    service_id: serviceId,
    should_poll: false,
    params: readParams(device),
  };

  const deviceUiid = (device.extra || {}).uiid;
  if (device.online && deviceUiid) {
    const channel = params.switch ? 1 : (params.switches || []).length;
    Object.keys(AVAILABLE_FEATURE_MODELS).forEach((type) => {
      if (AVAILABLE_FEATURE_MODELS[type].uiid.includes(deviceUiid)) {
        let ch = 1;
        do {
          const featureExternalId = (type === 'binary' ? [externalId, type, ch] : [externalId, type]).join(':');
          const feature = {
            ...AVAILABLE_FEATURE_MODELS[type].feature.generateFeature(name, channel > 1 ? ch : 0),
            external_id: featureExternalId,
            selector: featureExternalId,
          };

          logger.debug(`eWeLink: Add feature "${type}" to device "${device.deviceid}"`);
          createdDevice.features.push(feature);
          ch += channel > 0 ? 1 : 0;
        } while (type === 'binary' && ch <= channel);
      }
    });
  }

  return createdDevice;
}

/**
 * @description Read and decode Gladys feature state from eWeLink object.
 * @param {string} externalId - Device external ID.
 * @param {object} params - EWeLink received params.
 * @returns {Array} Arry of featureExternalId / state objects.
 * @example
 * const states = readStates('ewelink:10001a', { switch: 'on' });
 */
function readStates(externalId, params) {
  const states = [];
  AVAILABLE_FEATURES.forEach((feature) => {
    const updatedStates = feature.readStates(externalId, params);
    updatedStates.forEach((state) => {
      states.push(state);
    });
  });
  return states;
}

module.exports = {
  getDevice,
  readStates,
};
