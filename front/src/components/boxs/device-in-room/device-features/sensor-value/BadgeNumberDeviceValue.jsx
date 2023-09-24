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

const getAqiColor = value => {
  if (value < 50) {
    // Safe
    return 'success';
  } else if (value < 100) {
    // Moderate
    return 'warning';
  } else if (value < 150) {
    // Unhealthy for Sensitive Groups
    return 'orange';
  } else if (value < 200) {
    // Unhealthy
    return 'pink';
  } else if (value < 300) {
    // Very Unhealthy
    return 'purple';
  }
  // Hazardous
  return 'danger';
};

const BADGE_CATEGORIES = {
  [DEVICE_FEATURE_CATEGORIES.CO2_SENSOR]: value => colorLowAsGreen(value, 600, 1200),
  [DEVICE_FEATURE_CATEGORIES.VOC_SENSOR]: value => colorLowAsGreen(value, 250, 2000),
  [DEVICE_FEATURE_CATEGORIES.PM25_SENSOR]: value => colorLowAsGreen(value, 12, 35),
  [DEVICE_FEATURE_CATEGORIES.FORMALDEHYD_SENSOR]: value => colorLowAsGreen(value, 50, 120),
  [DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR]: value => getAqiColor(value)
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
