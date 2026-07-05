import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';
import RawDeviceValue from './RawDeviceValue';

const WaterValveDeviceValue = props => {
  const { type, last_value: lastValue = null } = props.deviceFeature;
  const valued = lastValue !== null;

  if (type !== DEVICE_FEATURE_TYPES.WATER_VALVE.CURRENT_DEVICE_STATUS) {
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
        <Text id={`deviceFeatureValue.category.water-valve.current-device-status.${lastValue}`}>
          <Text
            id={`deviceFeatureValue.category.water-valve.current-device-status.unknown`}
            fields={{ value: lastValue }}
          />
        </Text>
      )}
    </span>
  );
};

export default WaterValveDeviceValue;
