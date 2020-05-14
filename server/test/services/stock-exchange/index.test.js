const { expect } = require('chai');

const StockExchangeService = require('../../../services/stock-exchange/index');

describe.only('StockExchangeService', () => {
  it('should have controllers', () => {
    const stockExchangeService = StockExchangeService();
    expect(stockExchangeService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should start service', async () => {
    const stockExchangeService = StockExchangeService();
    await stockExchangeService.start();
  });
  it('should stop service', async () => {
    const stockExchangeService = StockExchangeService();
    await stockExchangeService.stop();
  });
});
