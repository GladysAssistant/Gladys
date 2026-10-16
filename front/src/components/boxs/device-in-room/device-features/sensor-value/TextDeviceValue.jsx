import { Text } from 'preact-i18n';

import { getOptionLabel } from '../../../../../utils/supportedOptions';

// A text state is displayed raw, except when the feature declares supported_options
// (a read-only dynamic select): the matching option's label replaces the technical
// identifier the device reports ('Netflix' instead of 'com.netflix.app'), in the user's
// language when the integration published it in several
const displayValue = (deviceFeature, language) => {
  const options = Array.isArray(deviceFeature.supported_options) ? deviceFeature.supported_options : [];
  const matchingOption = options.find(option => `${option.value}` === `${deviceFeature.last_value_string}`);
  return getOptionLabel(matchingOption, language) || deviceFeature.last_value_string;
};

// text-device-value: the one dashboard value that is free-form text of any length — the glass
// theme lets it wrap where every other control stays on one line (routes/dashboard/style.css)
const RawDeviceValue = ({ deviceFeature, user }) => (
  <div class="text-device-value">
    {deviceFeature.last_value_string === null && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
    {deviceFeature.last_value_string !== null && <span>{displayValue(deviceFeature, user && user.language)}</span>}
  </div>
);

export default RawDeviceValue;
