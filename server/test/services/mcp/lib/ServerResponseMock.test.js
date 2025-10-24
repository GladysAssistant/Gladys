const { expect } = require('chai');
const { fake } = require('sinon');
const { ServerResponseMock } = require('../../../../services/mcp/lib/ServerResponseMock');

describe('ServerResponseMock', () => {
  it('should initialize with default values', () => {
    const callback = fake();
    const response = new ServerResponseMock(callback);

    expect(response.statusCode).to.eq(200);
    expect(response.headers).to.deep.equal({});
    expect(response.body).to.eq(null);
    expect(response.headersSent).to.eq(false);
    expect(response.cb).to.eq(callback);
    expect(response.listeners).to.deep.equal({});
  });

  it('should set status code with status() method', () => {
    const callback = fake();
    const response = new ServerResponseMock(callback);

    const result = response.status(200);

    expect(response.statusCode).to.eq(200);
    expect(result).to.eq(response);
  });

  it('should set status code and headers with writeHead() method', () => {
    const callback = fake();
    const response = new ServerResponseMock(callback);

    const headers = {
      'Content-Type': 'application/json',
      'X-Custom-Header': 'test',
    };

    const result = response.writeHead(201, headers);

    expect(response.statusCode).to.eq(201);
    expect(response.headers).to.deep.equal(headers);
    expect(result).to.eq(response);
  });

  it('should send JSON response with json() method', () => {
    const callback = fake();
    const response = new ServerResponseMock(callback);

    const jsonBody = { success: true, message: 'Test message' };

    response.json(jsonBody);

    expect(response.body).to.deep.equal(jsonBody);
    expect(callback.callCount).to.eq(1);
    expect(callback.firstCall.args[0]).to.deep.equal({
      status: 200,
      headers: {},
      body: jsonBody,
    });
  });

  it('should send response with end() method with JSON body string', () => {
    const callback = fake();
    const response = new ServerResponseMock(callback);

    const bodyObject = { data: 'test', count: 42 };
    const bodyString = JSON.stringify(bodyObject);

    response.end(bodyString);

    expect(response.body).to.deep.equal(bodyObject);
    expect(callback.callCount).to.eq(1);
    expect(callback.firstCall.args[0]).to.deep.equal({
      status: 200,
      headers: {},
      body: bodyObject,
    });
  });

  it('should register event listeners with on() method', () => {
    const callback = fake();
    const response = new ServerResponseMock(callback);

    const closeListener = fake();
    const errorListener = fake();

    response.on('close', closeListener);
    response.on('error', errorListener);

    expect(response.listeners.close).to.eq(closeListener);
    expect(response.listeners.error).to.eq(errorListener);
  });

  it('should trigger close event listener when sending response', () => {
    const callback = fake();
    const response = new ServerResponseMock(callback);

    const closeListener = fake();
    response.on('close', closeListener);

    response.json({ test: 'data' });

    expect(closeListener.callCount).to.eq(1);
    expect(callback.callCount).to.eq(1);
  });

  it('should not throw error when close listener is not registered', () => {
    const callback = fake();
    const response = new ServerResponseMock(callback);

    expect(() => {
      response.json({ test: 'data' });
    }).to.not.throw();

    expect(callback.callCount).to.eq(1);
  });

  it('should return headers with flushHeaders() method', () => {
    const callback = fake();
    const response = new ServerResponseMock(callback);

    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    };

    response.writeHead(200, headers);

    const flushedHeaders = response.flushHeaders();

    expect(flushedHeaders).to.deep.equal(headers);
    expect(flushedHeaders).to.eq(response.headers);
  });
});
