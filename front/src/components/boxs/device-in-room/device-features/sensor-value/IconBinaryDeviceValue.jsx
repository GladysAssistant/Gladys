import get from 'get-value';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';

const ICON_MAP = {
  [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]: {
    0: 'unlock',
    1: 'lock'
  },
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE]: {
    [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.DOOR_OPEN]: {
      0: 'lock',
      1: 'unlock'
    },
    [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.PLUGGED]: {
      0: 'unlock',
      1: 'lock'
    },
    [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.WINDOW_OPEN]: {
      0: 'lock',
      1: 'unlock'
    }
  }
};

const IconBinaryDeviceValue = ({ deviceFeature }) => {
  const { category, type, last_value: lastValue = null } = deviceFeature;
  const icon = get(ICON_MAP, `${category}.${lastValue}`) || get(ICON_MAP, `${category}.${type}.${lastValue}`);

  if (icon) {
    return <i class={`fe fe-${icon}`} />;
  }

  return null;
};

export default IconBinaryDeviceValue;
