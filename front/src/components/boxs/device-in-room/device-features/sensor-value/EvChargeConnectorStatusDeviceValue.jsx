import { Text } from 'preact-i18n';
import cx from 'classnames';

const EvChargeConnectorStatusDeviceValue = props => {
  const { last_value: lastValue = null } = props.deviceFeature;
  const valued = lastValue !== null;

  return (
    <span
      class={cx('badge', {
        'bg-primary': valued,
        'bg-secondary': !valued
      })}
    >
      {!valued && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
      {valued && (
        <Text id={`deviceFeatureValue.category.electrical-vehicle-charge.connector-status.${lastValue}`}>
          <Text
            id="deviceFeatureValue.category.electrical-vehicle-charge.connector-status.unknown"
            fields={{ value: lastValue }}
          />
        </Text>
      )}
    </span>
  );
};

export default EvChargeConnectorStatusDeviceValue;
