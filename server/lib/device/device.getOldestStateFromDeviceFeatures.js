const db = require('../../models');

/**
 * @description
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
