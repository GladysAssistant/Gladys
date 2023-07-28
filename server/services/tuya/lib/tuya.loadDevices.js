const logger = require('../../../utils/logger');
const { API, GLADYS_VARIABLES } = require('./utils/tuya.constants');

/**
 * @description Discover Tuya cloud devices.
 * @param {string} lastRowKey - Key of last row to start with.
 * @returns {Promise} List of discovered devices.
 * @example
 * await loadDevices();
 */
async function loadDevices(lastRowKey = null) {
  const sourceId = await this.gladys.variable.getValue(GLADYS_VARIABLES.APP_ACCOUNT_UID, this.serviceId);

  const responsePage = await this.connector.request({
    method: 'GET',
    path: `${API.VERSION_1_3}/devices`,
    query: {
      last_row_key: lastRowKey,
      source_type: 'tuyaUser',
      source_id: sourceId,
    },
  });

  const { result } = responsePage;
  const { list, has_more: hasMore, last_row_key: nextLastRowKey, total } = result;

  if (hasMore) {
    const nextResult = await this.loadDevices(nextLastRowKey);
    nextResult.forEach((device) => list.push(device));
  }

  logger.debug(`${list.length} / ${total} Tuya devices loaded`);

  return list;
}

module.exports = {
  loadDevices,
};
