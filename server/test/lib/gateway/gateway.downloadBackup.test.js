const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();
const path = require('path');
const os = require('os');
const fse = require('fs-extra');

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
        duckDbBackupFolderPath: path.join(
          getConfig().backupsFolder,
          'restore/gladys-db-backup_2024-6-29-13-47-50_parquet_folder',
        ),
        sqliteBackupFilePath: path.join(getConfig().backupsFolder, 'restore/gladys-db-backup-2024-6-29-13-47-50.db'),
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
        sqliteBackupFilePath: path.join(getConfig().backupsFolder, 'restore/encoded-old-gladys-db-backup.db.gz.db'),
      },
    });
  });

  it('should reject backup containing symlinks (path traversal protection)', async () => {
    const maliciousBackupFilePath = path.join(__dirname, 'malicious-backup-with-symlink.tar.gz.enc');
    try {
      await gateway.downloadBackup(maliciousBackupFilePath);
      assert.fail('Should have thrown BACKUP_CONTAINS_UNSAFE_PATHS');
    } catch (e) {
      expect(e.message).to.equal('BACKUP_CONTAINS_UNSAFE_PATHS');
    }
    assert.notCalled(event.emit);
  });

  it('should reject backup with nested path traversal (folder/../../etc/passwd)', async () => {
    const maliciousBackupFilePath = path.join(__dirname, 'malicious-backup-nested-traversal.tar.gz.enc');
    try {
      await gateway.downloadBackup(maliciousBackupFilePath);
      assert.fail('Should have thrown BACKUP_CONTAINS_UNSAFE_PATHS');
    } catch (e) {
      expect(e.message).to.equal('BACKUP_CONTAINS_UNSAFE_PATHS');
    }
    assert.notCalled(event.emit);
  });

  // The name of the downloaded file is chosen by whoever calls the restore route,
  // and it used to be interpolated into a shell command (`gzip -dc <name> > <name>`).
  // A name carrying a command substitution was therefore executed by /bin/sh.
  it('should reject a backup whose file name carries a shell command, without running it', async () => {
    const workingFolder = await fse.mkdtemp(path.join(os.tmpdir(), 'gladys-backup-name-'));
    const markerPath = path.join(workingFolder, 'rce-marker');
    try {
      // a real backup, renamed the way an attacker would name theirs
      const maliciousName = `evil$(touch ${markerPath}).enc`;
      const maliciousBackupFilePath = path.join(workingFolder, maliciousName);
      await fse.copy(path.join(__dirname, 'encoded-old-gladys-db-backup.db.gz.enc'), maliciousBackupFilePath);

      try {
        await gateway.downloadBackup(maliciousBackupFilePath);
        assert.fail('Should have thrown BACKUP_UNSAFE_FILE_NAME');
      } catch (e) {
        expect(e.message).to.equal('BACKUP_UNSAFE_FILE_NAME');
      }

      // the command inside the file name must never have been executed
      expect(await fse.pathExists(markerPath)).to.equal(false);
      assert.notCalled(event.emit);
    } finally {
      await fse.remove(workingFolder);
    }
  });

  // Same escape, one layer deeper: the archive is valid and passes the traversal
  // and symlink checks, but the name of the file it contains ends up in the
  // sqlite3 and DuckDB commands of the restore.
  it('should reject a backup whose archive entry carries a shell command', async () => {
    const maliciousBackupFilePath = path.join(__dirname, 'malicious-backup-shell-metacharacters.tar.gz.enc');
    try {
      await gateway.downloadBackup(maliciousBackupFilePath);
      assert.fail('Should have thrown BACKUP_CONTAINS_UNSAFE_PATHS');
    } catch (e) {
      expect(e.message).to.equal('BACKUP_CONTAINS_UNSAFE_PATHS');
    }
    assert.notCalled(event.emit);
  });
});
