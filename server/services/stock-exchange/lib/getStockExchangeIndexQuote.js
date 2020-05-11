const logger = require('../../../utils/logger');
const fmp = require('financialmodelingprep');

/**
 * @description Get the stock-exchange status.
  * @example
 * getStockExchangeIndexQuote();
 */
async function getStockExchangeIndexQuote() {
  try {
    const cac = await fmp.stock('^FCHI').quote();
    return cac;
  } catch (e) {
    logger.warn('Unable to get CAC40 status');
    logger.debug(e);
  }
}

module.exports = {
  getStockExchangeIndexQuote,
};
