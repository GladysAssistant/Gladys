const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

const GET_DEVICE_FEATURES_STATES_QUERY = `
  SELECT
      created_at,
      value
  FROM
      t_device_feature_state
  WHERE device_feature_id = ?
  AND created_at >= ?
  AND created_at <= ?
`;

/**
 * @description Get all features states.
 * @param {string} deviceFeatureSelector - The selector of the device feature.
 * @param {Date} startAt - The start date.
 * @param {Date} endAt - The end date.
 * @returns {Promise<Array>} - Resolve with an array of data.
 * @example
 * device.getDeviceFeatureStates('test-devivce', new Date('2025-01-01'), new Date('2025-01-31'));
 */
async function getDeviceFeatureStates(deviceFeatureSelector, startAt, endAt) {
  const deviceFeature = this.stateManager.get('deviceFeature', deviceFeatureSelector);
  if (deviceFeature === null) {
    throw new NotFoundError('DeviceFeature not found');
  }

  // Convert dates to UTC to match the database
  const startAtUtc = new Date(startAt);
  startAtUtc.setMinutes(startAtUtc.getMinutes() - startAtUtc.getTimezoneOffset());

  const endAtUtc = new Date(endAt);
  endAtUtc.setMinutes(endAtUtc.getMinutes() - endAtUtc.getTimezoneOffset());

  const values = await db.duckDbReadConnectionAllAsync(
    GET_DEVICE_FEATURES_STATES_QUERY,
    deviceFeature.id,
    startAtUtc,
    endAtUtc,
  );

  return values;
}

module.exports = {
  getDeviceFeatureStates,
};
