const { addSelector } = require('../../../utils/addSelector');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { PARAMS } = require('./lan-manager.constants');

const buildPresenceFeature = (deviceExternalId) => {
  const feature = {
    name: 'Presence',
    external_id: `${deviceExternalId}:${DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR}`,
    selector: `${deviceExternalId}:${DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR}`,
    category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.PUSH,
    min: 0,
    max: 1,
    read_only: true,
    has_feedback: false,
    keep_history: true,
    last_value: 1,
    last_value_changed: new Date(),
  };

  addSelector(feature);
  return feature;
};

/**
 * @description Transform network device to Gladys device.
 * @param {object} device - Network device.
 * @returns {object} Return Gladys deviec.
 * @example
 * const gladysDevice = lanManager.transformDevice({ ip: '...', mac: '...', hostname: '...' });
 */
function transformDevice(device) {
  const { mac, hostname, ip, vendor } = device;
  const deviceExternalId = `lan-manager:${mac.replaceAll(':', '').toLowerCase()}`;

  const params = [];

  if (hostname) {
    params.push({
      name: PARAMS.NAME,
      value: hostname,
    });
  }

  params.push({
    name: PARAMS.MAC,
    value: mac,
  });

  if (vendor) {
    params.push({
      name: PARAMS.MANUFACTURER,
      value: vendor,
    });
  }

  const gladysDevice = {
    name: hostname || '',
    ip,
    service_id: this.serviceId,
    external_id: deviceExternalId,
    selector: deviceExternalId,
    features: [buildPresenceFeature(deviceExternalId)],
    params,
  };

  addSelector(gladysDevice);
  return gladysDevice;
}

module.exports = {
  transformDevice,
};
