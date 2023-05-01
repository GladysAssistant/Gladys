const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { titleize } = require('../../../../utils/titleize');
const { DEVICE_IP_ADDRESS, DEVICE_FIRMWARE, DEVICE_ONLINE } = require('../utils/constants');
const { getExternalId } = require('../utils/externalId');

// Features
const binaryFeature = require('./binary');
const humidityFeature = require('./humidity');
const temperatureFeature = require('./temperature');

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
 * @description Convert online state.
 * @param {boolean} online - Online device state.
 * @returns {string} Return the prefix, the device ID and the channel count.
 * @example
 * readOnlineValue(true);
 */
function readOnlineValue(online) {
  return online ? '1' : '0';
}

/**
 * @description Create an eWeLink device for Gladys.
 * @param {string} serviceId - The UUID of the service.
 * @param {object} device - The eWeLink device.
 * @param {number} channel - The channel of the device to control.
 * @returns {object} Return Gladys device.
 * @example
 * getDevice(serviceId, device, channel);
 */
function getDevice(serviceId, device, channel = 0) {
  const name = getDeviceName(device);
  const externalId = getExternalId(device);

  const createdDevice = {
    name,
    model: device.productModel,
    external_id: externalId,
    selector: externalId,
    features: [],
    service_id: serviceId,
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS,
    params: [
      {
        name: DEVICE_IP_ADDRESS,
        value: device.ip || '?.?.?.?',
      },
      {
        name: DEVICE_FIRMWARE,
        value: (device.params && device.params.fwVersion) || '?.?.?',
      },
      {
        name: DEVICE_ONLINE,
        value: readOnlineValue(device.online),
      },
    ],
  };

  if (device.online) {
    Object.keys(AVAILABLE_FEATURE_MODELS).forEach((type) => {
      if (AVAILABLE_FEATURE_MODELS[type].uiid.includes(device.uiid)) {
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

module.exports = {
  readOnlineValue,
  getDevice,
};
