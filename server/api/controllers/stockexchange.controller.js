const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');

module.exports = function StockExchangeController(gladys) {
  /**
   * @api {get} /api/v1/stockexchange/:user_selector/get get stock exchange user
   * @apiName getStockExchangeUser
   * @apiGroup StockExchange
   * @apiSuccessExample {json} Success-Example
   * {
   *   "symbol" : "^FCHI",
   *  "name" : "CAC 40",
   *  "price" : 4407.78000000,
  *  "changesPercentage" : -3.60000000,
  *  "change" : -164.40000000,
  *  "dayLow" : 4397.26000000,
  *  "dayHigh" : 4427.74000000,
  *  "yearHigh" : 6111.41000000,
  *  "yearLow" : 3632.06000000,
  *  "marketCap" : null,
  *  "priceAvg50" : 4321.72500000,
  *  "priceAvg200" : 5458.02730000,
  *  "volume" : 0,
  *  "avgVolume" : 150430657,
  *  "exhange" : "INDEX",
  *  "open" : 4413.14000000,
  *  "previousClose" : 4572.18000000,
  *  "eps" : null,
  *  "pe" : null,
  *  "earningsAnnouncement" : null,
  *  "sharesOutstanding" : null,
  *  "timestamp" : 1588581270
   * }
   */
  async function getByUser(req, res) {
    const options = {
      index: "cac40",
    };
    const result = await gladys.stock-exchange.get(options);
    res.json(result);
  }

  return Object.freeze({
    getByUser: asyncMiddleware(getByUser),
  });
};
