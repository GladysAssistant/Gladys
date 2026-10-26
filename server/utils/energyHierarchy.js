const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('./constants');
const { ENERGY_INDEX_FEATURE_TYPES } = require('../services/energy-monitoring/utils/constants');

// The roles of the energy features in the hierarchy (docs/specs/energy-hierarchy.md, section B).
// A derived link always goes from a lower rank to a higher or equal one: cost -> consumption ->
// index (and, for Enedis, 30-minute load curve -> daily consumption).
const RANK = { INDEX: 3, CONSUMPTION: 2, COST: 1, OTHER: 0 };

const CONSUMPTION_TYPES = [
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
];
const COST_TYPES = [
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST,
];
// the order in which the index types are preferred as the root feature of a meter: the total
// index of a Linky (`east`) before its tariff bands (`easf01`...)
const INDEX_PRIORITY = Object.values(ENERGY_INDEX_FEATURE_TYPES).flat();

const isEnergyIndexFeature = (feature) =>
  Boolean(ENERGY_INDEX_FEATURE_TYPES[feature.category]) &&
  ENERGY_INDEX_FEATURE_TYPES[feature.category].includes(feature.type);

const isEnergyConsumptionFeature = (feature) =>
  feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR && CONSUMPTION_TYPES.includes(feature.type);

const isEnergyCostFeature = (feature) =>
  feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR && COST_TYPES.includes(feature.type);

/**
 * @description Tell whether a feature measures energy by itself (a cumulative index or a
 * consumption): the only features that attach a device to a meter.
 * @param {object} feature - The feature.
 * @returns {boolean} True for an energy source feature.
 * @example
 * isEnergySourceFeature({ category: 'energy-sensor', type: 'index' });
 */
const isEnergySourceFeature = (feature) => isEnergyIndexFeature(feature) || isEnergyConsumptionFeature(feature);

/**
 * @description The rank of a feature in the hierarchy: index 3, consumption 2, cost 1, other 0.
 * @param {object} feature - The feature.
 * @returns {number} Its rank.
 * @example
 * getEnergyRank({ category: 'energy-sensor', type: 'thirty-minutes-consumption-cost' }); // 1
 */
function getEnergyRank(feature) {
  if (isEnergyIndexFeature(feature)) {
    return RANK.INDEX;
  }
  if (isEnergyConsumptionFeature(feature)) {
    return RANK.CONSUMPTION;
  }
  if (isEnergyCostFeature(feature)) {
    return RANK.COST;
  }
  return RANK.OTHER;
}

/**
 * @description The attachment features of a device: its energy source features that are not
 * the child of a derived link (no parent, or a parent on another device). They are what attaches
 * the device to a meter.
 * @param {object} device - The device, with its features.
 * @returns {Array} Its attachment features, in the device order.
 * @example
 * getAttachmentFeatures(device);
 */
function getAttachmentFeatures(device) {
  const features = device.features || [];
  const ownIds = new Set(features.map((feature) => feature.id));
  return features.filter(
    (feature) => isEnergySourceFeature(feature) && (!feature.energy_parent_id || !ownIds.has(feature.energy_parent_id)),
  );
}

/**
 * @description The feature the devices of a meter are attached to: among the attachment features
 * of the meter device, the first index (in the order of ENERGY_INDEX_FEATURE_TYPES), else the
 * first consumption. Never a feature derived from another one.
 * @param {object} device - The meter device, with its features.
 * @returns {object|null} The root feature, or null when the device has no attachment feature.
 * @example
 * getMeterRootFeature(meterDevice);
 */
function getMeterRootFeature(device) {
  const attachments = getAttachmentFeatures(device);
  const indexes = attachments
    .filter(isEnergyIndexFeature)
    .sort((a, b) => INDEX_PRIORITY.indexOf(a.type) - INDEX_PRIORITY.indexOf(b.type));
  return indexes[0] || attachments.find(isEnergyConsumptionFeature) || null;
}

/**
 * @description Pick the link to cut in a cycle: among the links going "up" (rank of the child
 * greater than or equal to the rank of its parent: a derived link never does), the one whose
 * child has the highest rank. In a cycle index -> consumption -> index, the index loses its
 * parent and the derived consumption keeps its link.
 * @param {Array} cycle - The features of the cycle, each one the child of the next one (the last
 * one the child of the first one).
 * @param {Function} [canCut] - Restricts the links that may be cut (by their child).
 * @returns {object|null} The child of the link to cut, or null when no link may be cut.
 * @example
 * findLinkToCut([index, consumption]);
 */
function findLinkToCut(cycle, canCut = () => true) {
  const links = cycle
    .map((child, i) => ({ child, parent: cycle[(i + 1) % cycle.length] }))
    .filter(({ child }) => canCut(child));
  if (links.length === 0) {
    return null;
  }
  const upLinks = links.filter(({ child, parent }) => getEnergyRank(child) >= getEnergyRank(parent));
  // a cycle always has a link going "up"; when it is not one of ours, cut the highest of ours
  const candidates = upLinks.length > 0 ? upLinks : links;
  return candidates.reduce((best, link) => (getEnergyRank(link.child) > getEnergyRank(best.child) ? link : best)).child;
}

/**
 * @description Find the cycle a feature belongs to, walking up its ancestors.
 * @param {object} feature - The feature to start from.
 * @param {Function} getFeature - Async lookup of a feature by id, resolving null when unknown.
 * @returns {Promise<Array|null>} The features of the cycle starting with this one (each one the
 * child of the next one), or null when the feature is not in a cycle.
 * @example
 * await findCycle(feature, async (id) => featuresById.get(id));
 */
async function findCycle(feature, getFeature) {
  const path = [feature];
  const visited = new Set([feature.id]);
  let parentId = feature.energy_parent_id;
  while (parentId) {
    if (parentId === feature.id) {
      return path;
    }
    if (visited.has(parentId)) {
      // a cycle above this feature, which is not part of it
      return null;
    }
    // eslint-disable-next-line no-await-in-loop
    const parent = await getFeature(parentId);
    if (!parent) {
      return null;
    }
    visited.add(parent.id);
    path.push(parent);
    parentId = parent.energy_parent_id;
  }
  return null;
}

module.exports = {
  RANK,
  isEnergyIndexFeature,
  isEnergyConsumptionFeature,
  isEnergyCostFeature,
  isEnergySourceFeature,
  getEnergyRank,
  getAttachmentFeatures,
  getMeterRootFeature,
  findLinkToCut,
  findCycle,
};
