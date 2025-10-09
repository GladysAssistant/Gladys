const db = require('../../models');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');

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

  // Prevent circular dependency: walk up the ancestry of the proposed parent
  const newParentId = allowed.energy_parent_id;
  if (newParentId) {
    let cursor = await db.DeviceFeature.findByPk(newParentId);
    // If parent doesn't exist, allow null-like behavior? We'll let DB constraint fail if invalid
    while (cursor) {
      if (cursor.id === feature.id) {
        throw new BadParameters('Circular energy_parent_id not allowed');
      }
      if (!cursor.energy_parent_id) {
        break;
      }
      // move to next ancestor
      // eslint-disable-next-line no-await-in-loop
      cursor = await db.DeviceFeature.findByPk(cursor.energy_parent_id);
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
    include: [
      {
        model: db.DeviceFeature,
        as: 'features',
      },
      {
        model: db.DeviceParam,
        as: 'params',
      },
      {
        model: db.Room,
        as: 'room',
      },
      {
        model: db.Service,
        as: 'service',
      },
    ],
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
