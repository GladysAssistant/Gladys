import get from 'get-value';

/**
 * All services are not equal.
 * Some services let the user edit the feature name,
 * some services are "device name" first.
 * Example: In Philips Hue, you give a name to each light, but
 * there is no need to give a need to each feature.
 *
 * In the MQTT integration, users are free to create a device with 1000 features, and
 * some users do that!
 *
 * We need to let the user display the feature name in those integrations,
 * but it's irrelevant to do it for all.
 */
const DISPLAY_FEATURE_NAME_FOR_THOSE_SERVICES = {
  mqtt: true
};

const matchFeature = (feature, selector, category, type) => {
  return feature.selector !== selector && feature.type === type;
};

const shouldDisplayDeviceName = (device, deviceFeature) => {
  const deviceService = get(device, 'service.name');

  // Force feature name according to service
  if (deviceService && DISPLAY_FEATURE_NAME_FOR_THOSE_SERVICES[deviceService]) {
    return false;
  }

  // Look for similar features
  const { features = [] } = device;
  const { category, type, selector } = deviceFeature;
  const uniqueFeature = features.findIndex(feature => matchFeature(feature, selector, category, type)) < 0;
  return uniqueFeature;
};

const getDeviceFeatureName = (dictionnary, device, feature) => {
  const displayDeviceName = shouldDisplayDeviceName(device, feature);

  if (displayDeviceName) {
    const featureDescription = get(dictionnary, `deviceFeatureCategory.${feature.category}.${feature.type}`);
    return `${device.name} (${featureDescription})`;
  }

  return `${device.name} (${feature.name})`;
};

const getDeviceName = (device, feature) => {
  const displayDeviceName = shouldDisplayDeviceName(device, feature);
  if (displayDeviceName) {
    return device.name;
  }

  return feature.name;
};

export { getDeviceFeatureName, getDeviceName, DISPLAY_FEATURE_NAME_FOR_THOSE_SERVICES };
