const fmp = require('financialmodelingprep');
const logger = require('../../../utils/logger');

 /**
  * @description Get the stock-exchange datas.
  * @param {array} symbols - The ticker symbols of the quote.
  * @returns {Promise<Array>} Resolve with array of stock exchange datas.
  * @example
  * getStockExchangeIndexQuote(['^FCHI', 'RNO.PA']);
  */
async function getStockExchangeIndexQuote(symbols=['^FCHI', 'GIB']) {

  const STOCKEXCHANGE_TICKERS = await this.gladys.variable.getValue('STOCKEXCHANGE_TICKERS', this.serviceId);

  try {
    const cac = await fmp.stock(symbols).quote();
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
