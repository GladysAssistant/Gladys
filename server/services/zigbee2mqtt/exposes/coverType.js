const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  COVER_STATE,
  DEVICE_FEATURE_UNITS,
} = require('../../../utils/constants');

module.exports = {
  type: 'cover',
  writeValue: (expose, value) => {
    let relatedValue;

    // Mapping is only for cover type
    switch (value) {
      case COVER_STATE.OPEN:
        relatedValue = 'OPEN';
        break;
      case COVER_STATE.CLOSE:
        relatedValue = 'CLOSE';
        break;
      case COVER_STATE.STOP:
        relatedValue = 'STOP';
        break;
      default:
        relatedValue = undefined;
    }

    if (relatedValue && expose.values.includes(relatedValue)) {
      return relatedValue;
    }

    return undefined;
  },
  readValue: (expose, value) => {
    // Mapping is only for cover type
    switch (value) {
      case 'OPEN':
        return COVER_STATE.OPEN;
      case 'CLOSE':
        return COVER_STATE.CLOSE;
      case 'STOP':
        return COVER_STATE.STOP;
      default:
        return undefined;
    }
  },
  names: {
    state: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
        type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
        min: -1,
        max: 1,
      },
    },
    position: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
        type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
      },
    },
  },
};
