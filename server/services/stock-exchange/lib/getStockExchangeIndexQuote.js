const fmp = require('financialmodelingprep');
const logger = require('../../../utils/logger');

 /**
  * @description Get the stock-exchange datas.
  * @returns {Promise<Array>} Resolve with array of stock exchange datas.
  * @example
  * getStockExchangeIndexQuote();
  */
async function getStockExchangeIndexQuote() {
  try {
    const cac = await fmp.stock(['^FCHI', 'RNO.PA', 'ACA.PA', 'BN.PA', 'AC.PA']).quote();
    logger.debug(`/=======> STOCKEXCHANGE : Call to FMP Api return results : {cac}`);
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
