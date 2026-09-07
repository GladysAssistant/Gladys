const { NotFoundError, BadParameters } = require('../../utils/coreErrors');
const { buildUniqueSelector } = require('../../utils/addSelector');
const { areObjectsEqual, pick } = require('../../utils/objects');
const db = require('../../models');

const UPDATABLE_FIELDS = ['category', 'type', 'unit', 'min', 'max', 'step'];

// these columns are NULL in DB when the caller says nothing about them, and
// most payloads simply omit the key: compared with ===, an absent 'step'
// would differ from the stored null and send every no-op call through the
// update branch. Normalizing also makes an omission authoritative — it is
// what clears a value that is no longer declared.
const NULLABLE_FIELDS = ['unit', 'min', 'max', 'step'];

/**
 * @description Give an explicit null to the nullable fields the caller omitted.
 * @param {object} feature - The device feature to normalize.
 * @returns {object} The feature, with every nullable field present.
 * @example
 * normalizeNullableFields({ category: 'light' });
 */
function normalizeNullableFields(feature) {
  const normalized = { ...feature };
  NULLABLE_FIELDS.forEach((field) => {
    if (normalized[field] === undefined) {
      normalized[field] = null;
    }
  });
  return normalized;
}

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
  const normalizedFeature = normalizeNullableFields(feature);

  // if the feature does not already exist, we create it.
  if (featureIndex === -1) {
    // same unique selector constraint as in device.create: a feature named
    // like one of another device must not fail the creation
    const featureToCreate = { ...feature, device_id: device.id };
    const uniqueSelector = await buildUniqueSelector(
      db.DeviceFeature,
      featureToCreate.selector || featureToCreate.name,
    );
    if (uniqueSelector) {
      featureToCreate.selector = uniqueSelector;
    }
    const createdFeature = await db.DeviceFeature.create(featureToCreate);
    featureInStore = createdFeature.get({ plain: true });
    device.features.push(featureInStore);
    // we save again the device in RAM
    this.add(device);
  } else if (!areObjectsEqual(normalizeNullableFields(featureInStore), normalizedFeature, UPDATABLE_FIELDS)) {
    // static update resolves with [affectedCount], not with the row: the
    // updated feature has to be read back before going to the RAM store
    await db.DeviceFeature.update(pick(normalizedFeature, UPDATABLE_FIELDS), {
      where: { id: featureInStore.id },
    });
    const updatedFeature = await db.DeviceFeature.findOne({ where: { id: featureInStore.id } });
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
