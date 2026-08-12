import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';
import RawDeviceValue from './RawDeviceValue';

const LevelSensorLiquidStateDeviceValue = props => {
  const { type, last_value: lastValue = null } = props.deviceFeature;
  const valued = lastValue !== null;

  if (type !== DEVICE_FEATURE_TYPES.LEVEL_SENSOR.LIQUID_STATE) {
    return <RawDeviceValue {...props} />;
  }

  return (
    <span
      class={cx('badge', {
        'bg-primary': valued,
        'bg-secondary': !valued
      })}
    >
      {!valued && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
      {valued && (
        <Text id={`deviceFeatureValue.category.level-sensor.liquid-state.${lastValue}`}>
          <Text id={`deviceFeatureValue.category.level-sensor.liquid-state.unknown`} fields={{ value: lastValue }} />
        </Text>
      )}
    </span>
  );
};

export default LevelSensorLiquidStateDeviceValue;
