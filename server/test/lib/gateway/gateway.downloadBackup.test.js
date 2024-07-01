const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const path = require('path');

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const getConfig = require('../../../utils/getConfig');

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { NotFoundError } = require('../../../utils/coreErrors');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.downloadBackup', () => {
  const variable = {};
  const event = {};

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

    gateway = new Gateway(variable, event, {}, {}, config, {}, {}, {}, job, scheduler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should not download backup, encruption key is missing', async () => {
    // Force no encryption key
    variable.getValue = fake.resolves(null);

    try {
      await gateway.downloadBackup('this-path-does-not-exist');
      assert.fail();
    } catch (e) {
      expect(e)
        .instanceOf(NotFoundError)
        .haveOwnProperty('message', 'GLADYS_GATEWAY_BACKUP_KEY_NOT_FOUND');
    }

    assert.notCalled(event.emit);
  });

  it('should download a backup (new style, sqlite + parquet)', async () => {
    const encryptedBackupFilePath = path.join(__dirname, 'encoded-gladys-db-and-duckdb-backup.tar.gz.enc');
    await gateway.downloadBackup(encryptedBackupFilePath);
    assert.calledOnceWithExactly(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BACKUP.DOWNLOADED,
      payload: {
        duckDbBackupFolderPath: 'gladys-backups/restore/gladys-db-backup_2024-6-29-13-47-50_parquet_folder',
        sqliteBackupFilePath: 'gladys-backups/restore/gladys-db-backup-2024-6-29-13-47-50.db',
      },
    });
  });

  it('should download a backup (old style, sqlite)', async () => {
    const encryptedBackupFilePath = path.join(__dirname, 'encoded-old-gladys-db-backup.db.gz.enc');
    await gateway.downloadBackup(encryptedBackupFilePath);
    assert.calledOnceWithExactly(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BACKUP.DOWNLOADED,
      payload: {
        duckDbBackupFolderPath: null,
        sqliteBackupFilePath: 'gladys-backups/restore/encoded-old-gladys-db-backup.db.gz.db',
      },
    });
  });
});
