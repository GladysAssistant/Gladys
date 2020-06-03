const FinancialModelingPrep = require('financialmodelingprep');
const logger = require('../../../utils/logger');

 /**
  * @description Get the stock-exchange datas.
  * @returns {Promise<Array>} Resolve with array of stock exchange datas.
  * @example
  * getStockExchangeIndexQuote();
  */
async function getStockExchangeIndexQuote(userId) {

  const apiKey = await this.gladys.variable.getValue('STOCKEXCHANGE_API_KEY', this.serviceId, userId);
  const tickers = await this.gladys.variable.getValue('STOCKEXCHANGE_TICKERS', this.serviceId, userId);

  try {
    const fmp = new FinancialModelingPrep(apiKey);
    const cac = await fmp.stock(tickers ? tickers : ['^FCHI', 'GIB']).quote();
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
