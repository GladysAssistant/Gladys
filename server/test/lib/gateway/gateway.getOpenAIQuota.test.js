const { expect } = require('chai');
const { fake } = require('sinon');
const EventEmitter = require('events');

const Gateway = require('../../../lib/gateway');

const event = new EventEmitter();

const job = {
  wrapper: (type, func) => {
    return async () => func();
  },
  updateProgress: fake.resolves({}),
};

describe('gateway.getOpenAIQuota', () => {
  const variable = {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  };
  const system = {};
  let gateway;

  beforeEach(() => {
    gateway = new Gateway(variable, event, system, {}, {}, {}, {}, {}, job);
    gateway.gladysGatewayClient.openAIGetQuota = fake.resolves({
      text: {
        remaining: 80,
        max: 100,
        reset_in_seconds: 3600,
      },
      image: {
        remaining: 50,
        max: 100,
        reset_in_seconds: 0,
      },
    });
  });

  it('should return OpenAI quota from gateway', async () => {
    const data = await gateway.getOpenAIQuota();

    expect(data).to.deep.equal({
      text: {
        remaining: 80,
        max: 100,
        reset_in_seconds: 3600,
      },
      image: {
        remaining: 50,
        max: 100,
        reset_in_seconds: 0,
      },
    });
    expect(gateway.gladysGatewayClient.openAIGetQuota.calledOnce).to.equal(true);
  });
});
