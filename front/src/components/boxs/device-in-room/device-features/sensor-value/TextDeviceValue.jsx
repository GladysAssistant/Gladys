import { Text } from 'preact-i18n';

const RawDeviceValue = ({ deviceFeature }) => (
  <div>
    {deviceFeature.last_value_string === null && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
    {deviceFeature.last_value_string !== null && <span>{deviceFeature.last_value_string}</span>}
  </div>
);

export default RawDeviceValue;
