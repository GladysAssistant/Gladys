const db = require('../../models');

/**
 * @description Get the oldest state timestamp from a list of device features.
 * @param {Array<string>} featureIds - Array of device feature IDs to query.
 * @returns {Promise<Array>} Array containing the oldest created_at timestamp.
 * @example
 * const result = await device.getOldestStateFromDeviceFeatures(['feature-id-1', 'feature-id-2']);
 * // Returns: [{ oldest_created_at: '2023-01-01T00:00:00.000Z' }]
 */
async function getOldestStateFromDeviceFeatures(featureIds) {
  // Build SQL query to find oldest state across all energy index features
  // Use IN clause with placeholders instead of ANY(?)
  const placeholders = featureIds.map(() => '?').join(',');
  const query = `
    SELECT MIN(created_at) as oldest_created_at
    FROM t_device_feature_state 
    WHERE device_feature_id IN (${placeholders})
  `;

  const result = await db.duckDbReadConnectionAllAsync(query, ...featureIds);

  return result;
}

module.exports = {
  getOldestStateFromDeviceFeatures,
};
