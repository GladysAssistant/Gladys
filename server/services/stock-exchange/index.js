const logger = require('../../utils/logger');
const StockExchangeController = require('./api/stockexchange.controller');
const StockExchangeHandler = require('./lib');

module.exports = function StockEchangeService(gladys, serviceId) {

  const stockExchangeHandler = new StockExchangeHandler(gladys, serviceId);
  let quote;
  /**
   * @public
   * @description This function starts the StockEchangeService service
   * @example
   * gladys.services.stock-exchange.start();
   */
  async function start() {
    logger.log('starting stock exchange service');
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
