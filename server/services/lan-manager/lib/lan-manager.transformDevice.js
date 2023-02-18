const { toVendor } = require('@network-utils/vendor-lookup');

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
 * @param {Object} device - Network device.
 * @returns {Object} Return Gladys deviec.
 * @example
 * const gladysDevice = lanManager.transformDevice({ ip: '...', mac: '...', name: '...' });
 */
function transformDevice(device) {
  const deviceExternalId = `lan-manager:${device.mac.replaceAll(':', '').toLowerCase()}`;

  const gladysDevice = {
    name: device.name,
    service_id: this.serviceId,
    external_id: deviceExternalId,
    selector: deviceExternalId,
    features: [buildPresenceFeature(deviceExternalId)],
    params: [
      {
        name: PARAMS.MAC,
        value: device.mac,
      },
      {
        name: PARAMS.NAME,
        value: device.name,
      },
      {
        name: PARAMS.MANUFACTURER,
        value: toVendor(device.mac),
      },
    ],
  };

  addSelector(gladysDevice);
  return gladysDevice;
}

module.exports = {
  transformDevice,
};
