import { Text } from 'preact-i18n';
import cx from 'classnames';

import { WATER_VALVE_CURRENT_DEVICE_STATUS } from '../../../../../../../server/utils/constants';

const WaterValveDeviceValue = props => {
  const { last_value: lastValue = null } = props.deviceFeature;
  const valued = lastValue !== null;
  const leakage =
    lastValue === WATER_VALVE_CURRENT_DEVICE_STATUS.WATER_LEAKAGE ||
    lastValue === WATER_VALVE_CURRENT_DEVICE_STATUS.WATER_SHORTAGE_AND_WATER_LEAKAGE;
  const shortage = lastValue === WATER_VALVE_CURRENT_DEVICE_STATUS.WATER_SHORTAGE;
  const normal = lastValue === WATER_VALVE_CURRENT_DEVICE_STATUS.NORMAL_STATE;

  return (
    <span
      class={cx('badge', {
        'bg-danger': leakage,
        'bg-warning': shortage,
        'bg-success': normal,
        'bg-primary': valued && !leakage && !shortage && !normal,
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
