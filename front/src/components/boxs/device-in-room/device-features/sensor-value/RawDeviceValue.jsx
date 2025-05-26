import { Text } from 'preact-i18n';

import { convertUnitDistance } from '../../../../../../../server/utils/units';
import { DISTANCE_UNITS } from '../../../../../../../server/utils/constants';

const RawDeviceValue = ({ deviceFeature, user }) => {
  let value = deviceFeature.last_value;
  let displayUnit = deviceFeature.unit;

  const isDistanceUnit = DISTANCE_UNITS.DEVICE_FEATURE_UNITS.includes(displayUnit);
  // Conversion if necessary (and if user is present)
  if (user && value !== null && isDistanceUnit) {
    const userUnit = user.distance_unit_preference;
    const conversion = convertUnitDistance(value, displayUnit, userUnit);
    value = conversion.value;
    displayUnit = conversion.unit;
  }

  return (
    <div>
      {value === null && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
      {value !== null && (
        <span>
          {`${value} `}
          <Text id={`deviceFeatureUnitShort.${displayUnit}`} />
        </span>
      )}
    </div>
  );
};

export default RawDeviceValue;
