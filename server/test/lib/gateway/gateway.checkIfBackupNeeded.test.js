const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const getConfig = require('../../../utils/getConfig');
const { EVENTS, SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { BACKUP_ERRORS } = require('../../../lib/gateway/gateway.backupHealth');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

const HOUR = 60 * 60 * 1000;

describe('gateway.checkIfBackupNeeded', () => {
  const event = {};

  let gateway;
  let variables;
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

    // an in-memory store of the system variables: a linked instance, in Paris
    variables = new Map([
      ['GLADYS_GATEWAY_REFRESH_TOKEN', 'refresh-token'],
      [SYSTEM_VARIABLE_NAMES.TIMEZONE, 'Europe/Paris'],
    ]);
    const variable = {
      getValue: sinon.stub().callsFake(async (name) => (variables.has(name) ? variables.get(name) : null)),
      setValue: sinon.stub().callsFake(async (name, value) => {
        variables.set(name, value);
      }),
      destroy: sinon.stub().callsFake(async (name) => {
        variables.delete(name);
      }),
    };

    gateway = new Gateway(variable, event, {}, {}, config, {}, {}, {}, job, scheduler);
    gateway.backupRandomInterval = 50;
    gateway.recordBackupFailure = fake.resolves(null);
    gateway.recordBackupSuccess = fake.resolves(null);

    // the nightly check: 03:30 in Paris, the 5th of January
    clock = sinon.useFakeTimers(new Date('2024-01-05T02:30:00.000Z'));
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should do nothing when Gladys Plus is not configured', async () => {
    gateway.connected = false;
    variables.delete('GLADYS_GATEWAY_REFRESH_TOKEN');

    await gateway.checkIfBackupNeeded();

    assert.notCalled(gateway.gladysGatewayClient.getBackups);
    assert.notCalled(gateway.recordBackupFailure);
    clock.tick(gateway.backupRandomInterval * 10);
    assert.notCalled(event.emit);
  });

  it('should record a failed night when the instance is linked but not connected', async () => {
    gateway.connected = false;

    await gateway.checkIfBackupNeeded();

    assert.notCalled(gateway.gladysGatewayClient.getBackups);
    assert.calledOnceWithExactly(gateway.recordBackupFailure, BACKUP_ERRORS.NOT_CONNECTED);
    clock.tick(gateway.backupRandomInterval * 10);
    assert.notCalled(event.emit);
  });

  it('should not backup when Gladys Plus answers payment required', async () => {
    gateway.connected = true;
    const error = new Error();
    error.response = { status: 402 };
    gateway.gladysGatewayClient.getBackups = fake.rejects(error);

    await gateway.checkIfBackupNeeded();

    assert.calledOnce(gateway.gladysGatewayClient.getBackups);
    expect(gateway.subscriptionActive).to.equal(false);
    // the admins are already told by the lock itself
    assert.notCalled(gateway.recordBackupFailure);
    clock.tick(gateway.backupRandomInterval * 10);
    assert.neverCalledWith(event.emit, EVENTS.GATEWAY.CREATE_BACKUP);
  });

  it('should not backup when the Gladys Plus plan does not include backups', async () => {
    gateway.connected = true;
    const error = new Error();
    error.response = { status: 403 };
    gateway.gladysGatewayClient.getBackups = fake.rejects(error);

    await gateway.checkIfBackupNeeded();

    assert.calledOnce(gateway.gladysGatewayClient.getBackups);
    // a plan without backups is not an unpaid subscription: no lock
    expect(gateway.subscriptionActive).to.equal(true);
    // nothing to back up, nothing to report
    assert.notCalled(gateway.recordBackupFailure);
    clock.tick(gateway.backupRandomInterval * 10);
    assert.neverCalledWith(event.emit, EVENTS.GATEWAY.CREATE_BACKUP);
  });

  it('should record a failed night, without throwing, when Gladys Plus cannot be reached', async () => {
    gateway.connected = true;
    gateway.gladysGatewayClient.getBackups = fake.rejects(new Error('network'));

    await gateway.checkIfBackupNeeded();

    assert.calledOnceWithExactly(gateway.recordBackupFailure, BACKUP_ERRORS.UNREACHABLE);
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
    // nothing to sync: no backup yet
    assert.notCalled(gateway.recordBackupSuccess);

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

  it('should backup every day: the last backup was made yesterday, less than 24 hours ago', async () => {
    gateway.connected = true;
    // yesterday at 03:45 in Paris, 22h45 before this check: the former
    // "more than 24 hours old" rule skipped this night, one night out of two
    gateway.gladysGatewayClient.getBackups = fake.resolves([
      {
        created_at: new Date('2024-01-04T02:45:00.000Z').toISOString(),
      },
    ]);

    await gateway.checkIfBackupNeeded();

    clock.tick(gateway.backupRandomInterval * 10);
    assert.calledOnceWithExactly(event.emit, EVENTS.GATEWAY.CREATE_BACKUP);
  });

  it('should backup when the last backup is from yesterday in the timezone of the instance, today in UTC', async () => {
    gateway.connected = true;
    // the 4th at 23:30 in Paris is the 4th at 22:30 UTC: yesterday in both,
    // but the 4th at 23:30 UTC is already the 5th in Paris
    gateway.gladysGatewayClient.getBackups = fake.resolves([
      {
        created_at: new Date('2024-01-04T22:30:00.000Z').toISOString(),
      },
    ]);

    await gateway.checkIfBackupNeeded();

    clock.tick(gateway.backupRandomInterval * 10);
    assert.calledOnceWithExactly(event.emit, EVENTS.GATEWAY.CREATE_BACKUP);
  });

  it('should not backup when a backup was already made today in the timezone of the instance', async () => {
    gateway.connected = true;
    // the 4th at 23:30 UTC is the 5th at 00:30 in Paris: today
    gateway.gladysGatewayClient.getBackups = fake.resolves([
      {
        created_at: new Date('2024-01-04T23:30:00.000Z').toISOString(),
      },
    ]);

    await gateway.checkIfBackupNeeded();

    clock.tick(gateway.backupRandomInterval * 10);
    assert.notCalled(event.emit);
  });

  it('should not backup twice a day: the daytime catch-up after a successful night', async () => {
    gateway.connected = true;
    gateway.gladysGatewayClient.getBackups = fake.resolves([
      {
        created_at: new Date(Date.now() - HOUR).toISOString(),
      },
    ]);
    // the catch-up, 10:00 in Paris
    clock.tick(6.5 * HOUR);

    await gateway.checkIfBackupNeeded();

    clock.tick(gateway.backupRandomInterval * 10);
    assert.notCalled(event.emit);
  });

  it('should use the system timezone when the instance has none', async () => {
    gateway.connected = true;
    variables.delete(SYSTEM_VARIABLE_NAMES.TIMEZONE);
    gateway.gladysGatewayClient.getBackups = fake.resolves([
      {
        created_at: new Date(Date.now() - 10 * 24 * HOUR).toISOString(),
      },
    ]);

    await gateway.checkIfBackupNeeded();

    clock.tick(gateway.backupRandomInterval * 10);
    assert.calledOnceWithExactly(event.emit, EVENTS.GATEWAY.CREATE_BACKUP);
  });

  it('should fill the local health with the last backup of Gladys Plus when it has none', async () => {
    gateway.connected = true;
    const lastBackup = new Date('2024-01-04T02:45:00.000Z');
    gateway.gladysGatewayClient.getBackups = fake.resolves([{ created_at: lastBackup.toISOString() }]);

    await gateway.checkIfBackupNeeded();

    assert.calledOnce(gateway.recordBackupSuccess);
    expect(gateway.recordBackupSuccess.firstCall.args[0].getTime()).to.equal(lastBackup.getTime());
  });

  it('should fix the local health when Gladys Plus has a more recent backup (restore of an old backup)', async () => {
    gateway.connected = true;
    variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT, '2023-12-20T02:45:00.000Z');
    const lastBackup = new Date('2024-01-04T02:45:00.000Z');
    gateway.gladysGatewayClient.getBackups = fake.resolves([{ created_at: lastBackup.toISOString() }]);

    await gateway.checkIfBackupNeeded();

    assert.calledOnce(gateway.recordBackupSuccess);
    expect(gateway.recordBackupSuccess.firstCall.args[0].getTime()).to.equal(lastBackup.getTime());
  });

  it('should keep the local health when it is at least as recent as Gladys Plus', async () => {
    gateway.connected = true;
    variables.set(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT, '2024-01-04T02:50:00.000Z');
    gateway.gladysGatewayClient.getBackups = fake.resolves([{ created_at: '2024-01-04T02:45:00.000Z' }]);

    await gateway.checkIfBackupNeeded();

    assert.notCalled(gateway.recordBackupSuccess);
  });
});
