const { fake, assert } = require('sinon');
const MockExpressRequest = require('mock-express-request');

const corsMiddleware = require('../../api/middlewares/corsMiddleware');

const res = {
  send: fake.returns(null),
  header: fake.returns(null),
};

describe('corsMiddleware', () => {
  it('should send response directly', async () => {
    const req = new MockExpressRequest({
      method: 'OPTIONS',
    });
    corsMiddleware(req, res, () => {
      throw new Error('next should not be calld');
    });
    assert.called(res.header);
    assert.calledOnce(res.send);
  });
});
