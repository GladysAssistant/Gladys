const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
// const cac40Example = require('./cac40.json');

const StockExchangeService = proxyquire('../../../services/stock-exchange/index');

const gladys = {
  variable: {
    getValue: () => Promise.resolve('FMP_API_KEY'),
  },
};

describe.only('StockExchangeService', () => {
  const stockExchangeService = StockExchangeService(gladys);
  it('should have start function', () => {
    expect(stockExchangeService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
  });
  it('should have stop function', () => {
    expect(stockExchangeService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });
  it('should start service', async () => {
    await stockExchangeService.start();
  });
  it('should stop service', async () => {
    await stockExchangeService.start();
  });
  it('should return stock exchange index', async () => {
    await stockExchangeService.get();
  });
});
