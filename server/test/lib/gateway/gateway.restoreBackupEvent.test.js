const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();
const path = require('path');

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const getConfig = require('../../../utils/getConfig');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.restoreBackupEvent', () => {
  const variable = {};
  const event = {};
  const system = {};
  const sequelize = {};

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

    variable.getValue = fake.resolves('key');
    variable.setValue = fake.resolves(null);

    event.on = fake.returns(null);
    event.emit = fake.returns(null);

    sequelize.close = fake.resolves(null);

    system.shutdown = fake.resolves(true);

    // Restore into a throwaway file, NOT the worker's live test database: the
    // backup fixtures carry the schema of old real instances (e.g. a t_session
    // client_id column left over from removed OAuth migrations), and restoring
    // them over the live database would poison every test running after this
    // file. Spread getConfig()'s result: it returns a shared object, mutating
    // it would leak the storage override to the whole process.
    const config = { ...getConfig(), storage: `/tmp/gladys-database-restore-test-${process.pid}.db` };

    const scheduler = {
      scheduleJob: (rule, callback) => {
        return {
          callback,
          rule,
          cancel: () => {},
        };
      },
    };

    gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job, scheduler);
  });

  afterEach(async () => {
    sinon.reset();
  });

  it('should download and restore new backup (sqlite + parquet), then shutdown', async () => {
    const encryptedBackupFilePath = path.join(__dirname, 'encoded-gladys-db-and-duckdb-backup.tar.gz.enc');
    const restoreBackupEvent = {
      file_url: encryptedBackupFilePath,
    };

    await gateway.restoreBackupEvent(restoreBackupEvent);

    expect(gateway.restoreErrored).equals(false);
    expect(gateway.restoreInProgress).equals(true);

    assert.calledOnceWithExactly(system.shutdown);
  });

  it('should download and restore old sqlite backup, then shutdown', async () => {
    const encryptedBackupFilePath = path.join(__dirname, 'encoded-old-gladys-db-backup.db.gz.enc');
    const restoreBackupEvent = {
      file_url: encryptedBackupFilePath,
    };

    await gateway.restoreBackupEvent(restoreBackupEvent);

    expect(gateway.restoreErrored).equals(false);
    expect(gateway.restoreInProgress).equals(true);

    assert.calledOnceWithExactly(system.shutdown);
  });

  it('should fail during backup restoration', async () => {
    await gateway.restoreBackupEvent(null);

    expect(gateway.restoreErrored).equals(true);
    expect(gateway.restoreInProgress).equals(false);

    assert.notCalled(system.shutdown);
  });
});
