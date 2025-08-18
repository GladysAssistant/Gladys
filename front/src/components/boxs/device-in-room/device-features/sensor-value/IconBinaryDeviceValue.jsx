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
  [DEVICE_FEATURE_CATEGORIES.LOCK]: {
    0: 'x-circle', //'uncalibrated'
    1: 'lock', //'locked',
    2: 'activity', //'unlocking',
    3: 'unlock', //'unlocked',
    4: 'activity', //'locking',
    5: 'unlocked', // 'unlatched',
    6: 'unlocked', // 'unlocked (lock ‘n’ go)',
    7: 'activity', //'unlatching opening',
    253: 'cpu', //'boot run'
    254: 'alert-triangle', // 'motor blocked'
    255: 'alert-circle' //'undefined'
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
