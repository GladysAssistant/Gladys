const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { EVENTS, WEBSOCKET_MESSAGE_TYPES, SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.disconnect', () => {
  const variable = {};

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

    variable.destroy = fake.resolves(null);
    variable.setValue = fake.resolves(null);

    const scheduler = {
      scheduleJob: (rule, callback) => {
        return {
          callback,
          rule,
          cancel: () => {},
        };
      },
    };

    const event = {
      on: fake.returns(null),
      emit: fake.returns(null),
    };

    gateway = new Gateway(variable, event, {}, {}, {}, {}, {}, {}, job, scheduler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should cancel the scheduled backup of the unlinked account', async () => {
    const clock = sinon.useFakeTimers();
    try {
      const scheduled = fake.returns(null);
      gateway.pendingBackupTimer = setTimeout(scheduled, 1000);

      await gateway.disconnect();

      clock.tick(10000);
      assert.notCalled(scheduled);
      expect(gateway.pendingBackupTimer).to.equal(null);
    } finally {
      clock.restore();
    }
  });

  it('should wait for a change of the backup health in progress before deleting its keys', async () => {
    const steps = [];
    gateway.backupHealthTransition = new Promise((resolve) => {
      setTimeout(() => {
        steps.push('health change done');
        resolve();
      }, 10);
    });
    variable.destroy = sinon.stub().callsFake(async () => {
      steps.push('destroy');
    });

    await gateway.disconnect();

    expect(steps[0]).to.equal('health change done');
    expect(steps.filter((step) => step === 'destroy').length).to.equal(12);
  });

  it('should disconnect Gateway', async () => {
    await gateway.disconnect();

    assert.calledOnceWithExactly(gateway.gladysGatewayClient.disconnect);
    assert.callCount(variable.destroy, 12);
    assert.calledWith(variable.destroy, SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT);
    assert.calledWith(variable.destroy, SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE);
    assert.calledWith(variable.destroy, SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_ERROR);
    assert.calledWith(variable.destroy, SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT);
    expect(gateway.pendingBackupTimer).to.equal(null);
    expect(gateway.subscriptionActive).to.equal(true);
    // Plus is now unlinked: external integration webhooks recompute
    assert.calledWith(gateway.event.emit, EVENTS.GATEWAY.LINK_STATUS_CHANGED);
    assert.neverCalledWith(gateway.event.emit, EVENTS.WEBSOCKET.SEND_ALL);
  });

  it('should clear the payment lock and tell the front when disconnecting a locked instance', async () => {
    gateway.subscriptionActive = false;
    gateway.subscriptionPaymentRequiredSince = '2026-09-01T00:00:00.000Z';

    await gateway.disconnect();

    expect(gateway.subscriptionActive).to.equal(true);
    expect(gateway.subscriptionPaymentRequiredSince).to.equal(null);
    assert.calledWith(gateway.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.GATEWAY.SUBSCRIPTION_STATUS_CHANGED,
      payload: { subscription_active: true, payment_required_since: null },
    });
    assert.calledWith(gateway.event.emit, EVENTS.GATEWAY.LINK_STATUS_CHANGED);
  });

  it('should let a lock in progress finish, then reset it, when disconnecting', async () => {
    let resolveSetValue;
    const setValuePromise = new Promise((resolve) => {
      resolveSetValue = resolve;
    });
    variable.setValue = fake.returns(setValuePromise);

    // a 402 is being persisted when the account is unlinked
    const lock = gateway.setSubscriptionActive(false);
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    assert.calledOnce(variable.setValue);
    const disconnect = gateway.disconnect();
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    // the reset waits for the lock to be persisted
    assert.notCalled(variable.destroy);

    resolveSetValue();
    await Promise.all([lock, disconnect]);

    expect(gateway.subscriptionActive).to.equal(true);
    expect(gateway.subscriptionPaymentRequiredSince).to.equal(null);
    assert.calledWith(variable.destroy, SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE);
    const lastStatusEvent = gateway.event.emit
      .getCalls()
      .filter((call) => call.args[0] === EVENTS.WEBSOCKET.SEND_ALL)
      .pop().args[1];
    expect(lastStatusEvent.payload).to.deep.equal({ subscription_active: true, payment_required_since: null });
  });

  it('should still reset the lock when the lock in progress fails to persist', async () => {
    let rejectSetValue;
    const setValuePromise = new Promise((resolve, reject) => {
      rejectSetValue = reject;
    });
    variable.setValue = fake.returns(setValuePromise);

    const lock = gateway.setSubscriptionActive(false);
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    const disconnect = gateway.disconnect();
    rejectSetValue(new Error('db locked'));
    await disconnect;
    await lock.catch(() => null);

    expect(gateway.subscriptionActive).to.equal(true);
    expect(gateway.subscriptionPaymentRequiredSince).to.equal(null);
    assert.calledWith(variable.destroy, SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE);
    assert.calledWith(gateway.event.emit, EVENTS.GATEWAY.LINK_STATUS_CHANGED);
  });

  it('should drop a lock asked by a call made for the unlinked account', async () => {
    const generationBeforeDisconnect = gateway.subscriptionLinkGeneration;

    await gateway.disconnect();
    // a 402 of the previous account lands after the unlink
    await gateway.setSubscriptionActive(false, generationBeforeDisconnect);

    expect(gateway.subscriptionActive).to.equal(true);
    assert.notCalled(variable.setValue);
    assert.calledWith(variable.destroy, SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE);
  });
});
