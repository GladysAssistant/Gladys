const sinon = require('sinon');

const { assert, fake } = sinon;

const StockExchangeHandler = require('../../../../services/stock-exchange/lib');

const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b842';

const gladys = {
  variable: {
    getValue: fake.resolves('result'),
  },
};

describe('stockExchangeHandler.getStockExchangeIndexQuote', () => {
  it('should get stock exchange index quote', async () => {
    const stockExchangeHandler = new StockExchangeHandler(gladys, serviceId);
    await stockExchangeHandler.getStockExchangeIndexQuote();
    assert.callCount(gladys.variable.getValue, 2);
  });
});
