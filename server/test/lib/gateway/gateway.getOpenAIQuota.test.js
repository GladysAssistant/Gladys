const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const EventEmitter = require('events');

const Gateway = require('../../../lib/gateway');
const { Error402 } = require('../../../utils/httpErrors');

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

  it('should lock Gladys Plus features and throw 402 when payment is required', async () => {
    const error = new Error();
    error.response = { status: 402, data: { error_code: 'PAYMENT_REQUIRED' } };
    gateway.gladysGatewayClient.openAIGetQuota = fake.rejects(error);

    try {
      await gateway.getOpenAIQuota();
      expect.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(Error402);
    }
    expect(gateway.subscriptionActive).to.equal(false);
  });

  it('should refuse the call locally while the instance is locked', async () => {
    gateway.subscriptionActive = false;

    try {
      await gateway.getOpenAIQuota();
      expect.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(Error402);
    }
    expect(gateway.gladysGatewayClient.openAIGetQuota.called).to.equal(false);
  });

  it('should unlock the instance when the quota is served again', async () => {
    gateway.subscriptionActive = true;
    gateway.gladysGatewayClient.openAIGetQuota = fake.resolves({ text: {}, image: {} });
    gateway.setSubscriptionActive = fake.resolves(null);

    await gateway.getOpenAIQuota();

    expect(gateway.setSubscriptionActive.calledOnceWithExactly(true, gateway.subscriptionLinkGeneration)).to.equal(
      true,
    );
  });

  it('should forward other errors', async () => {
    gateway.gladysGatewayClient.openAIGetQuota = fake.rejects(new Error('network'));

    try {
      await gateway.getOpenAIQuota();
      expect.fail();
    } catch (e) {
      expect(e.message).to.equal('network');
    }
    expect(gateway.subscriptionActive).to.equal(true);
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
