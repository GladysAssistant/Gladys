import { Text } from 'preact-i18n';

import DeviceFeature from './DeviceFeature';

const DeviceFeatures = ({ features = [] }) => {
  if (features.length > 0) {
    return (
      <div class="tags device-features">
        {features.map(feature => (
          <DeviceFeature feature={feature} />
        ))}
      </div>
    );
  }

  return (
    <div class="font-italic device-features">
      <Text id="device.noFeatures" />
    </div>
  );
};

export default DeviceFeatures;
