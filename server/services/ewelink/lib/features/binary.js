const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, STATE } = require('../../../../utils/constants');

module.exports = {
  // Gladys feature
  generateFeature: (name, channel = 0) => {
    return {
      name: `${name}${channel > 0 ? ` Ch${channel}` : ''} On/Off`,
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 1,
    };
  },
  readStates: (externalId, params) => {
    const states = [];

    // Single switch
    if (params.switch) {
      const state = params.switch === 'on' ? STATE.ON : STATE.OFF;
      states.push({ featureExternalId: `${externalId}:binary:0`, state });
    }

    // Multiple switches
    if (params.switches) {
      params.switches.forEach(({ switch: value, outlet }) => {
        const state = value === 'on' ? STATE.ON : STATE.OFF;
        states.push({
          featureExternalId: `${externalId}:binary:${outlet + 1}`,
          state,
        });
      });
    }

    return states;
  },
  writeParams: (device, parsedExternalId, value) => {
    const convertedValue = value ? 'on' : 'off';

    // Count number of binary features to determine if "switch" or "switches" param need to be changed
    const nbBinaryFeatures = device.features.reduce(
      (acc, currentFeature) => (currentFeature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY ? acc + 1 : acc),
      0,
    );

    if (nbBinaryFeatures > 1) {
      const { channel } = parsedExternalId;
      return { switches: [{ switch: convertedValue, outlet: channel - 1 }] };
    }

    return { switch: convertedValue };
  },
};
