import get from 'get-value';

import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';

const ICON_MAP = {
  [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]: {
    0: 'unlock',
    1: 'lock'
  },
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_STATE]: {
    0: 'unlock',
    1: 'lock'
  },
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_STATE]: {
    0: 'unlock',
    1: 'lock'
  },
  // server/utils/constants LOCK.STATE
  [DEVICE_FEATURE_CATEGORIES.LOCK]: {
    255: 'alert-triangle', // 'uncalibrated', 'undefined', 'motor blocked', 'boot run'
    0: 'lock', // 'locked'
    1: 'unlock', //'unlocked', 'unlatched', 'unlocked (lock ‘n’ go)'
    2: 'activity' // 'unlocking', 'locking', 'unlatching opening'
  }
};
const IconBinaryDeviceValue = ({ deviceFeature }) => {
  const { category, last_value: lastValue = null } = deviceFeature;
  const icon = get(ICON_MAP, `${category}.${lastValue}`);

  if (icon) {
    return <i class={`fe fe-${icon}`} />;
  }

  return null;
};

export default IconBinaryDeviceValue;
