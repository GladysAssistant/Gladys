const { expect } = require('chai');
const sinon = require('sinon');
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
    assert.callCount(event.on, 10);
  });

  it('check init well connected', async () => {
    await gateway.init();

    clock.tick(1000);

    expect(gateway.connected).to.equal(true);
    expect(gateway.usersKeys).to.deep.equal(userKeys);
    expect(gateway.backupSchedule).to.deep.contains({
      rule: { tz: 'Europe/Paris', hour: 0, minute: 0, second: 0 },
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
      rule: { tz: 'Europe/Paris', hour: 0, minute: 0, second: 0 },
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
