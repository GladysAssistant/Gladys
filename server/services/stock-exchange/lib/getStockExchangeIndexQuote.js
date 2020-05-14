const logger = require('../../../utils/logger');
const fmp = require('financialmodelingprep');

/**
 * @description Get the stock-exchange status.
  * @example
 * getStockExchangeIndexQuote();
 */
async function getStockExchangeIndexQuote() {
  try {
    const cac = await fmp.stock(['^FCHI', 'RNO.PA', 'ACA.PA', 'BN.PA', 'AC.PA']).quote();
    return cac;
  } catch (e) {
    logger.warn('Unable to get FMP datas');
    logger.debug(e);
  }
}

module.exports = {
  getStockExchangeIndexQuote,
};
