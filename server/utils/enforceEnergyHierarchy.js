const db = require('../models');
const logger = require('./logger');
const { ENERGY_CONTRACT_DIRECTIONS } = require('./constants');
const { isEnergySourceFeature, findCycle, findLinkToCut } = require('./energyHierarchy');

const FEATURE_ATTRIBUTES = ['id', 'device_id', 'category', 'type', 'selector', 'energy_parent_id'];

/**
 * @description Tell whether a device is an electric meter: the meter of at least one
 * consumption contract (docs/specs/energy-hierarchy.md, section B).
 * @param {string} deviceId - The device id.
 * @param {object} [options] - Query options.
 * @param {object} [options.transaction] - Sequelize transaction.
 * @returns {Promise<boolean>} True when the device carries a consumption contract.
 * @example
 * await isElectricMeter('a8b3c7d5-…');
 */
async function isElectricMeter(deviceId, { transaction } = {}) {
  const count = await db.EnergyContract.count({
    where: { electric_meter_device_id: deviceId, direction: ENERGY_CONTRACT_DIRECTIONS.CONSUMPTION },
    transaction,
  });
  return count > 0;
}

/**
 * @description Enforce the invariants of the energy hierarchy on the features of a device that
 * was just saved (docs/specs/energy-hierarchy.md, section C.1), whatever the integration sent: an
 * electric meter stays a root (its energy source features never get a parent on another device),
 * and a parent closing a cycle is cut on the right link. The features are updated in place.
 * @param {string} deviceId - The saved device id.
 * @param {Array} savedFeatures - Its saved features (plain objects, updated in place).
 * @param {object} [options] - Query options.
 * @param {object} [options.transaction] - Sequelize transaction.
 * @returns {Promise<void>} Resolves when the hierarchy is sound.
 * @example
 * await enforceEnergyHierarchy(device.id, features, { transaction });
 */
async function enforceEnergyHierarchy(deviceId, savedFeatures, { transaction } = {}) {
  if (!savedFeatures.some((feature) => feature.energy_parent_id)) {
    return;
  }
  const ownById = new Map(savedFeatures.map((feature) => [feature.id, feature]));
  const clearParent = async (feature, reason) => {
    logger.warn(`Energy hierarchy: feature "${feature.selector}" detached from its parent (${reason})`);
    await db.DeviceFeature.update({ energy_parent_id: null }, { where: { id: feature.id }, transaction });
    feature.energy_parent_id = null;
  };

  // an electric meter is a root: a discovery falling back on the main meter must not attach it
  const crossDeviceAttachments = savedFeatures.filter(
    (feature) => isEnergySourceFeature(feature) && feature.energy_parent_id && !ownById.has(feature.energy_parent_id),
  );
  if (crossDeviceAttachments.length > 0 && (await isElectricMeter(deviceId, { transaction }))) {
    // eslint-disable-next-line no-restricted-syntax
    for (const feature of crossDeviceAttachments) {
      // eslint-disable-next-line no-await-in-loop
      await clearParent(feature, 'an electric meter is a root');
    }
  }

  // no cycle: the features of other devices are read once, in the same transaction
  const otherFeatures = new Map();
  const getFeature = async (id) => {
    if (ownById.has(id)) {
      return ownById.get(id);
    }
    if (!otherFeatures.has(id)) {
      const row = await db.DeviceFeature.findByPk(id, { attributes: FEATURE_ATTRIBUTES, transaction });
      otherFeatures.set(id, row ? row.get({ plain: true }) : null);
    }
    return otherFeatures.get(id);
  };
  // Sequential on purpose: cutting a link changes the cycles of the next features
  // eslint-disable-next-line no-restricted-syntax
  for (const feature of savedFeatures) {
    // eslint-disable-next-line no-await-in-loop
    const cycle = await findCycle(feature, getFeature);
    if (cycle !== null) {
      // only the links of this device are ours to cut
      const child = findLinkToCut(cycle, (candidate) => ownById.has(candidate.id));
      // eslint-disable-next-line no-await-in-loop
      await clearParent(child, 'circular energy hierarchy');
    }
  }
}

module.exports = {
  enforceEnergyHierarchy,
  isElectricMeter,
};
