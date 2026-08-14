import { Text } from 'preact-i18n';

// A text state is displayed raw, except when the feature declares supported_options
// (a read-only dynamic select): the matching option's label replaces the technical
// identifier the device reports ('Netflix' instead of 'com.netflix.app')
const displayValue = deviceFeature => {
  const options = Array.isArray(deviceFeature.supported_options) ? deviceFeature.supported_options : [];
  const matchingOption = options.find(option => `${option.value}` === `${deviceFeature.last_value_string}`);
  return matchingOption && matchingOption.label ? matchingOption.label : deviceFeature.last_value_string;
};

const RawDeviceValue = ({ deviceFeature }) => (
  <div>
    {deviceFeature.last_value_string === null && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
    {deviceFeature.last_value_string !== null && <span>{displayValue(deviceFeature)}</span>}
  </div>
);

export default RawDeviceValue;
