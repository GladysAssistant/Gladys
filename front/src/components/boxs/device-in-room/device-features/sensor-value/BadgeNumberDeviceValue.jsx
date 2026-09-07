import { Text } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_UNITS } from '../../../../../../../server/utils/constants';
import { smartRound } from '../../../../../../../server/utils/units';
import RawDeviceValue from './RawDeviceValue';

// Mass concentrations are declared in milligrams, micrograms or nanograms per cubic meter, while
// the thresholds below are in µg/m³. Without this conversion a sensor reporting mg/m³ would stay
// green a thousand times too long.
const microgramPerCubicMeterFactors = {
  [DEVICE_FEATURE_UNITS.MILLIGRAM_PER_CUBIC_METER]: 1000,
  [DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER]: 1,
  [DEVICE_FEATURE_UNITS.NANOGRAM_PER_CUBIC_METER]: 0.001
};

// A feature that declares no unit is assumed to already report µg/m³, which is what the Zigbee and
// Matter clusters use.
const toMicrogramPerCubicMeter = (value, unit) =>
  value * (microgramPerCubicMeterFactors[unit] === undefined ? 1 : microgramPerCubicMeterFactors[unit]);

const colorLowAsGreen = (value, safeLimit, warnLimit) => {
  if (value < safeLimit) {
    return 'success';
  } else if (value < warnLimit) {
    return 'warning';
  }

  return 'danger';
};

// Same as colorLowAsGreen, with the intermediate "orange" step the air quality guidelines for
// gaseous pollutants use between the informational and the alert threshold.
const colorLowAsGreenWithAlert = (value, safeLimit, warnLimit, alertLimit) => {
  if (value < safeLimit) {
    return 'success';
  } else if (value < warnLimit) {
    return 'warning';
  } else if (value < alertLimit) {
    return 'orange';
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

const LEVEL_MATTER_INDEX_COLOR = {
  unknown: 'secondary',
  low: 'success',
  medium: 'warning',
  high: 'orange',
  critical: 'danger'
};

const getLevelMatterIndexColor = value => {
  return LEVEL_MATTER_INDEX_COLOR[value];
};

const BADGE_CATEGORIES = {
  [DEVICE_FEATURE_CATEGORIES.CO2_SENSOR]: value => colorLowAsGreen(value, 600, 1200),
  [DEVICE_FEATURE_CATEGORIES.VOC_SENSOR]: value => colorLowAsGreen(value, 250, 2000),
  [DEVICE_FEATURE_CATEGORIES.VOC_INDEX_SENSOR]: value => getVocIndexColor(value),
  [DEVICE_FEATURE_CATEGORIES.VOC_MATTER_INDEX_SENSOR]: value => getLevelMatterIndexColor(value),
  [DEVICE_FEATURE_CATEGORIES.NO2_MATTER_INDEX_SENSOR]: value => getLevelMatterIndexColor(value),
  [DEVICE_FEATURE_CATEGORIES.PM10_SENSOR]: value => colorLowAsGreen(value, 30, 50),
  [DEVICE_FEATURE_CATEGORIES.PM25_SENSOR]: value => colorLowAsGreen(value, 15, 25),
  [DEVICE_FEATURE_CATEGORIES.FORMALDEHYD_SENSOR]: value => colorLowAsGreen(value, 50, 120),
  // Thresholds in µg/m³, so the value is normalized to that unit first.
  [DEVICE_FEATURE_CATEGORIES.NO2_SENSOR]: (value, unit) =>
    colorLowAsGreenWithAlert(toMicrogramPerCubicMeter(value, unit), 40, 100, 200),
  [DEVICE_FEATURE_CATEGORIES.O3_SENSOR]: (value, unit) =>
    colorLowAsGreenWithAlert(toMicrogramPerCubicMeter(value, unit), 100, 160, 240),
  [DEVICE_FEATURE_CATEGORIES.SO2_SENSOR]: (value, unit) =>
    colorLowAsGreenWithAlert(toMicrogramPerCubicMeter(value, unit), 40, 100, 300),
  [DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR]: value => getAqiColor(value),
  [DEVICE_FEATURE_CATEGORIES.RISK]: value => getRiskColor(value)
};

const BADGE_VALUE_CONVERTERS = {
  [DEVICE_FEATURE_CATEGORIES.RISK]: {
    0: 'no-risk',
    1: 'low-risk',
    2: 'medium-risk',
    3: 'high-risk'
  },
  [DEVICE_FEATURE_CATEGORIES.VOC_MATTER_INDEX_SENSOR]: {
    0: 'unknown',
    1: 'low',
    2: 'medium',
    3: 'high',
    4: 'critical'
  },
  [DEVICE_FEATURE_CATEGORIES.NO2_MATTER_INDEX_SENSOR]: {
    0: 'unknown',
    1: 'low',
    2: 'medium',
    3: 'high',
    4: 'critical'
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

  const colorClass = `bg-${valued ? colorMethod(value, unit) : 'secondary'}`;

  return (
    <span class={cx('badge', colorClass)}>
      {!valued && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
      {valued && !valueIsEnum && (
        <span>
          {`${smartRound(lastValue)} `}
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
