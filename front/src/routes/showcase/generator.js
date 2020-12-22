import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../utils/consts';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_CATEGORIES_LIST,
  DEVICE_FEATURE_UNITS_BY_CATEGORY
} from '../../../../server/utils/constants';

const DEFAULT_VALUES = {
  [DEVICE_FEATURE_CATEGORIES.LIGHT]: {
    [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: {
      min: 0,
      max: 65655,
      last_value: 0
    }
  },
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    [DEVICE_FEATURE_TYPES.SWITCH.DIMMER]: {
      min: 0,
      max: 100,
      last_value: 75
    }
  }
};

function generateFeatures(category, date) {
  const features = [];

  Object.keys(DeviceFeatureCategoriesIcon[category] || {}).forEach(type => {
    const defaultValues = get(DEFAULT_VALUES, `${category}.${type}`, { default: {} });

    DEVICE_FEATURE_UNITS_BY_CATEGORY[category] ||
      [undefined].forEach(unit => {
        features.push({
          name: `Feature name`,
          category,
          type,
          unit,
          last_value: 1,
          last_value_changed: date,
          ...defaultValues
        });
      });
  });

  return features;
}

function generateAll() {
  const date = new Date();
  date.setHours(date.getHours() - 2);

  return DEVICE_FEATURE_CATEGORIES_LIST.map(category => {
    const features = generateFeatures(category, date);

    return {
      category,
      features
    };
  });
}

export { generateAll };
