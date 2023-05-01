const get = require('get-value');

const logger = require('../../../utils/logger');
const { Error403 } = require('../../../utils/httpErrors');

/**
 * @description Get daily consumption max power.
 * @param {object} query - The query params.
 * @param {string} query.start - Start date in YYYY-MM-DD.
 * @param {string} query.end - End date in YYYY-MM-DD.
 * @param {string} query.usage_point_id - Usage point id.
 * @returns {Promise} Resolve with max power.
 * @example
 * enedisGetDailyConsumptionMaxPower();
 */
async function enedisGetDailyConsumptionMaxPower(query) {
  try {
    const consumption = await this.gladysGatewayClient.enedisGetDailyConsumptionMaxPower(query);
    return consumption;
  } catch (e) {
    logger.debug(e);
    if (get(e, 'response.status') === 403) {
      throw new Error403();
    }
    throw e;
  }
}

module.exports = {
  enedisGetDailyConsumptionMaxPower,
};
