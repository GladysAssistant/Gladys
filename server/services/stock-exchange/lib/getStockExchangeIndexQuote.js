const logger = require('../../../utils/logger');

 /**
  * @description Get the stock-exchange datas.
  * @param {string} userId - Gladys user to connect.
  * @returns {Promise<Array>} Resolve with array of stock exchange datas.
  * @example
  * getStockExchangeIndexQuote("3ebd27cb-42cf-4b32-a33c-135af7d62a37");
  */
async function getStockExchangeIndexQuote(userId) {
  const FinancialModelingPrep = require('financialmodelingprep');
  const apiKey = await this.gladys.variable.getValue('STOCKEXCHANGE_API_KEY', this.serviceId, userId);
  const tickers = await this.gladys.variable.getValue('STOCKEXCHANGE_TICKERS', this.serviceId, userId);
  let quotes = [];

  try {
    const fmp = new FinancialModelingPrep(apiKey);
    logger.debug(`FMP API KEY used ${apiKey}`);
    quotes = await fmp.stock(tickers || ['^FCHI', 'GIB']).quote();
  } catch (e) {
    logger.warn('Unable to get FMP datas');
    logger.debug(e);
  }
  return quotes;
};

module.exports = {
  getStockExchangeIndexQuote,
};
