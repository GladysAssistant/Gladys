const logger = require('../../../utils/logger');
const { API, GLADYS_VARIABLES } = require('./utils/tuya.constants');

/**
 * @description Discover Tuya cloud devices.
 * @param {number} pageNo - Page number.
 * @param {number} pageSize - Page size.
 * @returns {Promise} List of discovered devices.
 * @example
 * await loadDevices();
 */
async function loadDevices(pageNo = 1, pageSize = 100) {
  if (!Number.isInteger(pageNo) || pageNo <= 0) {
    throw new Error('pageNo must be a positive integer');
  }
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error('pageSize must be a positive integer');
  }
  const sourceId = await this.gladys.variable.getValue(GLADYS_VARIABLES.APP_ACCOUNT_UID, this.serviceId);
  if (!sourceId) {
    throw new Error('Tuya APP_ACCOUNT_UID is missing');
  }

  const responsePage = await this.connector.request({
    method: 'GET',
    path: `${API.PUBLIC_VERSION_1_0}/users/${sourceId}/devices`,
    query: {
      page_no: pageNo,
      page_size: pageSize,
    },
  });
  if (!responsePage) {
    throw new Error('Tuya API returned no response');
  }
  if (responsePage.success === false) {
    const message = responsePage.msg || responsePage.message || responsePage.code || 'Tuya API error';
    throw new Error(message);
  }

  const result = responsePage.result || [];
  let list = [];
  if (Array.isArray(result)) {
    list = result;
  } else if (Array.isArray(result && result.list)) {
    list = result.list;
  }
  let hasMore = list.length === pageSize;
  if (!Array.isArray(result) && typeof result.has_more === 'boolean') {
    hasMore = result.has_more;
  }

  if (hasMore) {
    if (list.length === 0) {
      throw new Error('Tuya API pagination did not advance (has_more=true with empty page)');
    }
    const nextResult = await this.loadDevices(pageNo + 1, pageSize);
    list.push(...nextResult);
  }

  logger.debug(`${list.length} Tuya devices loaded`);

  return list;
}

module.exports = {
  loadDevices,
};
