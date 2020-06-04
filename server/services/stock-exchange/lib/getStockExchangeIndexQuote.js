const FinancialModelingPrep = require('financialmodelingprep');
const logger = require('../../../utils/logger');

 /**
  * @description Get the stock-exchange datas.
  * @param {string} userId - Gladys user to connect.
  * @returns {Promise<Array>} Resolve with array of stock exchange datas.
  * @example
  * getStockExchangeIndexQuote("3ebd27cb-42cf-4b32-a33c-135af7d62a37");
  */
async function getStockExchangeIndexQuote(userId) {

  const apiKey = await this.gladys.variable.getValue('STOCKEXCHANGE_API_KEY', this.serviceId, userId);
  const tickers = await this.gladys.variable.getValue('STOCKEXCHANGE_TICKERS', this.serviceId, userId);

  try {
    const fmp = new FinancialModelingPrep(apiKey);
    const cac = await fmp.stock(tickers || ['^FCHI', 'GIB']).quote();
    return cac;
  } catch (e) {
    logger.warn('Unable to get FMP datas');
    logger.debug(e);
  }
  return [];
};

module.exports = {
  getStockExchangeIndexQuote,
};
