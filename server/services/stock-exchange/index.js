const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');
const StockExchangeController = require('./api/stockexchange.controller');
const StockExchangeHandler = require('./lib');

// Subscribe to https://fmpcloud.io/
const FMP_API_KEY = 'FMP_API_KEY';


module.exports = function StockEchangeService(gladys, serviceId) {

  const stockExchangeHandler = new StockExchangeHandler(gladys, serviceId);
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



  return Object.freeze({
    start,
    stop,
    controllers: StockExchangeController(stockExchangeHandler),
  });
};
