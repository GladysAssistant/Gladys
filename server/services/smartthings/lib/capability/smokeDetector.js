const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description A device that detects the presence or absence of smoke.
 *
 * @see https://smartthings.developer.samsung.com/docs/api-ref/capabilities.html#Smoke-Detector
 */
const smokeDetectorCapability = {
  capability: {
    id: 'st.smokeDetector',
    version: 1,
  },
  attributes: [
    {
      name: 'smoke',
      properties: [
        {
          name: 'value',
          writeValue: (feature) => (feature.last_value ? 'detected' : 'clear'),
        },
      ],
    },
  ],
  commands: {},
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    },
  ],
};

module.exports = {
  smokeDetectorCapability,
};
