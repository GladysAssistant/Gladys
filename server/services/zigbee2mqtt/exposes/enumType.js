const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  BUTTON_STATUS,
  COVER_STATE,
} = require('../../../utils/constants');

const WRITE_VALUE_MAPPING = {};
const READ_VALUE_MAPPING = {};

const addMapping = (exposeName, gladysValue, z2mValue) => {
  const writeExposeMapping = WRITE_VALUE_MAPPING[exposeName] || {};
  writeExposeMapping[gladysValue] = z2mValue;
  WRITE_VALUE_MAPPING[exposeName] = writeExposeMapping;

  const readExposeMapping = READ_VALUE_MAPPING[exposeName] || {};
  readExposeMapping[z2mValue] = gladysValue;
  READ_VALUE_MAPPING[exposeName] = readExposeMapping;
};

addMapping('action', BUTTON_STATUS.CLICK, 'single');
addMapping('action', BUTTON_STATUS.DOUBLE_CLICK, 'double');
addMapping('action', BUTTON_STATUS.HOLD_CLICK, 'hold');
addMapping('action', BUTTON_STATUS.LONG_CLICK, 'long');
addMapping('state', COVER_STATE.OPEN, 'OPEN');
addMapping('state', COVER_STATE.CLOSE, 'CLOSE');
addMapping('state', COVER_STATE.STOP, 'STOP');

module.exports = {
  type: 'enum',
  writeValue: (expose, value) => {
    const relatedValue = (WRITE_VALUE_MAPPING[expose.name] || {})[value];

    if (relatedValue && expose.values.includes(relatedValue)) {
      return relatedValue;
    }

    return undefined;
  },
  readValue: (expose, value) => {
    const subValue = value.replace(/^(\d+_)?/, '');
    return (READ_VALUE_MAPPING[expose.name] || {})[subValue];
  },
  feature: {
    min: 0,
    max: 1,
  },
  names: {
    action: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.BUTTON,
        type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
      },
    },
    state: {
      types: {
        cover: {
          category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
          type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
          min: -1,
          max: 1,
          forceOverride: true,
        },
      },
    },
  },
  getFeatureIndexes: (values = []) => {
    const indexes = values
      // Force String value
      .map((value) => `${value}`)
      // Split at first '_' char
      .map((value) => value.split('_', 2))
      // Check for multiple indexes
      .filter((value) => value.length > 1)
      // Map first match to int
      .map((value) => parseInt(value[0], 10))
      // Check if it is an index
      .filter((value) => !Number.isNaN(value));

    return Array.from(new Set(indexes));
  },
};
