import { Text } from 'preact-i18n';
import { checkAndConvertUnit } from '../../../../../../../server/utils/units';

const DistanceSensorDeviceValue = ({ deviceFeature, user }) => {
  const { last_value: lastValue = null, unit } = deviceFeature;
  const userUnitPreference = user.distance_unit_preference;

  // Convert the value to the user unit if needed
  const conversion = checkAndConvertUnit(lastValue, unit, userUnitPreference);
  const displayValue = conversion.value;
  const displayUnit = conversion.unit;

  return (
    <div>
      {displayValue === null && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
      {displayValue !== null && (
        <span>
          {`${displayValue} `}
          <Text id={`deviceFeatureUnitShort.${displayUnit}`} />
        </span>
      )}
    </div>
  );
};

export default DistanceSensorDeviceValue;
