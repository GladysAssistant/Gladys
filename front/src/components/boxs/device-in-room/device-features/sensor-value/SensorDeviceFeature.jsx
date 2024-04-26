import { createElement } from 'preact';
import get from 'get-value';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';

import BinaryDeviceValue from './BinaryDeviceValue';
import LastSeenDeviceValue from './LastSeenDeviceValue';
import MotionSensorDeviceValue from './MotionSensorDeviceValue';
import BadgeNumberDeviceValue from './BadgeNumberDeviceValue';
import IconBinaryDeviceValue from './IconBinaryDeviceValue';
import SignalQualityDeviceValue from './SignalQualityDeviceValue';
import ButtonClickDeviceValue from './ButtonClickDeviceValue';
import TextDeviceValue from './TextDeviceValue';
import NoRecentValueBadge from './NoRecentValueBadge';

const DISPLAY_BY_FEATURE_CATEGORY = {
  [DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR]: MotionSensorDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR]: LastSeenDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]: IconBinaryDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.SIGNAL]: SignalQualityDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.BUTTON]: ButtonClickDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.TEXT]: TextDeviceValue
};

const DISPLAY_BY_FEATURE_TYPE = {
  [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: BinaryDeviceValue
};

const DEVICE_FEATURES_WITHOUT_EXPIRATION = [
  DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
  DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
  DEVICE_FEATURE_CATEGORIES.BUTTON,
  DEVICE_FEATURE_CATEGORIES.TEXT
];

const SensorDeviceType = ({ children, ...props }) => {
  const { deviceFeature: feature } = props;
  const { category, type } = feature;

  let elementType = DISPLAY_BY_FEATURE_CATEGORY[category];

  if (!elementType) {
    elementType = DISPLAY_BY_FEATURE_TYPE[type];
  }

  if (!elementType) {
    elementType = BadgeNumberDeviceValue;
  }

  // If the device feature has no recent value, and the feature is not in the blacklist
  // we display a message to the user
  if (feature.last_value_is_too_old && DEVICE_FEATURES_WITHOUT_EXPIRATION.indexOf(feature.category) === -1) {
    elementType = NoRecentValueBadge;
  }

  return (
    <tr>
      <td>
        <i class={`mr-2 fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`)}`} />
      </td>
      <td>{props.rowName}</td>
      <td class="text-right">{createElement(elementType, props)}</td>
    </tr>
  );
};

export default SensorDeviceType;
