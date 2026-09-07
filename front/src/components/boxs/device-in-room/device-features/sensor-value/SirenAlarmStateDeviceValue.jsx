import { Text } from 'preact-i18n';
import cx from 'classnames';

import { SIREN_MODE } from '../../../../../../../server/utils/constants';

const SirenAlarmStateDeviceValue = props => {
  const { last_value: lastValue = null } = props.deviceFeature;
  const valued = lastValue !== null;
  // Anything but IDLE means the siren is currently ringing or flashing
  const alarming = valued && Number(lastValue) !== SIREN_MODE.IDLE;

  return (
    <span
      class={cx('badge', {
        'bg-danger': alarming,
        'bg-success': valued && !alarming,
        'bg-secondary': !valued
      })}
    >
      {!valued && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
      {valued && (
        <Text id={`deviceFeatureValue.category.siren.alarm-state.${lastValue}`}>
          <Text id="deviceFeatureValue.category.siren.alarm-state.unknown" fields={{ value: lastValue }} />
        </Text>
      )}
    </span>
  );
};

export default SirenAlarmStateDeviceValue;
