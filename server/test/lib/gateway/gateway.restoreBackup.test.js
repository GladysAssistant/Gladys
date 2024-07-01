const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const path = require('path');

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const getConfig = require('../../../utils/getConfig');
const { NotFoundError } = require('../../../utils/coreErrors');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.restoreBackup', () => {
  const variable = {};
  const event = {};
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

    sequelize.close = fake.resolves(null);

    gateway = new Gateway(variable, event, {}, sequelize, config, {}, {}, {}, job, scheduler);
    gateway.config.storage = '/tmp/gladys-database-restore-test.db';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should restore a new style backup (sqlite + duckDB)', async () => {
    const backupFilePath = path.join(__dirname, 'real-gladys-db-backup.db.gz.dbfile');
    const parquetFolderPath = path.join(__dirname, 'gladys_backup_parquet_folder');
    await gateway.restoreBackup(backupFilePath, parquetFolderPath);
    assert.calledOnceWithExactly(sequelize.close);
  });

  it('should restore a old style backup (just sqlite)', async () => {
    const backupFilePath = path.join(__dirname, 'real-gladys-db-backup.db.gz.dbfile');
    await gateway.restoreBackup(backupFilePath);
    assert.calledOnceWithExactly(sequelize.close);
  });

  it('should restore a backup with error', async () => {
    const backupFilePath = 'this-path-does-not-exist';
    try {
      await gateway.restoreBackup(backupFilePath);
      assert.fail();
    } catch (e) {
      expect(e)
        .instanceOf(NotFoundError)
        .haveOwnProperty('message', 'BACKUP_NOT_FOUND');
    }
  });

  it('should not restore a backup, sqlite file is not a Gladys DB', async () => {
    const backupFilePath = path.join(__dirname, 'this_file_is_not_a_valid_db.dbfile');
    try {
      await gateway.restoreBackup(backupFilePath);
      assert.fail();
    } catch (e) {
      expect(e).haveOwnProperty('message', 'SQLITE_ERROR: no such table: t_user');
    }
  });

  it('should not restore a backup, SQlite DB has no user', async () => {
    const backupFilePath = path.join(__dirname, 'this_db_has_no_users.dbfile');
    try {
      await gateway.restoreBackup(backupFilePath);
      assert.fail();
    } catch (e) {
      expect(e)
        .instanceOf(NotFoundError)
        .haveOwnProperty('message', 'NO_USER_FOUND_IN_NEW_DB');
    }
  });
});
