const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();
const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const getConfig = require('../../../utils/getConfig');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.init', () => {
  const variable = {};
  const event = {};
  const userKeys = [
    {
      id: '55b440f0-99fc-4ef8-bfe6-cd13adb4071e',
      name: 'Tony',
      rsa_public_key: 'fingerprint',
      ecdsa_public_key: 'fingerprint',
      gladys_4_user_id: 'df033006-ee42-4b94-a324-3f558171c493',
      connected: false,
      accepted: false,
    },
  ];

  let gateway;
  let clock;

  beforeEach(() => {
    const job = {
      wrapper: (type, func) => {
        return async () => {
          return func();
        };
      },
      updateProgress: fake.resolves({}),
    };

    variable.getValue = (name) => {
      if (name === SYSTEM_VARIABLE_NAMES.TIMEZONE) {
        return 'Europe/Paris';
      }
      if (name === SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_ENABLED) {
        return '0';
      }
      if (name === SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_DAY) {
        return '0';
      }
      if (name === SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_HOUR) {
        return '18';
      }
      if (name === SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE) {
        return null;
      }
      return JSON.stringify(userKeys);
    };
    variable.setValue = fake.resolves(null);

    event.on = fake.returns(null);
    event.emit = fake.returns(null);

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

    gateway = new Gateway(variable, event, {}, {}, config, {}, {}, {}, job, scheduler);

    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('check constructor event subscription', () => {
    assert.callCount(event.on, 11);
  });

  it('check init well connected', async () => {
    await gateway.init();

    clock.tick(1000);

    expect(gateway.connected).to.equal(true);
    expect(gateway.usersKeys).to.deep.equal(userKeys);
    expect(gateway.backupSchedule).to.deep.contains({
      rule: { tz: 'Europe/Paris', hour: 2, minute: 0, second: 0 },
    });
  });

  it('check init not connected', async () => {
    // Store job with cancel method
    gateway.backupSchedule = {};
    // Force error
    gateway.gladysGatewayClient.instanceConnect = fake.rejects(null);

    await gateway.init();

    clock.tick(1000);

    expect(gateway.connected).to.equal(false);
    expect(gateway.usersKeys).to.deep.equal(userKeys);
    expect(gateway.backupSchedule).to.deep.contains({
      rule: { tz: 'Europe/Paris', hour: 2, minute: 0, second: 0 },
    });
  });

  it('should start unlocked when no payment lock was saved', async () => {
    await gateway.init();

    expect(gateway.subscriptionActive).to.equal(true);
    expect(gateway.subscriptionPaymentRequiredSince).to.equal(null);
    assert.notCalled(gateway.gladysGatewayClient.getBackups);
  });

  it('should start locked and check the subscription again when a payment lock was saved', async () => {
    const { getValue } = variable;
    variable.getValue = (name) => {
      if (name === SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE) {
        return '2026-09-01T00:00:00.000Z';
      }
      return getValue(name);
    };
    variable.destroy = fake.resolves(null);
    const error = new Error();
    error.response = { status: 402 };
    gateway.gladysGatewayClient.getBackups = fake.rejects(error);

    await gateway.init();

    expect(gateway.connected).to.equal(true);
    expect(gateway.subscriptionActive).to.equal(false);
    expect(gateway.subscriptionPaymentRequiredSince).to.equal('2026-09-01T00:00:00.000Z');
    assert.calledOnce(gateway.gladysGatewayClient.getBackups);
  });

  it('should unlock at startup when the subscription was paid while the instance was off', async () => {
    const { getValue } = variable;
    variable.getValue = (name) => {
      if (name === SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE) {
        return '2026-09-01T00:00:00.000Z';
      }
      return getValue(name);
    };
    variable.destroy = fake.resolves(null);

    await gateway.init();

    expect(gateway.subscriptionActive).to.equal(true);
    expect(gateway.subscriptionPaymentRequiredSince).to.equal(null);
    assert.calledOnceWithExactly(variable.destroy, SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE);
  });

  it('should continue init when the subscription check fails at startup', async () => {
    const { getValue } = variable;
    variable.getValue = (name) => {
      if (name === SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE) {
        return '2026-09-01T00:00:00.000Z';
      }
      return getValue(name);
    };
    gateway.gladysGatewayClient.getBackups = fake.rejects(new Error('network'));

    await gateway.init();

    expect(gateway.connected).to.equal(true);
    expect(gateway.subscriptionActive).to.equal(false);
    assert.calledOnce(gateway.gladysGatewayClient.getBackups);
  });

  it('should stay locked when a payment lock was saved and Gladys Plus is unreachable', async () => {
    const { getValue } = variable;
    variable.getValue = (name) => {
      if (name === SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE) {
        return '2026-09-01T00:00:00.000Z';
      }
      return getValue(name);
    };
    gateway.gladysGatewayClient.instanceConnect = fake.rejects(null);

    await gateway.init();

    expect(gateway.connected).to.equal(false);
    expect(gateway.subscriptionActive).to.equal(false);
    assert.notCalled(gateway.gladysGatewayClient.getBackups);
  });

  it('should continue init when user keys sync fails', async () => {
    gateway.getUsersKeys = fake.rejects(new Error('sync failed'));

    await gateway.init();

    expect(gateway.connected).to.equal(true);
    expect(gateway.usersKeys).to.deep.equal(userKeys);
  });

  it('should continue init when weekly digest scheduling fails', async () => {
    gateway.scheduleWeeklyDigest = fake.rejects(new Error('scheduling failed'));

    await gateway.init();

    expect(gateway.connected).to.equal(true);
    expect(gateway.backupSchedule).to.deep.contains({
      rule: { tz: 'Europe/Paris', hour: 2, minute: 0, second: 0 },
    });
  });

  it('check init cancel pending job', async () => {
    // Store job
    const cancel = fake.returns(null);
    gateway.backupSchedule = {
      cancel,
    };

    await gateway.init();

    assert.calledOnceWithExactly(cancel);
  });
});
