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
const { EVENTS } = require('../../../utils/constants');
const { NotFoundError } = require('../../../utils/coreErrors');

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

  describe('gateway.disconnect', () => {
    it('should disconnect Gateway', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
        destroy: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      await gateway.disconnect();
    });
  });
  describe('gateway.forwardWebsockets', () => {
    it('should forward a websocket message', async () => {
      const gateway = new Gateway({}, event, system, sequelize, config);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      const websocketMessage = {
        type: 'zwave.new-node',
        payload: {},
      };
      gateway.forwardWebsockets(websocketMessage);
      assert.calledWith(gateway.gladysGatewayClient.newEventInstance, websocketMessage.type, websocketMessage.payload);
    });
  });

  describe('gateway.handleNewMessage', () => {
    it('should handle a new gateway message and reject it', async () => {
      const variable = {
        getValue: fake.resolves('[]'),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');

      return new Promise((resolve, reject) => {
        gateway.handleNewMessage(
          {},
          {
            rsaPublicKeyRaw: 'key',
            ecdsaPublicKeyRaw: 'key',
          },
          (res) => {
            expect(res).to.have.property('error', 'USER_NOT_ACCEPTED_LOCALLY');
            resolve();
          },
        );
      });
    });
    it('should handle a new gateway message and reject it, user not accepted', async () => {
      const variable = {
        getValue: fake.resolves(
          JSON.stringify([
            {
              rsa_public_key: 'fingerprint',
              ecdsa_public_key: 'fingerprint',
              accepted: false,
            },
          ]),
        ),
        setValue: fake.resolves(null),
      };
      const user = {
        getById: fake.resolves({
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        }),
      };
      const eventGateway = new EventEmitter();
      const gateway = new Gateway(variable, eventGateway, system, sequelize, config, user);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');

      return new Promise((resolve, reject) => {
        gateway.handleNewMessage(
          {
            type: 'gladys-api-call',
            options: {
              method: 'get',
              url: '/api/v1/house',
            },
          },
          {
            rsaPublicKeyRaw: 'key',
            ecdsaPublicKeyRaw: 'key',
            local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          },
          (res) => {
            expect(res).to.have.property('error', 'USER_NOT_ACCEPTED_LOCALLY');
            resolve();
          },
        );
      });
    });
    it('should handle a new gateway message and reject it, user not found', async () => {
      const variable = {
        getValue: fake.resolves(
          JSON.stringify([
            {
              rsa_public_key: 'fingerprint',
              ecdsa_public_key: 'fingerprint',
              accepted: true,
            },
          ]),
        ),
        setValue: fake.resolves(null),
      };
      const user = {
        getById: fake.rejects(new NotFoundError('User "0cd30aef-9c4e-4a23-88e3-3547971296e5" not found')),
      };
      const eventGateway = new EventEmitter();
      const gateway = new Gateway(variable, eventGateway, system, sequelize, config, user);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');

      return new Promise((resolve, reject) => {
        gateway.handleNewMessage(
          {
            type: 'gladys-api-call',
            options: {
              method: 'get',
              url: '/api/v1/house',
            },
          },
          {
            rsaPublicKeyRaw: 'key',
            ecdsaPublicKeyRaw: 'key',
            local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          },
          (res) => {
            try {
              expect(res).to.have.property('error', 'LINKED_USER_NOT_FOUND');
              resolve();
            } catch (e) {
              reject(e);
            }
          },
        );
      });
    });
    it('should handle a new gateway message and handle it', async () => {
      const variable = {
        getValue: fake.resolves(
          JSON.stringify([
            {
              rsa_public_key: 'fingerprint',
              ecdsa_public_key: 'fingerprint',
              accepted: true,
            },
          ]),
        ),
        setValue: fake.resolves(null),
      };
      const user = {
        getById: fake.resolves({
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        }),
      };
      const eventGateway = new EventEmitter();
      const gateway = new Gateway(variable, eventGateway, system, sequelize, config, user);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');

      eventGateway.on(EVENTS.GATEWAY.NEW_MESSAGE_API_CALL, (one, two, three, four, five, cb) => {
        cb([
          {
            name: 'My house',
          },
        ]);
      });

      return new Promise((resolve, reject) => {
        gateway.handleNewMessage(
          {
            type: 'gladys-api-call',
            options: {
              method: 'get',
              url: '/api/v1/house',
            },
          },
          {
            rsaPublicKeyRaw: 'key',
            ecdsaPublicKeyRaw: 'key',
            local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          },
          (res) => {
            expect(res).to.deep.equal([
              {
                name: 'My house',
              },
            ]);
            resolve();
          },
        );
      });
    });
  });
});
