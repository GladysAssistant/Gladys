const db = require('../../models');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');
const { getStandardDeviceIncludes } = require('../../utils/deviceQueryIncludes');
const { isEnergySourceFeature, findCycle } = require('../../utils/energyHierarchy');
const { isElectricMeter } = require('../../utils/enforceEnergyHierarchy');

/**
 * @description Check that a parent change is the attachment of a device to another device, the
 * only link the user may change (docs/specs/energy-hierarchy.md, section D.2): the derived links
 * (index -> consumption -> cost, on one device) are maintained by Gladys, and an electric meter
 * stays a root.
 * @param {object} feature - The feature to update.
 * @param {string|null} newParentId - The requested parent.
 * @returns {Promise<object|null>} The new parent (null for a root); rejects with BadParameters or
 * NotFoundError.
 * @example
 * await assertAttachmentChange(feature, 'uuid-of-parent');
 */
async function assertAttachmentChange(feature, newParentId) {
  if (!isEnergySourceFeature(feature)) {
    throw new BadParameters('energy_parent_id: only an energy index or consumption is attached to a meter');
  }
  const currentParent = feature.energy_parent_id ? await db.DeviceFeature.findByPk(feature.energy_parent_id) : null;
  if (currentParent && currentParent.device_id === feature.device_id) {
    throw new BadParameters('energy_parent_id: this link is derived and maintained by Gladys');
  }
  if (!newParentId) {
    return null;
  }
  const newParent = await db.DeviceFeature.findByPk(newParentId);
  if (!newParent) {
    throw new NotFoundError('Parent DeviceFeature not found');
  }
  if (newParent.device_id === feature.device_id) {
    throw new BadParameters('energy_parent_id: a device is attached to another device');
  }
  if (await isElectricMeter(feature.device_id)) {
    throw new BadParameters('energy_parent_id: an electric meter is a root');
  }
  return newParent;
}

/**
 * @description Update a device feature (by selector).
 * @param {string} selector - Device feature selector.
 * @param {object} updates - Partial fields to update.
 * @returns {Promise<object>} The updated device feature (plain object).
 * @example
 * await gladys.device.updateFeature('kitchen-washer-consumption', { energy_parent_id: 'uuid-of-parent' });
 */
async function updateFeature(selector, updates) {
  const allowed = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'energy_parent_id')) {
    allowed.energy_parent_id = updates.energy_parent_id || null;
  }
  // nothing to update
  if (Object.keys(allowed).length === 0) {
    const existing = await db.DeviceFeature.findOne({ where: { selector } });
    if (!existing) {
      throw new NotFoundError('DeviceFeature not found');
    }
    return existing.get({ plain: true });
  }

  // Find current feature (by selector)
  const feature = await db.DeviceFeature.findOne({ where: { selector } });
  if (!feature) {
    throw new NotFoundError('DeviceFeature not found');
  }

  const newParentId = allowed.energy_parent_id;
  const newParent = await assertAttachmentChange(feature, newParentId);

  // Prevent circular dependency: walk up the ancestry of the proposed parent
  if (newParent) {
    const getFeature = (id) => (id === newParent.id ? newParent : db.DeviceFeature.findByPk(id));
    const cycle = await findCycle({ id: feature.id, energy_parent_id: newParent.id }, getFeature);
    if (cycle !== null) {
      throw new BadParameters('Circular energy_parent_id not allowed');
    }
  }

  const [count] = await db.DeviceFeature.update(allowed, { where: { selector } });
  if (count === 0) {
    throw new NotFoundError('DeviceFeature not found');
  }
  const updated = await db.DeviceFeature.findOne({ where: { selector } });
  const plain = updated.get({ plain: true });

  // Reload the full device from DB with all features (same pattern as device.init)
  const fullDevice = await db.Device.findOne({
    where: { id: plain.device_id },
    include: getStandardDeviceIncludes(),
  });

  if (fullDevice) {
    const plainDevice = fullDevice.get({ plain: true });
    // Use device.add to update all caches consistently
    this.add(plainDevice);
  }

  return plain;
}

module.exports = {
  updateFeature,
};
