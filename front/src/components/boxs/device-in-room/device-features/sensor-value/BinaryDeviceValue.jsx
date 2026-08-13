import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';

const DANGER_ON_VALUE_SENSORS = [
  DEVICE_FEATURE_CATEGORIES.CO_SENSOR,
  DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
  DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
  DEVICE_FEATURE_CATEGORIES.BATTERY_LOW,
  DEVICE_FEATURE_CATEGORIES.TAMPER,
];
const DANGER_ON_VALUE_SENSORS_CATEGORY_TYPES = {
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_STATE]: [
    DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.DOOR_OPENED,
    DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.WINDOW_OPENED,
  ],
  [DEVICE_FEATURE_CATEGORIES.SIREN]: [DEVICE_FEATURE_TYPES.SIREN.TEST_IN_PROGRESS],
};

const BinaryDeviceValue = ({ deviceFeature }) => {
  const { category, type, last_value: lastValue = null } = deviceFeature;
  const reverseColors =
    DANGER_ON_VALUE_SENSORS.includes(category) ||
    (DANGER_ON_VALUE_SENSORS_CATEGORY_TYPES[category] &&
      DANGER_ON_VALUE_SENSORS_CATEGORY_TYPES[category].includes(type));

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
        'bg-secondary': !valued,
      })}
    >
      <Text id={`deviceFeatureValue.category.${category}.${type}.${value}`}>
        <Text id={`deviceFeatureValue.category.${category}.binary`} plural={value}>
          <Text id="deviceFeatureValue.type.binary" plural={value} />
        </Text>
      </Text>
    </span>
  );
};

export default BinaryDeviceValue;
