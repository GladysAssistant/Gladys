import { Text } from 'preact-i18n';
import { convertUnitDistance } from '../../../../../../../server/utils/units';

const DistanceSensorDeviceValue = ({ deviceFeature, user }) => {
  const { last_value: lastValue = null, unit } = deviceFeature;
  const userUnit = user.distance_unit_preference;
  let value = lastValue;
  let displayUnit = unit;

  // Convert the value to the user unit if needed
  if (displayUnit !== userUnit) {
    const conversion = convertUnitDistance(value, displayUnit, userUnit);
    value = conversion.value;
    displayUnit = conversion.unit;
  }

  return (
    <div>
      {lastValue === null && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
      {lastValue !== null && (
        <span>
          {`${value} `}
          <Text id={`deviceFeatureUnitShort.${displayUnit}`} />
        </span>
      )}
    </div>
  );
};

export default DistanceSensorDeviceValue;
