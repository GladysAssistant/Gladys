// The breakdown indexes the core knows (docs/specs/energy-hierarchy.md, section B): a cumulative
// index that is a part of another index of the same device, its total (the phases of a three-phase
// meter). By integration (the first segment of the external_id): the property of a breakdown index
// -> the property of the total it breaks down. A link from an index to another index of its device
// is a breakdown only when it is listed here: the hierarchy, the repair and the weekly digest all
// read this one table, an integration adds its own properties to it.
const ENERGY_INDEX_BREAKDOWNS = new Map([
  [
    // `zigbee2mqtt:<friendly_name>:<category>:<type>:<property>[:<n>]` (e.g. Tuya SPM02V3)
    'zigbee2mqtt',
    new Map([
      ['energy_a', 'energy'],
      ['energy_b', 'energy'],
      ['energy_c', 'energy'],
      ['energy_produced_a', 'produced_energy'],
      ['energy_produced_b', 'produced_energy'],
      ['energy_produced_c', 'produced_energy'],
    ]),
  ],
]);

const NUMERIC_SUFFIX = /^\d+$/;

/**
 * @description The external_id of the total index a breakdown index is a part of. The property
 * is read from the end of the external_id (the last segment, or the last but one when the last is
 * a numeric suffix), so a colon in the device name does not shift it.
 * @param {string} externalId - The external_id of the index.
 * @returns {string|null} The external_id of its total, or null when it is not a breakdown index.
 * @example
 * getBreakdownTotalExternalId('zigbee2mqtt:panel:switch:energy:energy_a'); // 'zigbee2mqtt:panel:switch:energy:energy'
 */
function getBreakdownTotalExternalId(externalId) {
  if (typeof externalId !== 'string') {
    return null;
  }
  const segments = externalId.split(':');
  const properties = ENERGY_INDEX_BREAKDOWNS.get(segments[0]);
  if (!properties) {
    return null;
  }
  const propertyPosition = NUMERIC_SUFFIX.test(segments[segments.length - 1])
    ? segments.length - 2
    : segments.length - 1;
  const totalProperty = properties.get(segments[propertyPosition]);
  if (!totalProperty) {
    return null;
  }
  segments[propertyPosition] = totalProperty;
  return segments.join(':');
}

/**
 * @description The total index a feature breaks down, on its own device: same category and type,
 * the external_id of getBreakdownTotalExternalId.
 * @param {object} device - The device, its features included.
 * @param {object} feature - A feature of the device.
 * @returns {object|null} The total index, or null when the feature is not a breakdown index or
 * the device does not expose its total (the two clamps of a Tuya PJ-1203A).
 * @example
 * findBreakdownTotal(device, phaseAIndex);
 */
function findBreakdownTotal(device, feature) {
  const totalExternalId = getBreakdownTotalExternalId(feature.external_id);
  if (totalExternalId === null) {
    return null;
  }
  return (
    device.features.find(
      (f) => f.external_id === totalExternalId && f.category === feature.category && f.type === feature.type,
    ) || null
  );
}

/**
 * @description Hang every breakdown index of a device under its total (section B). A total never
 * hangs on its own device: one left under one of its features (a phase was the root feature of the
 * main meter, so the derivation attached the total to it) takes the parent that feature had when
 * it is on another device, else becomes a root. Every feature must have its id (run it after the
 * derivations).
 * @param {object} device - The device, its features included; its features are updated in place.
 * @returns {Array<object>} The features whose parent changed, each with its former parent
 * (`{ feature, previousParentId }`), so a caller can log or revert them.
 * @example
 * attachBreakdownIndexes(device);
 */
function attachBreakdownIndexes(device) {
  // a feature not saved yet (a power, a voltage) may have no id: it is no one's parent
  const ownFeatures = device.features.filter((feature) => feature.id);
  const ownFeatureIds = new Set(ownFeatures.map((feature) => feature.id));
  const parentOf = new Map(ownFeatures.map((feature) => [feature.id, feature.energy_parent_id]));
  const changes = [];
  const setParent = (feature, parentId) => {
    if (feature.energy_parent_id !== parentId) {
      changes.push({ feature, previousParentId: feature.energy_parent_id });
      feature.energy_parent_id = parentId;
    }
  };
  const breakdowns = device.features
    .map((part) => ({ part, total: findBreakdownTotal(device, part) }))
    .filter(({ total }) => total !== null);
  breakdowns.forEach(({ total }) => {
    if (ownFeatureIds.has(total.energy_parent_id)) {
      const grandParentId = parentOf.get(total.energy_parent_id);
      setParent(total, grandParentId && !ownFeatureIds.has(grandParentId) ? grandParentId : null);
    }
  });
  breakdowns.forEach(({ part, total }) => setParent(part, total.id));
  return changes;
}

module.exports = {
  ENERGY_INDEX_BREAKDOWNS,
  getBreakdownTotalExternalId,
  findBreakdownTotal,
  attachBreakdownIndexes,
};
