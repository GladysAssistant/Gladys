import get from 'get-value';

import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';

const ICON_MAP = {
  [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]: {
    0: 'shield-off',
    1: 'shield'
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
