import { Text } from 'preact-i18n';

const PilotWireModeDeviceValue = ({ deviceFeature }) => (
  <div>
    {deviceFeature.last_value === null && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
    {deviceFeature.last_value !== null && (
      <Text
        id={`deviceFeatureValue.category.${deviceFeature.category}.${deviceFeature.type}.${deviceFeature.last_value}`}
      />
    )}
  </div>
);

export default PilotWireModeDeviceValue;
