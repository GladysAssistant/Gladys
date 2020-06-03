const { getStockExchangeIndexQuote } = require('./getStockExchangeIndexQuote');

/**
 * @description Get the stock-exchange status.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const stockExchangeHandler = new StockExchangeHandler(gladys, serviceId);
 */
const StockExchangeHandler = function StockExchangeHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

StockExchangeHandler.prototype.getStockExchangeIndexQuote = getStockExchangeIndexQuote;

module.exports = StockExchangeHandler;
