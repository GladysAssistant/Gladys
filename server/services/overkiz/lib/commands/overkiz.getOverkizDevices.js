const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_UNITS,
  DEVICE_FEATURE_TYPES,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../../utils/constants');
const { slugify } = require('../../../../utils/slugify');
const {
  DEVICE_PARAMS,
  DEVICE_UID_CLASSES,
  DEVICE_STATES,
  DEVICE_TYPES,
  HEATING_MODES,
  HEATING_STATES,
} = require('../overkiz.constants');
const { getDeviceName, getDeviceFeatureExternalId, getDeviceExternalId } = require('../utils/overkiz.externalId');

/**
 * @description Return array of Devices.
 * @returns {Promise<Array>} Return list of devices.
 * @example
 * const devices = overkizHandler.getDevices();
 */
async function getOverkizDevices() {
  const deviceOids = Object.keys(this.devices);

  // Search for main device (non-pod system device)
  const newDevices = deviceOids
    .map((deviceOid) => ({ id: deviceOid, ...this.devices[deviceOid] }))
    .filter((node) => node.type === DEVICE_TYPES.SYSTEM)
    .filter((node) => node.uiClass !== DEVICE_UID_CLASSES.POD)
    .map((node) => {
      const states = node.states.reduce((map, obj) => {
        map[obj.name] = obj.value;
        return map;
      }, {});

      const attributes = node.attributes.reduce((map, obj) => {
        map[obj.name] = obj.value;
        return map;
      }, {});

      const newDevice = {
        name: getDeviceName(node),
        model: `${states[DEVICE_STATES.MODEL_STATE]} ${states[DEVICE_STATES.POWER_STATE]}W (${
          states[DEVICE_STATES.MANUFACTURER_NAME_STATE]
        })`,
        service_id: this.serviceId,
        external_id: getDeviceExternalId(node),
        updatable: true,
        ready: node.available && node.enabled,
        rawOverkizDevice: {
          id: node.id,
          deviceURL: node.deviceURL,
        },
        should_poll: true,
        poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_5_MINUTES,
        features: [],
        params: [
          {
            name: DEVICE_PARAMS.ONLINE,
            value: states[DEVICE_STATES.STATUS_STATE],
          },
          {
            name: DEVICE_PARAMS.FIRMWARE,
            value: attributes[DEVICE_STATES.FIRMWARE_REVISION_STATE],
          },
          {
            name: DEVICE_PARAMS.STATE,
            value: states[DEVICE_STATES.OPERATING_MODE_STATE],
          },
        ],
      };

      return newDevice;
    })
    .reduce((map, obj) => {
      // Remove #<idx> to get all nodes from the same physical device
      const deviceURL = obj.rawOverkizDevice.deviceURL.includes('#')
        ? obj.rawOverkizDevice.deviceURL.substring(0, obj.rawOverkizDevice.deviceURL.indexOf('#'))
        : obj.rawOverkizDevice.deviceURL;
      map[deviceURL] = obj;
      return map;
    }, {});

  // Search for device associated to main device (same base URL)
  deviceOids
    .map((deviceOid) => ({ id: deviceOid, ...this.devices[deviceOid] }))
    .filter((node) => {
      const deviceURL = node.deviceURL.includes('#')
        ? node.deviceURL.substring(0, node.deviceURL.indexOf('#'))
        : node.deviceURL;
      return newDevices[deviceURL] !== undefined;
    })
    .map((node) => {
      const deviceURL = node.deviceURL.includes('#')
        ? node.deviceURL.substring(0, node.deviceURL.indexOf('#'))
        : node.deviceURL;
      const newDevice = newDevices[deviceURL];
      const operatingModeState = newDevice.params.find((param) => param.name === DEVICE_PARAMS.STATE).value;

      newDevice.should_poll = true;
      newDevice.poll_frequency = DEVICE_POLL_FREQUENCIES.EVERY_30_MINUTES;

      if (node.uiClass === DEVICE_UID_CLASSES.HEATER) {
        if (operatingModeState === HEATING_STATES.PROG) {
          newDevice.features.push({
            name: `Mode`,
            selector: slugify(getDeviceFeatureExternalId(node, DEVICE_STATES.HEATING_LEVEL_STATE)),
            external_id: getDeviceFeatureExternalId(node, DEVICE_STATES.HEATING_LEVEL_STATE),
            category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
            type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
            read_only: false,
            has_feedback: true,
            min: 0,
            max: HEATING_MODES.length - 1,
          });
          newDevice.features.push({
            name: `Comfort mode temperature`,
            selector: slugify(getDeviceFeatureExternalId(node, DEVICE_STATES.COMFORT_TEMPERATURE_STATE)),
            external_id: getDeviceFeatureExternalId(node, DEVICE_STATES.COMFORT_TEMPERATURE_STATE),
            category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
            type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
            read_only: false,
            unit: DEVICE_FEATURE_UNITS.CELSIUS,
            has_feedback: true,
            min: 0,
            max: 40,
          });
          newDevice.features.push({
            name: `Eco mode temperature`,
            selector: slugify(getDeviceFeatureExternalId(node, DEVICE_STATES.ECO_TEMPERATURE_STATE)),
            external_id: getDeviceFeatureExternalId(node, DEVICE_STATES.ECO_TEMPERATURE_STATE),
            category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
            type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
            read_only: false,
            unit: DEVICE_FEATURE_UNITS.CELSIUS,
            has_feedback: true,
            min: 0,
            max: 40,
          });
        } else if (operatingModeState === HEATING_STATES.BASIC) {
          newDevice.features.push({
            name: `Temperature`,
            selector: slugify(getDeviceFeatureExternalId(node, DEVICE_STATES.TARGET_TEMPERATURE_STATE)),
            external_id: getDeviceFeatureExternalId(node, DEVICE_STATES.TARGET_TEMPERATURE_STATE),
            category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
            type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
            read_only: false,
            unit: DEVICE_FEATURE_UNITS.CELSIUS,
            has_feedback: true,
            min: 0,
            max: 40,
          });
        } else if (operatingModeState === HEATING_STATES.AUTO) {
          newDevice.features.push({
            name: `Comfort mode temperature`,
            selector: slugify(getDeviceFeatureExternalId(node, DEVICE_STATES.COMFORT_TEMPERATURE_STATE)),
            external_id: getDeviceFeatureExternalId(node, DEVICE_STATES.COMFORT_TEMPERATURE_STATE),
            category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
            type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
            read_only: false,
            unit: DEVICE_FEATURE_UNITS.CELSIUS,
            has_feedback: true,
            min: 0,
            max: 40,
          });
          newDevice.features.push({
            name: `Eco mode temperature`,
            selector: slugify(getDeviceFeatureExternalId(node, DEVICE_STATES.ECO_TEMPERATURE_STATE)),
            external_id: getDeviceFeatureExternalId(node, DEVICE_STATES.ECO_TEMPERATURE_STATE),
            category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
            type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
            read_only: false,
            unit: DEVICE_FEATURE_UNITS.CELSIUS,
            has_feedback: true,
            min: 0,
            max: 40,
          });
        }
      } else if (node.uiClass === DEVICE_UID_CLASSES.TEMPERATURE) {
        newDevice.features.push({
          name: `Temperature`,
          selector: slugify(getDeviceFeatureExternalId(node, DEVICE_STATES.TEMPERATURE_STATE)),
          external_id: getDeviceFeatureExternalId(node, DEVICE_STATES.TEMPERATURE_STATE),
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          read_only: true,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          has_feedback: true,
          min: 0,
          max: 40,
        });
      } else if (node.uiClass === DEVICE_UID_CLASSES.OCCUPANCY) {
        newDevice.features.push({
          name: `Occupancy`,
          selector: slugify(getDeviceFeatureExternalId(node, DEVICE_STATES.OCCUPANCY_STATE)),
          external_id: getDeviceFeatureExternalId(node, DEVICE_STATES.OCCUPANCY_STATE),
          category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.PUSH,
          min: 0,
          max: 1,
          read_only: true,
          has_feedback: false,
          keep_history: true,
        });
      }

      return newDevice;
    });

  const newDevicesOids = Object.keys(newDevices);
  return newDevicesOids
    .map((newDevicesOid) => ({ ...newDevices[newDevicesOid] }))
    .sort((a, b) => {
      return b.ready - a.ready || a.rawOverkizDevice.id - b.rawOverkizDevice.id;
    });
}

module.exports = {
  getOverkizDevices,
};
