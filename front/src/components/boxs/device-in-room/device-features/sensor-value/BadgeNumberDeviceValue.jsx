import { Text } from 'preact-i18n';
import get from 'get-value';
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

const getVocIndexColor = value => {
  if (value < 150) {
    return 'success';
  } else if (value < 250) {
    return 'warning';
  } else if (value < 400) {
    return 'orange';
  }
  return 'danger';
};

const RISK_COLORS = {
  'no-risk': 'success',
  'low-risk': 'warning',
  'medium-risk': 'orange',
  'high-risk': 'danger',
  unknown: 'secondary'
};

const getRiskColor = value => {
  return RISK_COLORS[value];
};

const BADGE_CATEGORIES = {
  [DEVICE_FEATURE_CATEGORIES.CO2_SENSOR]: value => colorLowAsGreen(value, 600, 1200),
  [DEVICE_FEATURE_CATEGORIES.VOC_SENSOR]: value => colorLowAsGreen(value, 250, 2000),
  [DEVICE_FEATURE_CATEGORIES.VOC_INDEX_SENSOR]: value => getVocIndexColor(value),
  [DEVICE_FEATURE_CATEGORIES.PM25_SENSOR]: value => colorLowAsGreen(value, 12, 35),
  [DEVICE_FEATURE_CATEGORIES.FORMALDEHYD_SENSOR]: value => colorLowAsGreen(value, 50, 120),
  [DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR]: value => getAqiColor(value),
  [DEVICE_FEATURE_CATEGORIES.RISK]: value => getRiskColor(value)
};

const BADGE_VALUE_CONVERTERS = {
  [DEVICE_FEATURE_CATEGORIES.RISK]: {
    0: 'no-risk',
    1: 'low-risk',
    2: 'medium-risk',
    3: 'high-risk'
  }
};

const BadgeNumberDeviceValue = props => {
  const { category, type, last_value: lastValue = null, unit } = props.deviceFeature;

  const colorMethod = BADGE_CATEGORIES[category];
  if (!colorMethod) {
    return <RawDeviceValue {...props} />;
  }

  let value = lastValue === null ? -1 : lastValue;
  let valueIsEnum = false;
  const valued = value !== -1;

  // If the category is an enum
  // We need to convert the string to text
  if (BADGE_VALUE_CONVERTERS[category]) {
    value = get(BADGE_VALUE_CONVERTERS[category], value, 'unknown');
    valueIsEnum = true;
  }

  const colorClass = `bg-${valued ? colorMethod(value) : 'secondary'}`;

  return (
    <span class={cx('badge', colorClass)}>
      {!valued && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
      {valued && !valueIsEnum && (
        <span>
          {`${lastValue} `}
          <Text id={`deviceFeatureUnitShort.${unit}`} />
        </span>
      )}
      {valued && valueIsEnum && (
        <span>
          <Text id={`deviceFeatureValue.category.${category}.${type}.${value}`} />
        </span>
      )}
    </span>
  );
};

export default BadgeNumberDeviceValue;
