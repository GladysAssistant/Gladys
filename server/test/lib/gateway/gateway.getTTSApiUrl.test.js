const { expect, assert } = require('chai');
const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');
const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const { Error403, Error429 } = require('../../../utils/httpErrors');

const event = new EventEmitter();

const job = {
  wrapper: (type, func) => {
    return async () => {
      return func();
    };
  },
  updateProgress: fake.resolves({}),
};

class AxiosForbiddenError extends Error {
  constructor(message) {
    super();
    this.response = {
      status: 403,
    };
  }
}

class AxiosTooManyRequestsError extends Error {
  constructor(message) {
    super();
    this.response = {
      status: 429,
    };
  }
}

describe('gateway.getTTSApiUrl', () => {
  const variable = {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  };
  const system = {
    getInfos: fake.resolves({ gladys_version: 'v4.12.2' }),
  };
  it('should return url', async () => {
    const Gateway = proxyquire('../../../lib/gateway', {
      '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
    });
    const gateway = new Gateway(variable, event, system, {}, {}, {}, {}, {}, job);
    const data = await gateway.getTTSApiUrl();
    expect(data).to.deep.equal({ url: 'http://test.com' });
  });
  it('should return 429', async () => {
    const tooManyRequests = function gladysGatewayJsMock() {
      return {
        ttsGetToken: fake.rejects(new AxiosTooManyRequestsError()),
      };
    };
    const Gateway = proxyquire('../../../lib/gateway', {
      '@gladysassistant/gladys-gateway-js': tooManyRequests,
    });
    const gateway = new Gateway(variable, event, system, {}, {}, {}, {}, {}, job);
    await assert.isRejected(gateway.getTTSApiUrl(), Error429);
  });
  it('should return 403', async () => {
    const forbidden = function gladysGatewayJsMock() {
      return {
        ttsGetToken: fake.rejects(new AxiosForbiddenError()),
      };
    };
    const Gateway = proxyquire('../../../lib/gateway', {
      '@gladysassistant/gladys-gateway-js': forbidden,
    });
    const gateway = new Gateway(variable, event, system, {}, {}, {}, {}, {}, job);
    await assert.isRejected(gateway.getTTSApiUrl(), Error403);
  });
  it('should return error', async () => {
    const forbidden = function gladysGatewayJsMock() {
      return {
        ttsGetToken: fake.rejects(new Error('test error')),
      };
    };
    const Gateway = proxyquire('../../../lib/gateway', {
      '@gladysassistant/gladys-gateway-js': forbidden,
    });
    const gateway = new Gateway(variable, event, system, {}, {}, {}, {}, {}, job);
    await assert.isRejected(gateway.getTTSApiUrl(), Error, 'test error');
  });
});
