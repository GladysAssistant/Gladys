import { Text } from 'preact-i18n';
import cx from 'classnames';

// A muted detector is not a failure, but it cannot ring: the badge warns (orange) instead of
// raising an alarm (red), and is green while the detector is free to ring.
const SmokeSensorMutedDeviceValue = ({ deviceFeature }) => {
  const { category, type, last_value: lastValue = null } = deviceFeature;
  const valued = lastValue !== null;
  const muted = valued && lastValue !== 0;

  return (
    <span
      class={cx('badge', {
        'bg-warning': muted,
        'bg-success': valued && !muted,
        'bg-secondary': !valued
      })}
    >
      {!valued && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
      {valued && <Text id={`deviceFeatureValue.category.${category}.${type}.${lastValue}`} />}
    </span>
  );
};

export default SmokeSensorMutedDeviceValue;
