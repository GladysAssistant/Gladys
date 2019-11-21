const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const colorControlCapability = {
  capability: {
    id: 'colorControl',
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
    // setColor: (args) => args,
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
