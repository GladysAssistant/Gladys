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

const getDeviceFeatureName = (dictionnary, device, deviceFeature) => {
  const deviceService = get(device, 'service.name');
  const featureDescription = get(dictionnary, `deviceFeatureCategory.${deviceFeature.category}.${deviceFeature.type}`);
  if (deviceService && DISPLAY_FEATURE_NAME_FOR_THOSE_SERVICES[deviceService]) {
    return deviceFeature.name;
  }
  return `${device.name} (${featureDescription})`;
};

export { getDeviceFeatureName, DISPLAY_FEATURE_NAME_FOR_THOSE_SERVICES };
