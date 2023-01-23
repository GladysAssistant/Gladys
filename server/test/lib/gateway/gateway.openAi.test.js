const { expect, assert } = require('chai');
const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');
const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const { Error403, Error429 } = require('../../../utils/httpErrors');

const event = new EventEmitter();

const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

const job = {
  wrapper: (type, func) => {
    return async () => {
      return func();
    };
  },
  updateProgress: fake.resolves({}),
};

describe('gateway.openAI.ask', () => {
  const variable = {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  };
  const system = {};
  let gateway;
  beforeEach(() => {
    gateway = new Gateway(variable, event, system, {}, {}, {}, {}, {}, job);
  });
  it('should ask to GPT-3 a question', async () => {
    const data = await gateway.openAIAsk({ question: 'Question ?' });
    expect(data).to.deep.equal({ answer: 'this is the answer' });
  });
  it('should return 403 forbidden', async () => {
    const error = new Error('Forbidden');
    // @ts-ignore
    error.response = {
      status: 403,
    };
    gateway.gladysGatewayClient.openAIAsk = fake.throws(error);
    const promise = gateway.openAIAsk({ question: 'Question ?' });
    await assert.isRejected(promise, Error403);
  });
  it('should return 429 too many requests', async () => {
    const error = new Error('too many requests');
    // @ts-ignore
    error.response = {
      status: 429,
    };
    gateway.gladysGatewayClient.openAIAsk = fake.rejects(error);
    const promise = gateway.openAIAsk({ question: 'Question ?' });
    await assert.isRejected(promise, Error429);
  });
  it('should return 500, server error', async () => {
    const error = new Error('unknown error');
    // @ts-ignore
    error.response = {
      status: 500,
    };
    gateway.gladysGatewayClient.openAIAsk = fake.rejects(error);
    const promise = gateway.openAIAsk({ question: 'Question ?' });
    await assert.isRejected(promise, Error);
  });
});
