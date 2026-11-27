const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');
const { ZIGBEE2MQTT_SUPPORT } = require('../lib/constants');
const { mapDefinition } = require('./features/mapDefinition');

// What a device has besides what it is: alone, nothing to control or read (docs/specs/zigbee2mqtt-pairing.md, E.1)
const SECONDARY_CATEGORIES = [
  DEVICE_FEATURE_CATEGORIES.BATTERY,
  DEVICE_FEATURE_CATEGORIES.BATTERY_LOW,
  DEVICE_FEATURE_CATEGORIES.SIGNAL,
  DEVICE_FEATURE_CATEGORIES.DEVICE_TEMPERATURE_SENSOR,
];

/**
 * @description Tell whether Gladys features hold one the user can control or read: not only a battery or a signal.
 * @param {Array} features - Gladys features.
 * @returns {boolean} True when one of them is not a secondary one.
 * @example
 * hasUsefulFeature([{ category: 'light', type: 'binary' }]); // true
 */
function hasUsefulFeature(features) {
  return features.some((feature) => !SECONDARY_CATEGORIES.includes(feature.category));
}

/**
 * @description Tell whether a definition of Zigbee2mqtt gives a useful Gladys feature (a generated one, mostly).
 * @param {string} name - Friendly name of the device.
 * @param {object} [definition] - Its definition.
 * @returns {boolean} True when it does.
 * @example
 * hasUsefulDefinition('0x01', { exposes: [{ type: 'binary', property: 'occupancy', name: 'occupancy' }] }); // true
 */
function hasUsefulDefinition(name, definition) {
  return Boolean(definition) && hasUsefulFeature(mapDefinition(name, definition));
}

/**
 * @description What Gladys can do with a device Zigbee2mqtt lists (E.2).
 * @param {object} device - A device of `bridge/devices`.
 * @param {Array} features - Its Gladys features.
 * @returns {string|null} A ZIGBEE2MQTT_SUPPORT, or null for a device not to list: the coordinator, a device not
 * supported whose interview is not over.
 * @example
 * getSupport({ supported: true }, []); // 'native'
 */
function getSupport(device, features) {
  if (device.supported) {
    // Supported without a definition: the coordinator, never a device to add
    return device.definition ? ZIGBEE2MQTT_SUPPORT.NATIVE : null;
  }
  // `interview_state` since Zigbee2mqtt 2, the two booleans before
  const interviewState = device.interview_state;
  const running = interviewState ? ['PENDING', 'IN_PROGRESS'].includes(interviewState) : device.interviewing === true;
  if (running) {
    return null;
  }
  const failed = interviewState ? interviewState === 'FAILED' : device.interview_completed !== true;
  if (failed) {
    return ZIGBEE2MQTT_SUPPORT.INTERVIEW_FAILED;
  }
  return device.definition && hasUsefulFeature(features)
    ? ZIGBEE2MQTT_SUPPORT.GENERIC
    : ZIGBEE2MQTT_SUPPORT.UNSUPPORTED;
}

/**
 * @description What a report needs to know of a device: to ask Zigbee2mqtt or Gladys to support it (E.4).
 * @param {object} device - A device of `bridge/devices`.
 * @returns {object} Its model ID, manufacturer, power source, interview, definition and clusters.
 * @example
 * getZigbee2mqttInfo({ model_id: 'TS0601', manufacturer: '_TZE200_abcd' });
 */
function getZigbee2mqttInfo(device) {
  const { definition, endpoints = {} } = device;
  return {
    model_id: device.model_id || null,
    manufacturer: device.manufacturer || null,
    power_source: device.power_source || null,
    interview_state: device.interview_state || null,
    definition: definition
      ? {
          model: definition.model,
          vendor: definition.vendor,
          description: definition.description,
          exposes: definition.exposes || [],
        }
      : null,
    endpoints: Object.keys(endpoints).reduce((acc, id) => {
      const { clusters = {} } = endpoints[id];
      acc[id] = { clusters: { input: clusters.input || [], output: clusters.output || [] } };
      return acc;
    }, {}),
  };
}

module.exports = {
  hasUsefulFeature,
  hasUsefulDefinition,
  getSupport,
  getZigbee2mqttInfo,
};
