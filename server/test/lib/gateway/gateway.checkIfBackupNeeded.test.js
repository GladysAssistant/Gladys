const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const getConfig = require('../../../utils/getConfig');
const { EVENTS } = require('../../../utils/constants');
const { Error500 } = require('../../../utils/httpErrors');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.checkIfBackupNeeded', () => {
  const event = {};

  let gateway;
  let clock;

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

    gateway = new Gateway({}, event, {}, {}, config, {}, {}, {}, job, scheduler);
    gateway.backupRandomInterval = 50;

    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should check if backup is needed and not connected', async () => {
    // Force connected mode
    gateway.connected = false;

    await gateway.checkIfBackupNeeded();

    assert.notCalled(gateway.gladysGatewayClient.getBackups);

    // wait Xms and see if backup was called
    clock.tick(gateway.backupRandomInterval * 10);
    assert.notCalled(event.emit);
  });

  it('should not backup when Gladys Plus answers payment required', async () => {
    gateway.connected = true;
    const error = new Error();
    error.response = { status: 402 };
    gateway.gladysGatewayClient.getBackups = fake.rejects(error);
    gateway.variable = { setValue: fake.resolves(null), destroy: fake.resolves(null) };

    await gateway.checkIfBackupNeeded();

    assert.calledOnce(gateway.gladysGatewayClient.getBackups);
    expect(gateway.subscriptionActive).to.equal(false);
    clock.tick(gateway.backupRandomInterval * 10);
    assert.neverCalledWith(event.emit, EVENTS.GATEWAY.CREATE_BACKUP);
  });

  it('should forward errors other than payment required', async () => {
    gateway.connected = true;
    gateway.gladysGatewayClient.getBackups = fake.rejects(new Error('network'));

    try {
      await gateway.checkIfBackupNeeded();
      expect.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(Error500);
    }
    clock.tick(gateway.backupRandomInterval * 10);
    assert.neverCalledWith(event.emit, EVENTS.GATEWAY.CREATE_BACKUP);
  });

  it('should check if backup is needed and execute backup as none exists', async () => {
    // Force connected mode
    gateway.connected = true;
    // Force last backup date
    gateway.gladysGatewayClient.getBackups = fake.resolves([]);

    await gateway.checkIfBackupNeeded();

    assert.calledOnce(gateway.gladysGatewayClient.getBackups);

    // wait Xms and see if backup was called
    clock.tick(gateway.backupRandomInterval * 10);
    assert.calledOnceWithExactly(event.emit, EVENTS.GATEWAY.CREATE_BACKUP);
  });

  it('should check if backup is needed and execute backup as last is old', async () => {
    // Force connected mode
    gateway.connected = true;
    // Force last backup date
    gateway.gladysGatewayClient.getBackups = fake.resolves([
      {
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days in the past
      },
    ]);

    await gateway.checkIfBackupNeeded();

    assert.calledOnce(gateway.gladysGatewayClient.getBackups);

    // wait Xms and see if backup was called
    clock.tick(gateway.backupRandomInterval * 10);
    assert.calledOnceWithExactly(event.emit, EVENTS.GATEWAY.CREATE_BACKUP);
  });

  it('should check if backup is needed and avoid backup as last to young', async () => {
    // Force connected mode
    gateway.connected = true;
    // Force last backup date
    gateway.gladysGatewayClient.getBackups = fake.resolves([
      {
        created_at: Date.now(), // now
      },
    ]);

    await gateway.checkIfBackupNeeded();

    assert.calledOnce(gateway.gladysGatewayClient.getBackups);

    // wait Xms and see if backup was called
    clock.tick(gateway.backupRandomInterval * 10);
    assert.notCalled(event.emit);
  });
});
