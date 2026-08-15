import { Text } from 'preact-i18n';

import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  OPENING_SENSOR_STATE
} from '../../../../server/utils/constants';

const roundValue = value => Math.round(value * 10) / 10;

// Compact text rendering of a device feature's last value, used by widgets
// that display a state inline (chips bar, scene status subtitle)
const DeviceFeatureValueText = ({ feature }) => {
  if (!feature || feature.last_value === null || feature.last_value === undefined) {
    return <Text id="deviceFeatureValue.noValue" />;
  }
  if (feature.category === DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR) {
    return feature.last_value === OPENING_SENSOR_STATE.OPEN ? (
      <Text id="deviceFeatureValue.open" />
    ) : (
      <Text id="deviceFeatureValue.closed" />
    );
  }
  if (feature.type === DEVICE_FEATURE_TYPES.SENSOR.BINARY || feature.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY) {
    return feature.last_value ? <Text id="deviceFeatureValue.on" /> : <Text id="deviceFeatureValue.off" />;
  }
  return (
    <span>
      {roundValue(feature.last_value)}
      {feature.unit && (
        <span>
          {' '}
          <Text id={`deviceFeatureUnitShort.${feature.unit}`} />
        </span>
      )}
    </span>
  );
};

export default DeviceFeatureValueText;
