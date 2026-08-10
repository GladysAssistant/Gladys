const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;
const { expect } = require('chai');
const MockExpressRequest = require('mock-express-request');

const { ConflictError, ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
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
  it('should return 400 on external integration unavailable', async () => {
    // @ts-ignore
    const req = new MockExpressRequest({
      method: 'POST',
    });
    const error = new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_NOT_CONNECTED');

    errorMiddleware(error, req, res, () => {
      throw new Error('next should not be called');
    });
    assert.calledWith(res.status, 400);
    assert.calledOnce(send);
  });
  it('should return 413 when body-parser rejected an oversized payload', async () => {
    // @ts-ignore
    const req = new MockExpressRequest({
      method: 'POST',
      url: '/api/integration/v1/discovered_device',
    });
    const error = new Error('request entity too large');
    // shape of a body-parser PayloadTooLargeError
    // @ts-ignore
    error.type = 'entity.too.large';
    // @ts-ignore
    error.limit = 5242880;
    // @ts-ignore
    error.length = 6000000;

    errorMiddleware(error, req, res, () => {
      throw new Error('next should not be called');
    });
    assert.calledWith(res.status, 413);
    assert.calledOnce(send);
    const errorSent = send.getCall(0).args[0];
    expect(errorSent).to.have.property('status', 413);
    expect(errorSent).to.have.property('code', 'PAYLOAD_TOO_LARGE');
    expect(errorSent).to.have.property('message', 'Payload too large: 5242880 bytes max on this route');
  });
  it('should return 422 with the context of the rejected field', async () => {
    // @ts-ignore
    const req = new MockExpressRequest({
      method: 'POST',
    });
    const error = new Error('Validation failed');
    error.name = 'SequelizeValidationError';
    error.errors = [
      {
        message: 't_device_feature.min cannot be null',
        path: 'min',
        value: null,
        type: 'notNull Violation',
      },
    ];
    // @ts-ignore
    error.gladysContext = { type: 'device_feature', name: 'Temperature' };

    errorMiddleware(error, req, res, () => {
      throw new Error('next should not be called');
    });
    assert.calledWith(res.status, 422);
    const errorSent = send.getCall(0).args[0];
    expect(errorSent.properties).to.deep.equal([
      {
        message: 't_device_feature.min cannot be null',
        attribute: 'min',
        value: null,
        type: 'notNull Violation',
        context: { type: 'device_feature', name: 'Temperature' },
      },
    ]);
  });
  it('should return 409 with the context of the conflicting field', async () => {
    // @ts-ignore
    const req = new MockExpressRequest({
      method: 'POST',
    });
    const error = new Error('Unique constraint failed');
    error.name = 'SequelizeUniqueConstraintError';
    error.errors = [
      {
        message: 'external_id must be unique',
        path: 'external_id',
        value: 'ext:my-integration:1',
        type: 'unique violation',
      },
    ];
    // @ts-ignore
    error.gladysContext = { type: 'device_feature', name: 'Temperature' };

    errorMiddleware(error, req, res, () => {
      throw new Error('next should not be called');
    });
    assert.calledWith(res.status, 409);
    const errorSent = send.getCall(0).args[0];
    expect(errorSent.error).to.deep.equal({
      message: 'external_id must be unique',
      attribute: 'external_id',
      value: 'ext:my-integration:1',
      type: 'unique violation',
      context: { type: 'device_feature', name: 'Temperature' },
    });
  });
  it('should omit the context key when the error carries none', async () => {
    // @ts-ignore
    const req = new MockExpressRequest({
      method: 'POST',
    });
    const validationError = new Error('Validation failed');
    validationError.name = 'SequelizeValidationError';
    validationError.errors = [
      {
        message: 't_device.name cannot be null',
        path: 'name',
        value: null,
        type: 'notNull Violation',
      },
    ];

    errorMiddleware(validationError, req, res, () => {
      throw new Error('next should not be called');
    });
    expect(send.getCall(0).args[0].properties[0]).to.not.have.property('context');

    const conflictError = new Error('Unique constraint failed');
    conflictError.name = 'SequelizeUniqueConstraintError';
    conflictError.errors = [
      {
        message: 'selector must be unique',
        path: 'selector',
        value: 'living-room',
        type: 'unique violation',
      },
    ];

    errorMiddleware(conflictError, req, res, () => {
      throw new Error('next should not be called');
    });
    expect(send.getCall(1).args[0].error).to.not.have.property('context');
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
