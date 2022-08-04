const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  BUTTON_STATUS,
  TIMER_STATUS,
} = require('../../../utils/constants');

module.exports = {
  type: 'enum',
  writeValue: (expose, value) => {
    let relatedValue;

    // Mapping is only for button click and timer status
    switch (value) {
      case BUTTON_STATUS.CLICK:
        relatedValue = 'single';
        break;
      case BUTTON_STATUS.DOUBLE_CLICK:
        relatedValue = 'double';
        break;
      case BUTTON_STATUS.HOLD_CLICK:
        relatedValue = 'hold';
        break;
      case BUTTON_STATUS.LONG_CLICK:
        relatedValue = 'long';
        break;
      case TIMER_STATUS.DISABLED:
        relatedValue = 'disabled';
        break;
      case TIMER_STATUS.ENABLED:
        relatedValue = 'enabled';
        break;
      case TIMER_STATUS.ACTIVE:
        relatedValue = 'active';
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
    // Mapping is only for button click
    switch (value) {
      case 'single':
        return BUTTON_STATUS.CLICK;
      case 'double':
        return BUTTON_STATUS.DOUBLE_CLICK;
      case 'hold':
        return BUTTON_STATUS.HOLD_CLICK;
      case 'long':
        return BUTTON_STATUS.LONG_CLICK;
      case 'disabled':
        return TIMER_STATUS.DISABLED;
      case 'enabled':
        return TIMER_STATUS.ENABLED;
      case 'active':
        return TIMER_STATUS.ACTIVE;
      default:
        return undefined;
    }
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
    timer_state: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TIMER,
        type: DEVICE_FEATURE_TYPES.TIMER.STATUS,
      },
    },
  },
};
