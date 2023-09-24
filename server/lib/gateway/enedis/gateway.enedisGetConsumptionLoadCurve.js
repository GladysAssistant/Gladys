const get = require('get-value');

const { Error403 } = require('../../../utils/httpErrors');

/**
 * @description Get consumption load curve.
 * @param {object} query - The query params.
 * @param {string} query.start - Start date in YYYY-MM-DD.
 * @param {string} query.end - End date in YYYY-MM-DD.
 * @param {string} query.usage_point_id - Usage point id.
 * @returns {Promise} Resolve with consumption.
 * @example
 * enedisGetConsumptionLoadCurve();
 */
async function enedisGetConsumptionLoadCurve(query) {
  try {
    const consumption = await this.gladysGatewayClient.enedisGetConsumptionLoadCurve(query);
    return consumption;
  } catch (e) {
    if (get(e, 'response.status') === 403) {
      throw new Error403();
    }
    throw e;
  }
}

module.exports = {
  enedisGetConsumptionLoadCurve,
};
