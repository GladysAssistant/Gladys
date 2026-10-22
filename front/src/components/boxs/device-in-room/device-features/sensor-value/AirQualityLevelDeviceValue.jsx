import { Text } from 'preact-i18n';
import cx from 'classnames';

import { AIR_QUALITY_LEVEL } from '../../../../../../../server/utils/constants';

// The same colour ladder as the air quality index badge (BadgeNumberDeviceValue), one step per
// level: a sensor reporting a level and one reporting an index read alike on the dashboard.
const LEVEL_COLORS = {
  [AIR_QUALITY_LEVEL.GOOD]: 'success',
  [AIR_QUALITY_LEVEL.FAIR]: 'warning',
  [AIR_QUALITY_LEVEL.MODERATE]: 'orange',
  [AIR_QUALITY_LEVEL.POOR]: 'pink',
  [AIR_QUALITY_LEVEL.VERY_POOR]: 'purple',
  [AIR_QUALITY_LEVEL.EXTREMELY_POOR]: 'danger'
};

const AirQualityLevelDeviceValue = props => {
  const { last_value: lastValue = null } = props.deviceFeature;
  const valued = lastValue !== null;

  return (
    <span class={cx('badge', `bg-${(valued && LEVEL_COLORS[lastValue]) || 'secondary'}`)}>
      {!valued && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
      {valued && (
        <Text id={`deviceFeatureValue.category.airquality-sensor.level.${lastValue}`}>
          <Text id="deviceFeatureValue.category.airquality-sensor.level.unknown" fields={{ value: lastValue }} />
        </Text>
      )}
    </span>
  );
};

export default AirQualityLevelDeviceValue;
