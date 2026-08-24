const { intToRgb, xyToInt } = require('../../../utils/colors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

// Zigbee "warning" composite modes starting the siren, ordered by preference.
// The Zigbee cluster defines them all, but each device only exposes a subset of them.
const WARNING_START_MODES = ['emergency', 'burglar', 'fire', 'police_panic', 'emergency_panic', 'fire_panic'];
// Zigbee "warning" composite modes stopping the siren, ordered by preference.
const WARNING_STOP_MODES = ['stop'];
// Duration sent when the siren is started and the device does not declare a maximum for the
// "duration" sub-feature of its warning command. The siren stops by itself after this delay, or
// earlier if the device "max_duration" attribute (exposed as its own Gladys feature) is lower.
const DEFAULT_WARNING_DURATION_IN_SECONDS = 600;

/**
 * @description Look for a sub-feature of a composite "expose".
 * @param {object} expose - Zigbee composite "expose".
 * @param {string} name - Sub-feature name.
 * @returns {object} The matching sub-feature, or undefined.
 * @example findSubFeature({ features: [{ name: 'mode' }] }, 'mode');
 */
function findSubFeature(expose, name) {
  const { features = [] } = expose;
  return features.find((feature) => feature.name === name);
}

/**
 * @description Select the Zigbee "warning" mode to send, according to what the device supports.
 * @param {object} expose - Zigbee composite "expose".
 * @param {Array} candidates - Accepted modes, ordered by preference.
 * @returns {string} The Zigbee mode to send.
 * @example pickWarningMode({ features: [] }, ['emergency']);
 */
function pickWarningMode(expose, candidates) {
  const { values = [] } = findSubFeature(expose, 'mode') || {};
  // Modes not exposed by the device are ignored, the first candidate is the Zigbee default one.
  return candidates.find((mode) => values.includes(mode)) || candidates[0];
}

const WRITE_VALUE_HANDLERS = {
  color_xy: (expose, value) => {
    const [r, g, b] = intToRgb(parseInt(value, 10));
    return { rgb: `${r},${g},${b}` };
  },
  // Siren "warning" command, e.g. Heiman HS2WD-E
  // https://www.zigbee2mqtt.io/devices/HS2WD-E.html
  warning: (expose, value) => {
    const start = `${value}` === '1';
    const warning = { mode: pickWarningMode(expose, start ? WARNING_START_MODES : WARNING_STOP_MODES) };

    if (findSubFeature(expose, 'strobe')) {
      warning.strobe = start;
    }
    const durationSubFeature = findSubFeature(expose, 'duration');
    if (durationSubFeature) {
      // Ask for the longest alarm the device accepts: it stops by itself when its "max_duration"
      // attribute is reached, and is stopped early by the "off" command.
      const { value_max: valueMax } = durationSubFeature;
      warning.duration = start ? valueMax ?? DEFAULT_WARNING_DURATION_IN_SECONDS : 0;
    }

    return warning;
  },
};

const READ_VALUE_HANDLERS = {
  color_xy: (expose, value) => xyToInt(value.x, value.y),
};

module.exports = {
  type: 'composite',
  writeValue: (expose, value) => {
    const { name } = expose || {};
    const handler = WRITE_VALUE_HANDLERS[name];
    return handler ? handler(expose, value) : undefined;
  },
  readValue: (expose, value) => {
    const { name } = expose || {};
    const handler = READ_VALUE_HANDLERS[name];
    return handler ? handler(expose, value) : undefined;
  },
  names: {
    color_xy: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
        has_feedback: true,
        read_only: false,
        min: 0,
        max: 16777215,
      },
    },
    warning: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SIREN,
        type: DEVICE_FEATURE_TYPES.SIREN.BINARY,
        min: 0,
        max: 1,
      },
    },
  },
};
