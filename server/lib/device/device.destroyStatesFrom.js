const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { formatDateInUTC } = require('../../utils/date');

/**
 * @description Destroy states from a specific date.
 * @param {string} selector - Device feature selector.
 * @param {Date} from - The date from which to destroy states.
 * @returns {Promise<void>}
 * @example
 * await gladys.device.destroyStatesFrom('kitchen-washer-consumption', new Date());
 */
async function destroyStatesFrom(selector, from) {
  const existing = await db.DeviceFeature.findOne({ where: { selector } });
  if (!existing) {
    throw new NotFoundError('DeviceFeature not found');
  }
  const formattedDate = formatDateInUTC(from);
  await db.duckDbWriteConnectionAllAsync(
    `DELETE FROM t_device_feature_state WHERE device_feature_id = ? AND created_at >= ?::TIMESTAMPTZ`,
    existing.id,
    formattedDate,
  );
}

module.exports = {
  destroyStatesFrom,
};
