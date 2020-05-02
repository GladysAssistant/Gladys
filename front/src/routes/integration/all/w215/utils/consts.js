import {
  W215_FEATURE_CATEGORIES,
  W215_FEATURE_TYPES
} from '../../../../../../../server/services/w215/lib/utils/constants';

export const W215FeatureCategoriesIcon = {
  [W215_FEATURE_CATEGORIES.SWITCH]: {
    [W215_FEATURE_TYPES.SWITCH.BINARY]: 'power',
    [W215_FEATURE_TYPES.SWITCH.POWER]: 'zap',
    [W215_FEATURE_TYPES.SWITCH.TEMPERATURE]: 'thermometer'
  }
};
