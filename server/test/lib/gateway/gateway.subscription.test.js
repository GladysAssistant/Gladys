const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const getConfig = require('../../../utils/getConfig');
const { EVENTS, SYSTEM_VARIABLE_NAMES, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { Error402, Error403 } = require('../../../utils/httpErrors');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

class AxiosPaymentRequiredError extends Error {
  constructor() {
    super();
    this.response = {
      status: 402,
      data: { status: 402, error_code: 'PAYMENT_REQUIRED', error_message: 'Account is not active' },
    };
  }
}

describe('gateway subscription lock', () => {
  const event = {};
  const variable = {};
  const user = {};
  const message = {};
  const brain = {};

  let gateway;

  beforeEach(async () => {
    const job = {
      wrapper: (type, func) => {
        return async () => {
          return func();
        };
      },
      updateProgress: fake.resolves({}),
    };

    event.on = fake.returns(null);
    event.emit = fake.returns(null);
    variable.getValue = fake.resolves(null);
    variable.setValue = fake.resolves(null);
    variable.destroy = fake.resolves(null);
    user.getByRole = fake.resolves([
      { selector: 'tony', language: 'en' },
      { selector: 'pepper', language: 'fr' },
    ]);
    message.sendToUser = fake.resolves(null);
    brain.getReply = fake.returns('Payment required!');

    const config = getConfig();

    const scheduler = {
      scheduleJob: (rule, callback) => {
        return {
          callback,
          rule,
          cancel: () => {},
        };
      },
    };

    gateway = new Gateway(variable, event, {}, {}, config, user, {}, {}, job, scheduler, message, brain);
    gateway.connected = true;
  });

  afterEach(() => {
    sinon.reset();
  });

  describe('setSubscriptionActive', () => {
    it('should lock the instance, persist it, notify the front and the admins', async () => {
      await gateway.setSubscriptionActive(false);

      expect(gateway.subscriptionActive).to.equal(false);
      expect(gateway.subscriptionPaymentRequiredSince).to.be.a('string');
      assert.calledOnceWithExactly(
        variable.setValue,
        SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE,
        gateway.subscriptionPaymentRequiredSince,
      );
      assert.calledWith(event.emit, EVENTS.GATEWAY.SUBSCRIPTION_STATUS_CHANGED, {
        subscription_active: false,
        payment_required_since: gateway.subscriptionPaymentRequiredSince,
      });
      assert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.GATEWAY.SUBSCRIPTION_STATUS_CHANGED,
        payload: {
          subscription_active: false,
          payment_required_since: gateway.subscriptionPaymentRequiredSince,
        },
      });
      assert.calledWith(brain.getReply, 'en', 'gateway.payment-required');
      assert.calledWith(brain.getReply, 'fr', 'gateway.payment-required');
      assert.calledWith(message.sendToUser, 'tony', 'Payment required!', null, { messageType: 'notification' });
      assert.calledWith(message.sendToUser, 'pepper', 'Payment required!', null, { messageType: 'notification' });
    });

    it('should do nothing when the state does not change', async () => {
      await gateway.setSubscriptionActive(true);

      expect(gateway.subscriptionActive).to.equal(true);
      assert.notCalled(variable.setValue);
      assert.notCalled(variable.destroy);
      assert.notCalled(event.emit);
      assert.notCalled(message.sendToUser);
    });

    it('should lock only once when several calls fail at the same time', async () => {
      await Promise.all([gateway.setSubscriptionActive(false), gateway.setSubscriptionActive(false)]);

      assert.calledOnce(variable.setValue);
      assert.calledTwice(message.sendToUser);
    });

    it('should unlock the instance and clear the persisted lock', async () => {
      await gateway.setSubscriptionActive(false);
      sinon.reset();

      await gateway.setSubscriptionActive(true);

      expect(gateway.subscriptionActive).to.equal(true);
      expect(gateway.subscriptionPaymentRequiredSince).to.equal(null);
      assert.calledOnceWithExactly(variable.destroy, SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE);
      assert.calledWith(event.emit, EVENTS.GATEWAY.SUBSCRIPTION_STATUS_CHANGED, {
        subscription_active: true,
        payment_required_since: null,
      });
      assert.calledWith(brain.getReply, 'en', 'gateway.subscription-active');
    });

    it('should still lock when admins cannot be notified', async () => {
      user.getByRole = fake.rejects(new Error('no users'));

      await gateway.setSubscriptionActive(false);

      expect(gateway.subscriptionActive).to.equal(false);
      assert.calledOnce(variable.setValue);
    });
  });

  describe('throwIfPaymentRequired', () => {
    it('should lock and throw a 402 on a payment required error', async () => {
      try {
        await gateway.throwIfPaymentRequired(new AxiosPaymentRequiredError());
        expect.fail();
      } catch (e) {
        expect(e).instanceOf(Error402);
      }
      expect(gateway.subscriptionActive).to.equal(false);
    });

    it('should ignore any other error', async () => {
      const error = new Error();
      error.response = { status: 403 };
      await gateway.throwIfPaymentRequired(error);
      await gateway.throwIfPaymentRequired(new Error('network'));
      await gateway.throwIfPaymentRequired(null);
      expect(gateway.subscriptionActive).to.equal(true);
    });
  });

  describe('getStatus', () => {
    it('should expose the subscription state', async () => {
      await gateway.setSubscriptionActive(false);
      const status = await gateway.getStatus();
      expect(status).to.deep.equal({
        configured: false,
        connected: true,
        subscription_active: false,
        payment_required_since: gateway.subscriptionPaymentRequiredSince,
      });
    });
  });

  describe('refreshSubscriptionStatus', () => {
    beforeEach(() => {
      // instance linked to Gladys Plus
      variable.getValue = fake.resolves('value');
    });

    it('should not call Gladys Plus when the instance is not linked', async () => {
      variable.getValue = fake.resolves(null);
      gateway.subscriptionActive = false;

      const status = await gateway.refreshSubscriptionStatus();

      assert.notCalled(gateway.gladysGatewayClient.getBackups);
      expect(status.configured).to.equal(false);
      expect(status.subscription_active).to.equal(false);
    });

    it('should stay locked when Gladys Plus still answers payment required', async () => {
      gateway.gladysGatewayClient.getBackups = fake.rejects(new AxiosPaymentRequiredError());
      gateway.subscriptionActive = false;

      const status = await gateway.refreshSubscriptionStatus();

      assert.calledOnce(gateway.gladysGatewayClient.getBackups);
      expect(status.subscription_active).to.equal(false);
      assert.neverCalledWith(event.emit, EVENTS.GATEWAY.CHECK_IF_BACKUP_NEEDED);
    });

    it('should unlock and run the backup check when the subscription is paid again', async () => {
      gateway.subscriptionActive = false;
      gateway.subscriptionPaymentRequiredSince = '2026-09-01T00:00:00.000Z';

      const status = await gateway.refreshSubscriptionStatus();

      assert.calledOnce(gateway.gladysGatewayClient.getBackups);
      expect(status.subscription_active).to.equal(true);
      expect(status.payment_required_since).to.equal(null);
      assert.calledWith(event.emit, EVENTS.GATEWAY.CHECK_IF_BACKUP_NEEDED);
      assert.calledWith(brain.getReply, 'en', 'gateway.subscription-active');
    });

    it('should not run the backup check when the subscription was already active', async () => {
      const status = await gateway.refreshSubscriptionStatus();

      expect(status.subscription_active).to.equal(true);
      assert.neverCalledWith(event.emit, EVENTS.GATEWAY.CHECK_IF_BACKUP_NEEDED);
    });

    it('should forward other errors', async () => {
      const error = new Error();
      error.response = { status: 403 };
      gateway.gladysGatewayClient.getBackups = fake.rejects(error);

      try {
        await gateway.refreshSubscriptionStatus();
        expect.fail();
      } catch (e) {
        expect(e).instanceOf(Error403);
      }
      expect(gateway.subscriptionActive).to.equal(true);
    });
  });
});
