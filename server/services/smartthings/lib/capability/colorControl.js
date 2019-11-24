const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Allows for control of a color changing device by setting its hue, saturation, and color values.
 *
 * @see https://smartthings.developer.samsung.com/docs/api-ref/capabilities.html#Color-Control
 */
const colorControlCapability = {
  capability: {
    id: 'st.colorControl',
    version: 1,
  },
  attributes: [
    {
      name: 'color',
      featureType: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
      properties: [
        {
          name: 'value',
          writeValue: (feature) => feature.last_value,
        },
      ],
    },
    {
      name: 'hue',
      featureType: DEVICE_FEATURE_TYPES.LIGHT.HUE,
      properties: [
        {
          name: 'value',
          writeValue: (feature) => feature.last_value,
        },
      ],
    },
    {
      name: 'saturation',
      featureType: DEVICE_FEATURE_TYPES.LIGHT.SATURATION,
      properties: [
        {
          name: 'value',
          writeValue: (feature) => feature.last_value,
        },
      ],
    },
  ],
  commands: {
    setHue: {
      readValue: (args) => args.hue,
      featureType: DEVICE_FEATURE_TYPES.LIGHT.HUE,
    },
    setSaturation: {
      readValue: (args) => args.saturation,
      featureType: DEVICE_FEATURE_TYPES.LIGHT.SATURATION,
    },
  },
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.HUE,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.SATURATION,
    },
  ],
};

module.exports = {
  colorControlCapability,
};
