import { Text } from 'preact-i18n';
import cx from 'classnames';

const ChargingStationChargingStateDeviceValue = (props) => {
  const { last_value: lastValue = null } = props.deviceFeature;
  const valued = lastValue !== null;

  return (
    <span
      class={cx('badge', {
        'bg-primary': valued,
        'bg-secondary': !valued,
      })}
    >
      {!valued && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
      {valued && (
        <Text id={`deviceFeatureValue.category.charging-station.charging-state.${lastValue}`}>
          <Text
            id="deviceFeatureValue.category.charging-station.charging-state.unknown"
            fields={{ value: lastValue }}
          />
        </Text>
      )}
    </span>
  );
};

export default ChargingStationChargingStateDeviceValue;
