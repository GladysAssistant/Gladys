const { expect, assert } = require('chai');
const { fake } = require('sinon');
const EventEmitter = require('events');
const { Error403, Error429 } = require('../../../utils/httpErrors');
const Gateway = require('../../../lib/gateway');

const event = new EventEmitter();

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
    gateway.gladysGatewayClient.openAIAsk = fake.resolves({ answer: 'this is the answer' });
  });

  it('should call aichat endpoint', async () => {
    const body = { messages: [{ role: 'user', content: 'hello' }], tools: [], tool_choice: 'auto' };
    const data = await gateway.aiChat(body);

    expect(data).to.deep.equal({ answer: 'this is the answer' });
    expect(gateway.gladysGatewayClient.openAIAsk.calledOnceWith(body)).to.equal(true);
  });

  it('should throw Error403 on forbidden', async () => {
    const error = new Error('Forbidden');
    // @ts-ignore
    error.response = {
      status: 403,
      data: { error_message: 'forbidden' },
    };
    gateway.gladysGatewayClient.openAIAsk = fake.rejects(error);
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
    gateway.gladysGatewayClient.openAIAsk = fake.rejects(error);
    const promise = gateway.aiChat({ messages: [] });
    await assert.isRejected(promise, Error429);
  });

  it('should throw unknown errors as-is', async () => {
    const error = new Error('unknown error');
    // @ts-ignore
    error.response = {
      status: 500,
    };
    gateway.gladysGatewayClient.openAIAsk = fake.rejects(error);
    const promise = gateway.aiChat({ messages: [] });
    await assert.isRejected(promise, Error);
  });
});
