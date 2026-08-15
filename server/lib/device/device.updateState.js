const db = require('../../models');
const logger = require('../../utils/logger');
const { formatDateInUTC } = require('../../utils/date');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');

const UPDATE_STATE_QUERY = `
  UPDATE t_device_feature_state
  SET value = ?
  WHERE device_feature_id = CAST(? AS UUID)
  AND created_at = CAST(? AS TIMESTAMPTZ)
`;

/**
 * @description Correct one recorded state of a device feature.
 * @param {string} deviceFeatureSelector - Device feature selector.
 * @param {string|Date} createdAt - The date of the state to correct.
 * @param {number} newValue - The new value of this state.
 * @returns {Promise<object>} - Resolve with the corrected state.
 * @example
 * await gladys.device.updateState('kitchen-temperature', '2025-01-01T10:00:00.000Z', 21.5);
 */
async function updateState(deviceFeatureSelector, createdAt, newValue) {
  const createdAtDate = new Date(createdAt);
  if (Number.isNaN(createdAtDate.getTime())) {
    throw new BadParameters(`device.updateState: Invalid "created_at" date: ${createdAt}`);
  }
  if (typeof newValue !== 'number' || !Number.isFinite(newValue)) {
    throw new BadParameters(`device.updateState: "value" should be a number`);
  }

  const deviceFeature = await db.DeviceFeature.findOne({ where: { selector: deviceFeatureSelector } });
  if (!deviceFeature) {
    throw new NotFoundError('DeviceFeature not found');
  }

  logger.info(`device.updateState: Updating state of ${deviceFeatureSelector} at ${createdAtDate.toISOString()}`);

  const result = await db.duckDbWriteConnectionAllAsync(
    UPDATE_STATE_QUERY,
    newValue,
    deviceFeature.id,
    formatDateInUTC(createdAtDate),
  );
  const updatedRows = Number(result[0].Count);
  if (updatedRows === 0) {
    throw new NotFoundError('DeviceFeatureState not found');
  }

  // The last value of the feature is a denormalized copy of the most recent state: it is
  // only stale when the state that was corrected is that most recent one.
  const lastValueChanged = deviceFeature.last_value_changed ? new Date(deviceFeature.last_value_changed) : null;
  if (lastValueChanged === null || createdAtDate.getTime() >= lastValueChanged.getTime()) {
    await this.refreshFeatureLastValue(deviceFeature);
  }

  return {
    created_at: createdAtDate,
    value: newValue,
  };
}

module.exports = {
  updateState,
};
