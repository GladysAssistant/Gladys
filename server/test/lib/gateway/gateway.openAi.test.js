const { expect } = require('chai');
const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');
const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

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
  const gateway = new Gateway(variable, event, system, {}, {}, {}, {}, {}, job);
  it('should ask to GPT-3 a question', async () => {
    const data = await gateway.openAIAsk({ question: 'Question ?' });
    expect(data).to.deep.equal({ answer: 'this is the answer' });
  });
});
