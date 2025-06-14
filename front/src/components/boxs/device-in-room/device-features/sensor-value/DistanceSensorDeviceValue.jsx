import { Text } from 'preact-i18n';
import { checkAndConvertUnit } from '../../../../../../../server/utils/units';

const DistanceSensorDeviceValue = ({ deviceFeature, user }) => {
  const { last_value: lastValue = null, unit } = deviceFeature;
  const { distance_unit_preference: userUnitPreference } = user;

  // Convert the value to the user unit if needed
  const { value: displayValue, unit: displayUnit } = checkAndConvertUnit(lastValue, unit, userUnitPreference);

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
