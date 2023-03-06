const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const getConfig = require('../../../utils/getConfig');
const { EVENTS } = require('../../../utils/constants');

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
