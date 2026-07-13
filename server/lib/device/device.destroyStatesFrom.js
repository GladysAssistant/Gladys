const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { formatDateInUTC } = require('../../utils/date');

/**
 * @description Destroy states from a specific date, optionally bounded by an end date.
 * @param {string} selector - Device feature selector.
 * @param {Date} from - The date from which to destroy states (inclusive).
 * @param {Date} [to] - Optional upper bound (inclusive). Defaults to now, preserving
 *   the original "destroy everything from `from` onwards" behavior for existing callers.
 * @returns {Promise<void>}
 * @example
 * await gladys.device.destroyStatesFrom('kitchen-washer-consumption', new Date('2025-01-01'));
 * await gladys.device.destroyStatesFrom(
 *   'kitchen-washer-consumption',
 *   new Date('2025-01-01'),
 *   new Date('2025-06-01'),
 * );
 */
async function destroyStatesFrom(selector, from, to = new Date()) {
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
  destroyStatesFrom,
};
