import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';
import RawDeviceValue from './RawDeviceValue';

const colorLowAsGreen = (value, safeLimit, warnLimit) => {
  if (value < safeLimit) {
    return 'success';
  } else if (value < warnLimit) {
    return 'warning';
  }

  return 'danger';
};

const BADGE_CATEGORIES = {
  [DEVICE_FEATURE_CATEGORIES.CO2_SENSOR]: value => colorLowAsGreen(value, 600, 1200)
};

const BadgeNumberDeviceValue = props => {
  const { category, last_value: lastValue = null, unit } = props.deviceFeature;

  const colorMethod = BADGE_CATEGORIES[category];
  if (!colorMethod) {
    return <RawDeviceValue {...props} />;
  }

  const value = lastValue === null ? -1 : lastValue;
  const valued = value !== -1;

  const colorClass = `bg-${valued ? colorMethod(value) : 'secondary'}`;

  return (
    <span class={cx('badge', colorClass)}>
      {!valued && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
      {valued && (
        <span>
          {`${lastValue} `}
          <Text id={`deviceFeatureUnitShort.${unit}`} />
        </span>
      )}
    </span>
  );
};

export default BadgeNumberDeviceValue;
