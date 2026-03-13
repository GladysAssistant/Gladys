const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { formatDateInUTC } = require('../../utils/date');

/**
 * @description Destroy states between two dates.
 * @param {string} selector - Device feature selector.
 * @param {Date} from - The start date (inclusive).
 * @param {Date} to - The end date (inclusive).
 * @returns {Promise<void>}
 * @example
 * await gladys.device.destroyStatesBetween('kitchen-washer-consumption', new Date('2025-01-01'), new Date());
 */
async function destroyStatesBetween(selector, from, to) {
  const existing = await db.DeviceFeature.findOne({ where: { selector } });
  if (!existing) {
    throw new NotFoundError('DeviceFeature not found');
  }
  const formattedFrom = formatDateInUTC(from);
  const formattedTo = formatDateInUTC(to);
  await db.duckDbWriteConnectionAllAsync(
    `DELETE FROM t_device_feature_state WHERE device_feature_id = ? AND created_at >= ?::TIMESTAMPTZ AND created_at <= ?::TIMESTAMPTZ`,
    existing.id,
    formattedFrom,
    formattedTo,
  );
}

module.exports = {
  destroyStatesBetween,
};
