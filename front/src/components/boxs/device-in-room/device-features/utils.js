import get from 'get-value';
import { DISPLAY_FEATURE_NAME_FOR_THOSE_SERVICES } from '../../../../utils/device';

export const getDeviceName = (device, feature) => {
  const service = get(device, 'service.name');

  // some service are different, the feature name is more important than the device name
  // but it's not universal
  if (service && DISPLAY_FEATURE_NAME_FOR_THOSE_SERVICES[service]) {
    return feature.name;
  }

  return device.name;
};
