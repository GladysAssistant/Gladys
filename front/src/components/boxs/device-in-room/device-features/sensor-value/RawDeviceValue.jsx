import { Text } from 'preact-i18n';

const RawDeviceValue = ({ deviceFeature }) => (
  <div>
    {deviceFeature.last_value === null && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
    {deviceFeature.last_value !== null && (
      <span>
        {`${deviceFeature.last_value} `}
        <Text id={`deviceFeatureUnitShort.${deviceFeature.unit}`} />
      </span>
    )}
  </div>
);

export default RawDeviceValue;
