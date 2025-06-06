const sinon = require('sinon');
const { fake, assert } = require('sinon');
const { expect } = require('chai');
const MockExpressRequest = require('mock-express-request');

const { ConflictError } = require('../../utils/coreErrors');
const errorMiddleware = require('../../api/middlewares/errorMiddleware');

const send = fake.returns(null);
const res = {
  status: fake.returns({
    send,
  }),
};

describe('errorMiddleware', () => {
  beforeEach(() => {
    sinon.reset();
  });
  it('should return 409 conflict', async () => {
    // @ts-ignore
    const req = new MockExpressRequest({
      method: 'POST',
    });
    const error = new ConflictError('ALREADY_ONE');

    errorMiddleware(error, req, res, () => {
      throw new Error('next should not be calld');
    });
    assert.calledWith(res.status, 409);
    assert.calledOnce(send);
  });
  it('should return 500 server error', async () => {
    // @ts-ignore
    const req = new MockExpressRequest({
      method: 'POST',
    });
    const error = new Error('UNKNOWN_ERROR');

    errorMiddleware(error, req, res, () => {
      throw new Error('next should not be called');
    });
    assert.calledWith(res.status, 500);
    assert.calledOnce(send);
    // check that call args deep equal error 500 status, code & message:
    const errorSent = send.getCall(0).args[0];
    expect(errorSent).to.have.property('status', 500);
    expect(errorSent).to.have.property('code', 'SERVER_ERROR');
    expect(errorSent).to.have.property('message', 'Error: UNKNOWN_ERROR');
  });
});
