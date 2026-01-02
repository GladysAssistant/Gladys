const logger = require('../../../utils/logger');

const MAX_HIERARCHY_DEPTH = 100;

/**
 * @description Get root electric meter device.
 * @param {object} deviceFeature - The device feature.
 * @returns {object|null} The root electric meter device, or null if not found or invalid hierarchy.
 * @example
 * getRootElectricMeterDevice(deviceFeature);
 */
function getRootElectricMeterDevice(deviceFeature) {
  if (!deviceFeature) {
    return null;
  }
  const newParentId = deviceFeature.energy_parent_id;
  if (newParentId) {
    let cursor = this.stateManager.get('deviceFeatureById', newParentId);
    // If parent doesn't exist in stateManager, return null
    if (!cursor) {
      logger.warn(
        `getRootElectricMeterDevice: Parent device feature ${newParentId} not found in stateManager for feature ${deviceFeature.id}`,
      );
      return null;
    }
    // Track visited IDs to detect circular references
    const visitedIds = new Set([deviceFeature.id]);
    let depth = 0;
    while (cursor) {
      // Check for circular reference
      if (visitedIds.has(cursor.id)) {
        logger.error(
          `getRootElectricMeterDevice: Circular reference detected in energy hierarchy at feature ${cursor.id}`,
        );
        return null;
      }
      visitedIds.add(cursor.id);
      depth += 1;
      // Prevent infinite loops with a maximum depth limit
      if (depth > MAX_HIERARCHY_DEPTH) {
        logger.error(
          `getRootElectricMeterDevice: Maximum hierarchy depth (${MAX_HIERARCHY_DEPTH}) exceeded, possible infinite loop`,
        );
        return null;
      }
      if (!cursor.energy_parent_id) {
        break;
      }
      // move to next ancestor
      const nextCursor = this.stateManager.get('deviceFeatureById', cursor.energy_parent_id);
      if (!nextCursor) {
        logger.warn(
          `getRootElectricMeterDevice: Parent device feature ${cursor.energy_parent_id} not found in stateManager`,
        );
        return null;
      }
      cursor = nextCursor;
    }
    return cursor;
  }
  return deviceFeature;
}

module.exports = {
  getRootElectricMeterDevice,
};
