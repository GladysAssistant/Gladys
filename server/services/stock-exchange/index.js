const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');

// Subscribe to https://fmpcloud.io/
const FMP_API_KEY = 'FMP_API_KEY';


module.exports = function StockEchangeService(gladys, serviceId) {
  // here is an example module
  const fmp = require('financialmodelingprep');
  let fmpApiKey;

  /**
   * @public
   * @description This function starts the StockEchangeService service
   * @example
   * gladys.services.stock-exchange.start();
   */
  async function start() {
    logger.log('starting stock exchange service');
    fmpApiKey = await gladys.variable.getValue(FMP_API_KEY, serviceId);
    if (!fmpApiKey) {
      throw new ServiceNotConfiguredError('Stock Exchange Service not configured');
    }
  }

  /**
   * @public
   * @description This function stops the StockEchangeService service
   * @example
   * gladys.services.stock-exchange.stop();
   */
  async function stop() {
    logger.log('stopping stock exchange service');
  }

  /**
   * @description Get the stock-exchange status.
   * @param {Object} options - Options parameters.
   * @example
   * gladys.services.stock-exchange.get({
   *   stockExchangeName: 'CAC40'
   * });
   */
  async function get(options) {
    if (!fmpApiKey) {
      throw new ServiceNotConfiguredError('FMP API Key not found.');
    }
    try {
      const cac = await fmp.market.index.quote('FCHI');
      return cac;
    } catch (e) {
      throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
    }
    }

  return Object.freeze({
    start,
    stop,
    get,
  });
};
