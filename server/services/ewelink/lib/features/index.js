const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');
const { titleize } = require('../../../../utils/titleize');
const { DEVICE_EXTERNAL_ID_BASE, DEVICE_IP_ADDRESS, DEVICE_FIRMWARE, DEVICE_ONLINE } = require('../utils/constants');

// Features
const powerFeature = require('./power');
const energyPowerFeature = require('./energy.power');
const humidityFeature = require('./humidity');
const temperatureFeature = require('./temperature');

const AVAILABLE_FEATURE_MODELS = {
  power: {
    uiid: [1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 15],
    feature: powerFeature,
  },
  energyPower: {
    uiid: [5],
    feature: energyPowerFeature,
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

const getDeviceName = (device, channel = null) => {
  const name =
    device.name !== ''
      ? device.name.concat(channel ? ` Ch${channel}` : '')
      : titleize(
          ''.concat(
            device.brandName && device.brandName.length > 0 ? ` ${device.brandName}` : '',
            device.productModel && device.productModel.length > 0 ? ` ${device.productModel}` : '',
            channel ? ` Ch${channel}` : '',
          ),
        );
  return name.trim();
};

/**
 * @description Get the external ID of the eWeLink device.
 * @param {Object} device - The eWeLink device.
 * @param {number} channel - The channel of the device to control.
 * @returns {string} Return the external ID of the Gladys device.
 * @example
 * getExternalId(device, 1);
 */
function getExternalId(device, channel = null) {
  return [DEVICE_EXTERNAL_ID_BASE, device.deviceid, channel || 1].join(':');
}

/**
 * @description Parse the external ID of the Gladys device.
 * @param {string} externalId - External ID of the Gladys device.
 * @returns {Object} Return the prefix, the device ID, the channel count and the type.
 * @example
 * parseExternalId('eWeLink:100069d0d4:4:power');
 */
function parseExternalId(externalId) {
  const [prefix, deviceId, channelString, type] = externalId.split(':');
  const channel = parseInt(channelString || '0', 10);
  return { prefix, deviceId, channel, type };
}

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
 * @param {Object} device - The eWeLink device.
 * @param {number} channel - The channel of the device to control.
 * @returns {Object} Return Gladys device.
 * @example
 * getDevice(serviceId, device, channel);
 */
function getDevice(serviceId, device, channel = null) {
  const name = getDeviceName(device, channel);
  const externalId = [DEVICE_EXTERNAL_ID_BASE, device.deviceid, channel || 1].join(':');

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
        const featureExternalId = [externalId, type].join(':');
        const feature = {
          ...AVAILABLE_FEATURE_MODELS[type].feature.generateFeature(),
          external_id: featureExternalId,
          selector: featureExternalId,
        };
        createdDevice.features.push(feature);
      }
    });
  }

  return createdDevice;
}

module.exports = {
  getExternalId,
  parseExternalId,
  readOnlineValue,
  getDevice,
};
