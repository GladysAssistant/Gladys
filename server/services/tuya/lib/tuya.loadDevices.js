const logger = require('../../../utils/logger');
const { API } = require('./utils/tuya.constants');

/**
 * @description Discover Tuya cloud devices.
 * @param {string} lastRowKey - Key of last row to start with.
 * @returns {Promise} List of discovered devices.
 * @example
 * await loadDevices();
 */
async function loadDevices(lastRowKey = null) {
  const responsePage = await this.connector.request({
    method: 'GET',
    path: `${API.VERSION}/devices`,
    query: { last_row_key: lastRowKey },
  });

  const { result } = responsePage;
  const { list, has_more: hasMore, last_row_key: nextLastRowKey, total } = result;

  if (hasMore) {
    const nextResult = await this.loadDevices(nextLastRowKey);
    nextResult.forEach((device) => list.push(device));
  }

  logger.debug(`${list.length} / ${total} Tuay devices loaded`);

  return list;
}

module.exports = {
  loadDevices,
};
