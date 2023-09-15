const { slugify } = require('../../../utils/slugify');
const {
  getDeviceFeatureExternalId,
  getDeviceExternalId,
  getDeviceName,
  getDeviceFeatureName,
} = require('./utils/sunspec.externalId');
const {
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_UNITS,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../utils/constants');
const { PROPERTY, PARAMS } = require('./sunspec.constants');

/**
 * @description Check if keyword matches value.
 * @param {string} value - Value to check.
 * @param {string} keyword - Keyword to match.
 * @returns {boolean} True if keyword matches value.
 * @example
 * const res = sunspecManager.match('test', 'te');
 */
function match(value, keyword) {
  return value ? value.toLowerCase().includes(keyword.toLowerCase()) : true;
}

/**
 * @description Return array of devices.
 * @param {object} pagination - Filtering and ordering.
 * @param {string} pagination.orderDir - Ordering.
 * @param {string} pagination.search - Keyword to filter devices.
 * @returns {Array} Return list of devices.
 * @example
 * const devices = sunspecManager.getDevices();
 */
function getDevices({ orderDir, search } = {}) {
  return this.devices
    .filter((device) => (search ? match(device.manufacturer, search) || match(device.product, search) : true))
    .map((device) => {
      const newDevice = {
        name: getDeviceName(device),
        selector: slugify(getDeviceExternalId(device)),
        model: `${getDeviceName(device)}`,
        service_id: this.serviceId,
        external_id: getDeviceExternalId(device),
        features: [],
        should_poll: true,
        poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
        params: [
          {
            name: PARAMS.MANUFACTURER,
            value: device.manufacturer,
          },
          {
            name: PARAMS.PRODUCT,
            value: device.product,
          },
          {
            name: PARAMS.SERIAL_NUMBER,
            value: device.serialNumber,
          },
          {
            name: PARAMS.SW_VERSION,
            value: device.swVersion,
          },
        ],
      };

      if (device.mppt) {
        newDevice.features.push({
          name: getDeviceFeatureName({
            ...device,
            property: PROPERTY.DCA,
          }),
          selector: slugify(
            getDeviceFeatureExternalId({
              ...device,
              property: PROPERTY.DCA,
            }),
          ),
          category: DEVICE_FEATURE_CATEGORIES.PV,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
          external_id: getDeviceFeatureExternalId({
            ...device,
            property: PROPERTY.DCA,
          }),
          read_only: true,
          unit: DEVICE_FEATURE_UNITS.AMPERE,
          has_feedback: false,
          min: 0,
          max: 400,
          last_value: 0,
        });

        newDevice.features.push({
          name: getDeviceFeatureName({
            ...device,
            property: PROPERTY.DCV,
          }),
          selector: slugify(
            getDeviceFeatureExternalId({
              ...device,
              property: PROPERTY.DCV,
            }),
          ),
          category: DEVICE_FEATURE_CATEGORIES.PV,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE,
          external_id: getDeviceFeatureExternalId({
            ...device,
            property: PROPERTY.DCV,
          }),
          read_only: true,
          unit: DEVICE_FEATURE_UNITS.VOLT,
          has_feedback: false,
          min: 0,
          max: 400,
          last_value: 0,
        });

        newDevice.features.push({
          name: getDeviceFeatureName({
            ...device,
            property: PROPERTY.DCW,
          }),
          selector: slugify(
            getDeviceFeatureExternalId({
              ...device,
              property: PROPERTY.DCW,
            }),
          ),
          category: DEVICE_FEATURE_CATEGORIES.PV,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
          external_id: getDeviceFeatureExternalId({
            ...device,
            property: PROPERTY.DCW,
          }),
          read_only: true,
          unit: DEVICE_FEATURE_UNITS.WATT,
          has_feedback: false,
          min: 0,
          max: 10000,
          last_value: 0,
        });

        newDevice.features.push({
          name: getDeviceFeatureName({
            ...device,
            property: PROPERTY.DCWH,
          }),
          selector: slugify(
            getDeviceFeatureExternalId({
              ...device,
              property: PROPERTY.DCWH,
            }),
          ),
          category: DEVICE_FEATURE_CATEGORIES.PV,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: getDeviceFeatureExternalId({
            ...device,
            property: PROPERTY.DCWH,
          }),
          read_only: true,
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
          has_feedback: false,
          min: 0,
          max: 1000000,
          last_value: 0,
        });
      } else {
        newDevice.features.push({
          name: getDeviceFeatureName({
            ...device,
            property: PROPERTY.ACA,
          }),
          selector: slugify(
            getDeviceFeatureExternalId({
              ...device,
              property: PROPERTY.ACA,
            }),
          ),
          category: DEVICE_FEATURE_CATEGORIES.PV,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
          external_id: getDeviceFeatureExternalId({
            ...device,
            property: PROPERTY.ACA,
          }),
          read_only: true,
          unit: DEVICE_FEATURE_UNITS.AMPERE,
          has_feedback: false,
          min: 0,
          max: 400,
          last_value: 0,
        });

        newDevice.features.push({
          name: getDeviceFeatureName({
            ...device,
            property: PROPERTY.ACV,
          }),
          selector: slugify(
            getDeviceFeatureExternalId({
              ...device,
              property: PROPERTY.ACV,
            }),
          ),
          category: DEVICE_FEATURE_CATEGORIES.PV,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE,
          external_id: getDeviceFeatureExternalId({
            ...device,
            property: PROPERTY.ACV,
          }),
          read_only: true,
          unit: DEVICE_FEATURE_UNITS.VOLT,
          has_feedback: false,
          min: 0,
          max: 400,
          last_value: 0,
        });

        newDevice.features.push({
          name: getDeviceFeatureName({
            ...device,
            property: PROPERTY.ACW,
          }),
          selector: slugify(
            getDeviceFeatureExternalId({
              ...device,
              property: PROPERTY.ACW,
            }),
          ),
          category: DEVICE_FEATURE_CATEGORIES.PV,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
          external_id: getDeviceFeatureExternalId({
            ...device,
            property: PROPERTY.ACW,
          }),
          read_only: true,
          unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
          has_feedback: false,
          min: 0,
          max: 10000,
          last_value: 0,
        });

        newDevice.features.push({
          name: getDeviceFeatureName({
            ...device,
            property: PROPERTY.ACWH,
          }),
          selector: slugify(
            getDeviceFeatureExternalId({
              ...device,
              property: PROPERTY.ACWH,
            }),
          ),
          category: DEVICE_FEATURE_CATEGORIES.PV,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: getDeviceFeatureExternalId({
            ...device,
            property: PROPERTY.ACWH,
          }),
          read_only: true,
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
          has_feedback: false,
          min: 0,
          max: 1000000,
          last_value: 0,
        });
      }
      return newDevice;
    })
    .filter((newDevice) => newDevice.features && newDevice.features.length > 0);
}

module.exports = {
  getDevices,
};
