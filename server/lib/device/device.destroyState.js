const db = require('../../models');
const logger = require('../../utils/logger');
const { formatDateInUTC } = require('../../utils/date');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');

const DELETE_STATE_QUERY = `
  DELETE FROM t_device_feature_state
  WHERE device_feature_id = CAST(? AS UUID)
  AND created_at = CAST(? AS TIMESTAMPTZ)
`;

/**
 * @description Destroy one recorded state of a device feature.
 * @param {string} deviceFeatureSelector - Device feature selector.
 * @param {string|Date} createdAt - The date of the state to destroy.
 * @returns {Promise<void>}
 * @example
 * await gladys.device.destroyState('kitchen-temperature', '2025-01-01T10:00:00.000Z');
 */
async function destroyState(deviceFeatureSelector, createdAt) {
  const createdAtDate = new Date(createdAt);
  if (Number.isNaN(createdAtDate.getTime())) {
    throw new BadParameters(`device.destroyState: Invalid "created_at" date: ${createdAt}`);
  }

  const deviceFeature = await db.DeviceFeature.findOne({ where: { selector: deviceFeatureSelector } });
  if (!deviceFeature) {
    throw new NotFoundError('DeviceFeature not found');
  }

  logger.info(`device.destroyState: Deleting state of ${deviceFeatureSelector} at ${createdAtDate.toISOString()}`);

  const result = await db.duckDbWriteConnectionAllAsync(
    DELETE_STATE_QUERY,
    deviceFeature.id,
    formatDateInUTC(createdAtDate),
  );
  const deletedRows = Number(result[0].Count);
  if (deletedRows === 0) {
    throw new NotFoundError('DeviceFeatureState not found');
  }

  // The last value of the feature is a denormalized copy of the most recent state: when
  // that state is the one being deleted, the feature falls back to the most recent state
  // still recorded before it.
  const lastValueChanged = deviceFeature.last_value_changed ? new Date(deviceFeature.last_value_changed) : null;
  if (lastValueChanged === null || createdAtDate.getTime() >= lastValueChanged.getTime()) {
    await this.refreshFeatureLastValue(deviceFeature, { before: createdAtDate });
  }
}

module.exports = {
  destroyState,
};
