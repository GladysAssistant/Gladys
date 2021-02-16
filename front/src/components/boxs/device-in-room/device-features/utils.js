import get from 'get-value';

const DISPLAY_FEATURE_NAME_SERVICES = ['mqtt', 'netatmo'];

export const getDeviceName = (device, feature) => {
  const service = get(device, 'service.name');
  if (service && DISPLAY_FEATURE_NAME_SERVICES.includes(service)) {
    return feature.name;
  }

  return device.name;
};
