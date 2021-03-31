import LightRemoteBox from './LightRemoteBox';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

export default {
  component: LightRemoteBox,
  category: DEVICE_FEATURE_CATEGORIES.LIGHT,
  features: {
    [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: {
      icon: 'power',
      buttonClass: 'btn-danger flex-fill',
      values: [0, 1]
    }
  }
};
