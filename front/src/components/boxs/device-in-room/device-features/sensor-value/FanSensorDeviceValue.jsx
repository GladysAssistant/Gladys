import { Text } from 'preact-i18n';

const FanSensorDeviceValue = ({ deviceFeature }) => {
  const { category, type, last_value: lastValue } = deviceFeature;

  if (lastValue === null) {
    return <Text id="dashboard.boxes.devicesInRoom.noValue" />;
  }

  return <Text id={`deviceFeatureValue.category.${category}.${type}.${lastValue}`} />;
};

export default FanSensorDeviceValue;
