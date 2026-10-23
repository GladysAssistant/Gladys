import get from 'get-value';
import { DEVICE_FEATURE_STATE_COLUMNS } from '../../../server/utils/constants';

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

/**
 * @description Get Device param by name.
 * @param {Object} device - Device Object to parse.
 * @param {string} paramName - The name of the param to get.
 * @returns {string} Return param.
 * @example
 * const value = getDeviceParam({
 *  params: [{ name: 'test', value: 1 }]
 * }, 'test');
 */
function getDeviceParam(device, paramName) {
  if (!get(device, 'params')) {
    return null;
  }
  const param = device.params.find(oneParam => oneParam.name === paramName);
  if (param) {
    return param.value;
  }
  return null;
}

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

/**
 * @description Copy of a device without the states of its features that already exist, to post to
 * POST /api/v1/device. A device read from the API carries the last value of each feature, and a camera
 * image is up to 150 kB of base64: posted back as is, it pushed the save past the 100 kB JSON bound of
 * the API (413). The server never writes those columns from a save on an existing feature anyway
 * (device.create). An existing feature is recognized by its created_at, which every feature read from
 * the API carries and a discovered or client-built one never does, even when it was given an id (a
 * client-side uuid, or addEnergyFeatures on a discovered device): a new feature keeps the first value it
 * declares, the server stores it. Always returns a copy.
 * @param {object} device - The device to save.
 * @returns {object} The device to post.
 * @example
 * await httpClient.post('/api/v1/device', stripDeviceStatesForSave(device));
 */
const stripDeviceStatesForSave = device => {
  if (!device) {
    return device;
  }
  const deviceToSave = { ...device };
  if (Array.isArray(device.features)) {
    deviceToSave.features = device.features.map(feature => {
      if (!feature || !feature.created_at) {
        return feature;
      }
      const featureToSave = { ...feature };
      DEVICE_FEATURE_STATE_COLUMNS.forEach(column => {
        delete featureToSave[column];
      });
      return featureToSave;
    });
  }
  return deviceToSave;
};

export {
  getDeviceFeatureName,
  getDeviceName,
  getDeviceParam,
  stripDeviceStatesForSave,
  DISPLAY_FEATURE_NAME_FOR_THOSE_SERVICES
};
