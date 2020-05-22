const { fake } = require('sinon');
const StockExchangeController = require('../../../../services/stock-exchange/api/stockexchange.controller');

const res = {
  send: fake.returns(null),
};

describe.only('get /api/v1/stockexchange/getStockExchangeIndexQuote', () => {
  it('should return an array', async () => {
    const stockExchangeController = StockExchangeController();
    const req = {};
    await stockExchangeController['get /api/v1/stockexchange/getStockExchangeIndexQuote'].controller(req, res);

  });
});
