const { expect } = require('chai');
const assertChai = require('chai').assert;
const { fake, assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');
const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const event = new EventEmitter();

const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

const getConfig = require('../../../utils/getConfig');

const sequelize = {
  close: fake.resolves(null),
};

const system = {
  getInfos: fake.resolves({
    nodejs_version: 'v10.15.2',
    gladys_version: 'v4.0.0',
    is_docker: false,
  }),
  isDocker: fake.resolves(true),
  saveLatestGladysVersion: fake.returns(null),
};

const config = getConfig();

describe('gateway', () => {
  describe('gateway.login', () => {
    const variable = {
      getValue: fake.resolves(null),
      setValue: fake.resolves(null),
    };
    const gateway = new Gateway(variable, event, system, sequelize, config);
    it('should login to gladys gateway', async () => {
      const loginResults = await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      expect(loginResults).to.have.property('two_factor_token');
      assert.calledWith(gateway.gladysGatewayClient.login, 'tony.stark@gladysassistant.com', 'warmachine123');
    });
    it('should login two factor to gladys gateway', async () => {
      await gateway.loginTwoFactor('token', '123456');
      assert.calledWith(gateway.gladysGatewayClient.loginInstance, 'token', '123456');
      assert.called(variable.getValue);
      assert.called(variable.setValue);
      assert.calledOnce(gateway.gladysGatewayClient.createInstance);
    });
  });

  describe('gateway.backup', () => {
    it('should backup gladys', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      await gateway.backup();
      assert.calledOnce(gateway.gladysGatewayClient.uploadBackup);
    });
    it('should not backup, no backup key found', async () => {
      const variable = {
        getValue: fake.resolves(null),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      const promise = gateway.backup();
      return assertChai.isRejected(promise, 'GLADYS_GATEWAY_BACKUP_KEY_NOT_FOUND');
    });
    it('should get backups', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      const backups = await gateway.getBackups();
      expect(backups).to.deep.equal([
        {
          id: '74dc8d58-3997-484a-a791-53e5b07279d7',
          account_id: 'b2d23f66-487d-493f-8acb-9c8adb400def',
          path: 'http://backup-url',
          size: 1000,
          created_at: '2018-10-16T02:21:25.901Z',
          updated_at: '2018-10-16T02:21:25.901Z',
          is_deleted: false,
        },
      ]);
    });
  });

  describe('gateway.downloadBackup', () => {
    it('should restore a backup', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      const { encryptedBackupFilePath } = await gateway.backup();
      const { backupFilePath } = await gateway.downloadBackup(encryptedBackupFilePath);
      gateway.config.storage = '/tmp/gladys-database-restore-test.db';
      await gateway.restoreBackup(backupFilePath);
    });
  });

  describe('gateway.getLatestGladysVersion', () => {
    it('should return gladys version', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config);
      const version = await gateway.getLatestGladysVersion();
      expect(version).to.have.property('name');
      expect(version).to.have.property('created_at');
    });
  });
});
