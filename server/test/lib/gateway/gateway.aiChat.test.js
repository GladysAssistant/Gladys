const { expect, assert } = require('chai');
const { fake, stub, assert: sinonAssert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');
const { Error403, Error429 } = require('../../../utils/httpErrors');

const event = new EventEmitter();

const postMock = stub().resolves({ answer: 'this is the answer' });

const Gateway = proxyquire('../../../lib/gateway', {
  './gateway.aiChat': proxyquire('../../../lib/gateway/gateway.aiChat', {
    '@gladysassistant/gladys-gateway-js/lib/request': {
      post: postMock,
    },
  }),
});

const job = {
  wrapper: (type, func) => {
    return async () => func();
  },
  updateProgress: fake.resolves({}),
};

describe('gateway.aiChat', () => {
  const variable = {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  };
  const system = {};
  let gateway;

  beforeEach(() => {
    gateway = new Gateway(variable, event, system, {}, {}, {}, {}, {}, job);
    gateway.gladysGatewayClient.serverUrl = 'https://api.gladysgateway.com';
    postMock.resetHistory();
    postMock.reset();
    postMock.resolves({ answer: 'this is the answer' });
  });

  it('should call aichat endpoint', async () => {
    const body = { messages: [{ role: 'user', content: 'hello' }], tools: [], tool_choice: 'auto' };
    const data = await gateway.aiChat(body);

    expect(data).to.deep.equal({ answer: 'this is the answer' });
    sinonAssert.calledWith(postMock, 'https://api.gladysgateway.com/aichat/chat', body, gateway.gladysGatewayClient);
  });

  it('should throw Error403 on forbidden', async () => {
    const error = new Error('Forbidden');
    // @ts-ignore
    error.response = {
      status: 403,
      data: { error_message: 'forbidden' },
    };
    postMock.rejects(error);
    const promise = gateway.aiChat({ messages: [] });
    await assert.isRejected(promise, Error403);
  });

  it('should throw Error429 on rate limit', async () => {
    const error = new Error('Too many requests');
    // @ts-ignore
    error.response = {
      status: 429,
      data: { error_message: 'too many requests' },
    };
    postMock.rejects(error);
    const promise = gateway.aiChat({ messages: [] });
    await assert.isRejected(promise, Error429);
  });

  it('should throw unknown errors as-is', async () => {
    const error = new Error('unknown error');
    // @ts-ignore
    error.response = {
      status: 500,
    };
    postMock.rejects(error);
    const promise = gateway.aiChat({ messages: [] });
    await assert.isRejected(promise, Error);
  });
});
