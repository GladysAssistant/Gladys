const logger = require('../../utils/logger');
// const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const StockExchangeController = require('./api/stockexchange.controller');
const StockExchangeHandler = require('./lib');


// const STOCKEXCHANGE_API_KEY = 'STOCKEXCHANGE_API_KEY';
// const STOCKEXCHANGE_TICKERS = 'STOCKEXCHANGE_TICKERS';

module.exports = function StockEchangeService(gladys, serviceId) {

  const stockExchangeHandler = new StockExchangeHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts the StockEchangeService service
   * @example
   * gladys.services.stock-exchange.start();
   */
  async function start() {
    /* fmpApiKey = await gladys.variable.getValue(FMP_API_KEY, serviceId);
    if (!fmpApiKey) {
      throw new ServiceNotConfiguredError('financialmodelingprep Service not configured');
    } */
    logger.log('starting stock-exchange service');
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

  return Object.freeze({
    start,
    stop,
    controllers: StockExchangeController(stockExchangeHandler),
  });
};
