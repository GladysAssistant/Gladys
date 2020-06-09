const { assert, fake, stub } = require('sinon');
const StockExchangeController = require('../../../../services/stock-exchange/api/stockexchange.controller');

const userId = '3ebd27cb-42cf-4b32-a33c-135af7d62a37';

const stockexchangeService = {
  getStockExchangeIndexQuote: stub(),
};

const res = {
  json: fake.returns(null),
  status: fake.returns({
  send: fake.returns(null),
  }),
};

describe('get /api/v1/stockexchange/getStockExchangeIndexQuote', () => {
  it('should return an array', async () => {
    const stockExchangeController = StockExchangeController(stockexchangeService);
    const req = {
      user: {
        id: userId,
      },
    };
    await stockExchangeController['get /api/v1/stockexchange/getStockExchangeIndexQuote'].controller(req, res);
    assert.calledWith(stockexchangeService.getStockExchangeIndexQuote, userId);
  });
});
