import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';

const DANGER_ON_VALUE_SENSORS = [
  DEVICE_FEATURE_CATEGORIES.CO_SENSOR,
  DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
  DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
  DEVICE_FEATURE_CATEGORIES.BATTERY_LOW,
  DEVICE_FEATURE_CATEGORIES.TAMPER
];
const DANGER_ON_VALUE_SENSORS_TYPES = [
  DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.DOOR_OPEN,
  DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.WINDOW_OPEN
];

const BINARY_CATEGORIES_TYPES_CUSTOM = {
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_STATE]: [
    DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.DOOR_OPEN,
    DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.WINDOW_OPEN
  ],
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CHARGE]: [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.PLUGGED]
};

const BinaryDeviceValue = ({ deviceFeature }) => {
  const { category, type, last_value: lastValue = null } = deviceFeature;
  const reverseColors = DANGER_ON_VALUE_SENSORS.includes(category) || DANGER_ON_VALUE_SENSORS_TYPES.includes(type);
  const customText =
    BINARY_CATEGORIES_TYPES_CUSTOM[category] && BINARY_CATEGORIES_TYPES_CUSTOM[category].includes(type);

  const value = lastValue === null ? -1 : lastValue;
  const valued = value !== -1;
  const active = value ^ reverseColors;
  const success = valued && active;
  const danger = valued && !active;

  return (
    <span
      class={cx('badge', {
        'bg-success': success,
        'bg-danger': danger,
        'bg-secondary': !valued
      })}
    >
      <Text id={`deviceFeatureValue.category.${category}.binary`} plural={value}>
        {!customText && <Text id="deviceFeatureValue.type.binary" plural={value} />}
        {customText && <Text id={`deviceFeatureValue.category.${category}.${type}.${value}`} />}
      </Text>
    </span>
  );
};

export default BinaryDeviceValue;
