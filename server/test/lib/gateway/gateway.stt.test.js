const { expect, assert } = require('chai');
const { fake, assert: sinonAssert } = require('sinon');
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
  constructor() {
    super();
    this.response = {
      status: 403,
    };
  }
}

class AxiosTooManyRequestsError extends Error {
  constructor() {
    super();
    this.response = {
      status: 429,
    };
  }
}

describe('gateway.stt', () => {
  const variable = {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  };
  const system = {
    getInfos: fake.resolves({ gladys_version: 'v4.12.2' }),
  };

  it('should return transcription', async () => {
    const Gateway = proxyquire('../../../lib/gateway', {
      '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
    });
    const gateway = new Gateway(variable, event, system, {}, {}, {}, {}, {}, job);
    const data = await gateway.stt(Buffer.from('audio'));
    expect(data).to.deep.equal({ text: 'hello world' });
  });

  it('should forward content type to gladys gateway client', async () => {
    const stt = fake.resolves({ text: 'hello world' });
    const gladysGatewayJsMock = function gladysGatewayJsMock() {
      return { stt };
    };
    const Gateway = proxyquire('../../../lib/gateway', {
      '@gladysassistant/gladys-gateway-js': gladysGatewayJsMock,
    });
    const gateway = new Gateway(variable, event, system, {}, {}, {}, {}, {}, job);
    await gateway.stt(Buffer.from('audio'), 'audio/wav');
    sinonAssert.calledOnce(stt);
    sinonAssert.calledWith(stt, Buffer.from('audio'), 'audio/wav');
  });

  it('should return 429', async () => {
    const tooManyRequests = function gladysGatewayJsMock() {
      return {
        stt: fake.rejects(new AxiosTooManyRequestsError()),
      };
    };
    const Gateway = proxyquire('../../../lib/gateway', {
      '@gladysassistant/gladys-gateway-js': tooManyRequests,
    });
    const gateway = new Gateway(variable, event, system, {}, {}, {}, {}, {}, job);
    await assert.isRejected(gateway.stt(Buffer.from('audio')), Error429);
  });

  it('should return 403', async () => {
    const forbidden = function gladysGatewayJsMock() {
      return {
        stt: fake.rejects(new AxiosForbiddenError()),
      };
    };
    const Gateway = proxyquire('../../../lib/gateway', {
      '@gladysassistant/gladys-gateway-js': forbidden,
    });
    const gateway = new Gateway(variable, event, system, {}, {}, {}, {}, {}, job);
    await assert.isRejected(gateway.stt(Buffer.from('audio')), Error403);
  });

  it('should return error', async () => {
    const gatewayError = function gladysGatewayJsMock() {
      return {
        stt: fake.rejects(new Error('test error')),
      };
    };
    const Gateway = proxyquire('../../../lib/gateway', {
      '@gladysassistant/gladys-gateway-js': gatewayError,
    });
    const gateway = new Gateway(variable, event, system, {}, {}, {}, {}, {}, job);
    await assert.isRejected(gateway.stt(Buffer.from('audio')), Error, 'test error');
  });
});
