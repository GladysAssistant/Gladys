import { Text } from 'preact-i18n';
import { celsiusToFahrenheit, fahrenheitToCelsius } from '../../../../../../../server/utils/units';
import { DEVICE_FEATURE_UNITS } from '../../../../../../../server/utils/constants';

const TemperatureSensorDeviceValue = ({ deviceFeature, user }) => {
  const deviceUnit = deviceFeature.unit;
  const userUnit = user.temperature_unit_preference;
  let value = deviceFeature.last_value;

  // Convert the value to the user unit if needed
  if (deviceUnit !== userUnit) {
    if (deviceUnit === DEVICE_FEATURE_UNITS.CELSIUS) {
      value = celsiusToFahrenheit(deviceFeature.last_value);
    } else {
      value = fahrenheitToCelsius(deviceFeature.last_value);
    }
  }

  // Round to one decimal place
  value = Math.round(value * 10) / 10;

  return (
    <div>
      {deviceFeature.last_value === null && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
      {deviceFeature.last_value !== null && (
        <span>
          {`${value} `}
          <Text id={`deviceFeatureUnitShort.${userUnit}`} />
        </span>
      )}
    </div>
  );
};

export default TemperatureSensorDeviceValue;
