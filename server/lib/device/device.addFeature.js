const { NotFoundError, BadParameters } = require('../../utils/coreErrors');
const { areObjectsEqual, pick } = require('../../utils/objects');
const db = require('../../models');

const UPDATABLE_FIELDS = ['category', 'type', 'unit', 'min', 'max'];

/**
 * @description Add a feature to a device.
 * @param {string} deviceSelector - The selector of the device.
 * @param {object} feature - The new device feature.
 * @returns {Promise<object>} Resolve with new device.
 * @example
 * device.addFeature('device', {
 *    name: 'On/Off',
 *    external_id: 'philips-hue:1:binary',
 *    category: 'light',
 *    type: 'binary',
 *    read_only: false,
 *    keep_history: true,
 *    has_feedback: false,
 *    min: 0,
 *    max: 1
 * });
 */
async function addFeature(deviceSelector, feature) {
  // external_id is a required parameter
  if (!feature.external_id) {
    throw new BadParameters('A feature must have an external_id.');
  }
  // first, we get the device in the RAM store
  const device = this.stateManager.get('device', deviceSelector);
  // if the device doesn't exist, we throw an error.
  if (device === null) {
    throw new NotFoundError('Device not found');
  }
  // if the device exists, we find the feature based on the external_id
  const featureIndex = device.features.findIndex((f) => f.external_id === feature.external_id);
  let featureInStore = device.features[featureIndex];

  // if the feature does not already exist, we create it.
  if (featureIndex === -1) {
    const createdFeature = await db.DeviceFeature.create({ ...feature, device_id: device.id });
    featureInStore = createdFeature.get({ plain: true });
    device.features.push(featureInStore);
    // we save again the device in RAM
    this.add(device);
  } else if (!areObjectsEqual(featureInStore, feature, UPDATABLE_FIELDS)) {
    const updatedFeature = await db.DeviceFeature.update(pick(feature, UPDATABLE_FIELDS), {
      where: { id: featureInStore.id },
    });
    featureInStore = updatedFeature.get({ plain: true });
    device.features[featureIndex] = featureInStore;
    // we save again the device in RAM
    this.add(device);
  }

  // we resolve with the device
  return Promise.resolve(device);
}

module.exports = {
  addFeature,
};
