import get from 'get-value';

const getDeviceFeatureName = (dictionnary, device, deviceFeature) => {
  const featureDescription = get(dictionnary, `deviceFeatureCategory.${deviceFeature.category}.${deviceFeature.type}`);
  return `${device.name} (${featureDescription})`;
};

export { getDeviceFeatureName };
