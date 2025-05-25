import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';

const DANGER_ON_VALUE_SENSORS = [
  DEVICE_FEATURE_CATEGORIES.CO_SENSOR,
  DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
  DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
  DEVICE_FEATURE_CATEGORIES.BATTERY_LOW,
  DEVICE_FEATURE_CATEGORIES.TAMPER
];

const BinaryDeviceValue = ({ deviceFeature }) => {
  const { category, last_value: lastValue = null } = deviceFeature;
  const reverseColors = DANGER_ON_VALUE_SENSORS.includes(category);

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
        <Text id="deviceFeatureValue.type.binary" plural={value} />
      </Text>
    </span>
  );
};

export default BinaryDeviceValue;
