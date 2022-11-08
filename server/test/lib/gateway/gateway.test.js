const { expect } = require('chai');
const assertChai = require('chai').assert;
const Promise = require('bluebird');
const path = require('path');
const { fake, assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');
const db = require('../../../models');
const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const event = new EventEmitter();

const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

const getConfig = require('../../../utils/getConfig');
const { EVENTS, SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');

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
  shutdown: fake.resolves(true),
};

const config = getConfig();

const job = {
  wrapper: (type, func) => {
    return async () => {
      return func();
    };
  },
  updateProgress: fake.resolves({}),
};

describe('gateway', () => {
  describe('gateway.login', () => {
    const variable = {
      getValue: fake.resolves(null),
      setValue: fake.resolves(null),
    };
    const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
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
  describe('gateway.init', () => {
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
    const variable = {
      getValue: (name) => {
        if (name === SYSTEM_VARIABLE_NAMES.TIMEZONE) {
          return 'Europe/Paris';
        }
        return JSON.stringify(userKeys);
      },
      setValue: fake.resolves(null),
    };
    const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
    it('should login two factor to gladys gateway', async () => {
      gateway.getLatestGladysVersionInitTimeout = 0;
      await gateway.init();
      await Promise.delay(100);
      expect(gateway.connected).to.equal(true);
      expect(gateway.usersKeys).to.deep.equal(userKeys);
      expect(gateway.backupSchedule).to.not.equal(undefined);
    });
  });

  describe('gateway.backup', async function Describe() {
    this.timeout(20000);
    it('should backup gladys', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      await gateway.backup();
      assert.calledOnce(gateway.gladysGatewayClient.initializeMultiPartBackup);
      assert.calledOnce(gateway.gladysGatewayClient.uploadOneBackupChunk);
      assert.calledOnce(gateway.gladysGatewayClient.finalizeMultiPartBackup);
    });
    it('should start and abort backup', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      gateway.gladysGatewayClient.uploadOneBackupChunk = fake.rejects('error');
      const promise = gateway.backup();
      await assertChai.isRejected(promise);
      assert.calledOnce(gateway.gladysGatewayClient.initializeMultiPartBackup);
      assert.calledOnce(gateway.gladysGatewayClient.abortMultiPartBackup);
    });
    it('should backup gladys with lots of insert at the same time', async function Test() {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
      const promisesDevices = [];
      const promises = [];
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      // create 100 state
      for (let i = 0; i < 100; i += 1) {
        promisesDevices.push(
          db.DeviceFeatureState.create({
            device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
            value: 1,
          }),
        );
      }
      // start backup
      promises.push(gateway.backup());
      // create 100 states
      for (let i = 0; i < 100; i += 1) {
        promisesDevices.push(
          db.DeviceFeatureState.create({
            device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
            value: 1,
          }),
        );
      }
      await Promise.all(promisesDevices);
      await Promise.all(promises);
      assert.calledOnce(gateway.gladysGatewayClient.initializeMultiPartBackup);
      assert.calledOnce(gateway.gladysGatewayClient.uploadOneBackupChunk);
      assert.calledOnce(gateway.gladysGatewayClient.finalizeMultiPartBackup);
    });
    it('should not backup, no backup key found', async () => {
      const variable = {
        getValue: fake.resolves(null),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      const promise = gateway.backup();
      return assertChai.isRejected(promise, 'GLADYS_GATEWAY_BACKUP_KEY_NOT_FOUND');
    });
    it('should get backups', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
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

  describe('gateway.checkIfBackupNeeded', async function Describe() {
    this.timeout(20000);
    it('should check if backup is needed and execute backup', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const eventFake = {
        emit: fake.returns(null),
        on: fake.returns(null),
      };
      const gateway = new Gateway(variable, eventFake, system, sequelize, config, {}, {}, {}, job);
      gateway.backupRandomInterval = 10;
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      gateway.connected = true;
      await gateway.checkIfBackupNeeded();
      assert.calledOnce(gateway.gladysGatewayClient.getBackups);
      // wait 50ms and see if backup was called
      await new Promise((resolve) => {
        setTimeout(() => {
          assert.calledOnce(eventFake.emit);
          resolve();
        }, 50);
      });
    });
  });

  describe('gateway.downloadBackup', () => {
    it('should restore a backup', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      const { encryptedBackupFilePath } = await gateway.backup();
      const { backupFilePath } = await gateway.downloadBackup(encryptedBackupFilePath);
      gateway.config.storage = '/tmp/gladys-database-restore-test.db';
      await gateway.restoreBackup(backupFilePath);
    });
    it('should restore a backup with error', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      await gateway.restoreBackupEvent('this-path-does-not-exist');
    });
    it('should not restore a backup, sqlite file is not a Gladys DB', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      const emptyFile = path.join(__dirname, 'this_file_is_not_a_valid_db.dbfile');
      const promise = gateway.restoreBackup(emptyFile);
      await assertChai.isRejected(promise, 'SQLITE_ERROR: no such table: t_user');
    });
    it('should not restore a backup, sqlite file is not a Gladys DB', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      const emptyFile = path.join(__dirname, 'this_file_has_no_user_table.dbfile');
      const promise = gateway.restoreBackup(emptyFile);
      await assertChai.isRejected(promise, 'SQLITE_ERROR: no such table: t_user');
    });
    it('should not restore a backup, SQlite DB has no user', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      const emptyFile = path.join(__dirname, 'this_db_has_no_users.dbfile');
      const promise = gateway.restoreBackup(emptyFile);
      await assertChai.isRejected(promise, 'NO_USER_FOUND_IN_NEW_DB');
    });
  });

  describe('gateway.getLatestGladysVersion', () => {
    it('should return gladys version', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const service = {
        getUsage: fake.resolves({ zigbee: true }),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, service, job);
      const version = await gateway.getLatestGladysVersion();
      expect(version).to.have.property('name');
      expect(version).to.have.property('created_at');
    });
  });

  describe('gateway.getUsersKeys', () => {
    it('should get users keys with no users in current list', async () => {
      const variable = {
        getValue: fake.resolves('[]'),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
      const users = await gateway.getUsersKeys();
      expect(users).to.deep.equal([
        {
          id: '55b440f0-99fc-4ef8-bfe6-cd13adb4071e',
          name: 'Tony',
          rsa_public_key: 'fingerprint',
          ecdsa_public_key: 'fingerprint',
          gladys_4_user_id: 'df033006-ee42-4b94-a324-3f558171c493',
          connected: false,
          accepted: false,
        },
      ]);
    });
    it('should merge new user keys with old user', async () => {
      const oldUsers = [
        {
          id: '55b440f0-99fc-4ef8-bfe6-cd13adb4071e',
          name: 'Tony',
          rsa_public_key: 'fingerprint',
          ecdsa_public_key: 'not-the-fingerprint',
          gladys_4_user_id: 'df033006-ee42-4b94-a324-3f558171c493',
          connected: false,
          accepted: true,
        },
      ];
      const variable = {
        getValue: fake.resolves(JSON.stringify(oldUsers)),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
      const users = await gateway.getUsersKeys();
      expect(users).to.deep.equal([
        {
          id: '55b440f0-99fc-4ef8-bfe6-cd13adb4071e',
          name: 'Tony',
          rsa_public_key: 'fingerprint',
          ecdsa_public_key: 'fingerprint',
          gladys_4_user_id: 'df033006-ee42-4b94-a324-3f558171c493',
          connected: false,
          accepted: false,
        },
      ]);
    });
    it('should merge new user keys with old user', async () => {
      const oldUsers = [
        {
          id: '55b440f0-99fc-4ef8-bfe6-cd13adb4071e',
          name: 'Tony',
          rsa_public_key: 'not-the-fingerprint',
          ecdsa_public_key: 'not-the-fingerprint',
          gladys_4_user_id: 'df033006-ee42-4b94-a324-3f558171c493',
          connected: false,
          accepted: true,
        },
      ];
      const variable = {
        getValue: fake.resolves(JSON.stringify(oldUsers)),
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
      const users = await gateway.getUsersKeys();
      expect(users).to.deep.equal([
        {
          id: '55b440f0-99fc-4ef8-bfe6-cd13adb4071e',
          name: 'Tony',
          rsa_public_key: 'fingerprint',
          ecdsa_public_key: 'fingerprint',
          gladys_4_user_id: 'df033006-ee42-4b94-a324-3f558171c493',
          connected: false,
          accepted: false,
        },
      ]);
    });
  });

  describe('gateway.disconnect', () => {
    it('should disconnect Gateway', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
        destroy: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      await gateway.disconnect();
    });
  });
  describe('gateway.forwardWebsockets', () => {
    it('should forward a websocket message when connected', () => {
      const gateway = new Gateway({}, event, system, sequelize, config, {}, {}, {}, job);
      gateway.connected = true;

      const websocketMessage = {
        type: 'zwave.new-node',
        payload: {},
      };
      gateway.forwardWebsockets(websocketMessage);
      assert.calledWith(gateway.gladysGatewayClient.newEventInstance, websocketMessage.type, websocketMessage.payload);
    });
    it('should prevent forwarding a websocket message when not connected', () => {
      const gateway = new Gateway({}, event, system, sequelize, config, {}, {}, {}, job);

      const websocketMessage = {
        type: 'zwave.new-node',
        payload: {},
      };
      gateway.forwardWebsockets(websocketMessage);
      assert.notCalled(gateway.gladysGatewayClient.newEventInstance);
    });
  });

  describe('gateway.handleNewMessage', () => {
    it('should handle a new gateway message and reject it', async () => {
      const variable = {
        setValue: fake.resolves(null),
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');

      return new Promise((resolve, reject) => {
        gateway.handleNewMessage(
          {
            type: 'gladys-api-call',
          },
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
        setValue: fake.resolves(null),
      };
      const eventGateway = new EventEmitter();
      const stateManager = {
        get: fake.returns({
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        }),
      };
      const gateway = new Gateway(variable, eventGateway, system, sequelize, config, {}, stateManager, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');

      gateway.usersKeys = [
        {
          rsa_public_key: 'fingerprint',
          ecdsa_public_key: 'fingerprint',
          accepted: false,
        },
      ];

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
        setValue: fake.resolves(null),
      };
      const stateManager = {
        get: fake.returns(null),
      };
      const eventGateway = new EventEmitter();
      const gateway = new Gateway(variable, eventGateway, system, sequelize, config, {}, stateManager, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      gateway.usersKeys = [
        {
          rsa_public_key: 'fingerprint',
          ecdsa_public_key: 'fingerprint',
          accepted: true,
        },
      ];

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
        setValue: fake.resolves(null),
      };
      const stateManager = {
        get: fake.returns({
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        }),
      };
      const eventGateway = new EventEmitter();
      const gateway = new Gateway(variable, eventGateway, system, sequelize, config, {}, stateManager, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      gateway.usersKeys = [
        {
          rsa_public_key: 'fingerprint',
          ecdsa_public_key: 'fingerprint',
          accepted: true,
        },
      ];
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
    it('should handle a new gateway open api message: create-device-state', async () => {
      const variable = {
        setValue: fake.resolves(null),
      };
      const stateManager = {
        get: fake.returns({
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        }),
      };
      const eventGateway = {
        emit: fake.returns(),
        on: fake.returns(),
      };
      const gateway = new Gateway(variable, eventGateway, system, sequelize, config, {}, stateManager, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      gateway.usersKeys = [
        {
          rsa_public_key: 'fingerprint',
          ecdsa_public_key: 'fingerprint',
          accepted: true,
        },
      ];

      return new Promise((resolve, reject) => {
        gateway.handleNewMessage(
          {
            type: 'gladys-open-api',
            action: 'create-device-state',
            data: {
              device_feature_external_id: 'external-id',
              state: 1,
            },
          },
          {
            rsaPublicKeyRaw: 'key',
            ecdsaPublicKeyRaw: 'key',
            local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          },
          (res) => {
            try {
              expect(res).to.deep.equal({
                status: 200,
              });
              assert.calledWith(eventGateway.emit, EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: 'external-id',
                state: 1,
              });
              resolve();
            } catch (e) {
              reject(e);
            }
          },
        );
      });
    });
    it('should handle a new gateway open api message: create-owntracks-location', async () => {
      const variable = {
        setValue: fake.resolves(null),
      };
      const stateManager = {
        get: fake.returns({
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        }),
      };
      const eventGateway = {
        emit: fake.returns(),
        on: fake.returns(),
      };
      const gateway = new Gateway(variable, eventGateway, system, sequelize, config, {}, stateManager, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      gateway.usersKeys = [
        {
          rsa_public_key: 'fingerprint',
          ecdsa_public_key: 'fingerprint',
          accepted: true,
        },
      ];

      return new Promise((resolve, reject) => {
        gateway.handleNewMessage(
          {
            type: 'gladys-open-api',
            action: 'create-owntracks-location',
            data: {
              lat: 42,
              lon: 42,
              alt: 0,
              acc: 100,
            },
          },
          {
            rsaPublicKeyRaw: 'key',
            ecdsaPublicKeyRaw: 'key',
            local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          },
          (res) => {
            try {
              expect(res).to.deep.equal({
                status: 200,
              });
              assert.calledWith(eventGateway.emit, EVENTS.GATEWAY.NEW_MESSAGE_OWNTRACKS_LOCATION, {
                lat: 42,
                lon: 42,
                alt: 0,
                acc: 100,
              });
              resolve();
            } catch (e) {
              reject(e);
            }
          },
        );
      });
    });
    it('should handle a new gateway open api message: google-home-request', async function Test() {
      this.timeout(10000);
      const variable = {
        setValue: fake.resolves(null),
        destroy: fake.resolves(null),
      };
      const stateManager = {
        get: fake.returns({
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        }),
      };
      const serviceManager = {
        getService: fake.returns({
          googleActionsHandler: {
            onSync: fake.resolves({ status: 200, onSync: true }),
            onQuery: fake.resolves({ status: 200, onQuery: true }),
            onExecute: fake.resolves({ status: 200, onExecute: true }),
          },
        }),
      };
      const eventGateway = {
        emit: fake.returns(),
        on: fake.returns(),
      };
      const gateway = new Gateway(
        variable,
        eventGateway,
        system,
        sequelize,
        config,
        {},
        stateManager,
        serviceManager,
        job,
      );
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      gateway.usersKeys = [
        {
          rsa_public_key: 'fingerprint',
          ecdsa_public_key: 'fingerprint',
          accepted: true,
        },
      ];

      const promiseSync = new Promise((resolve, reject) => {
        gateway.handleNewMessage(
          {
            type: 'gladys-open-api',
            action: 'google-home-request',
            data: {
              inputs: [{ intent: 'action.devices.SYNC' }],
            },
          },
          {
            rsaPublicKeyRaw: 'key',
            ecdsaPublicKeyRaw: 'key',
            local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          },
          resolve,
        );
      });
      const promiseExecute = new Promise((resolve) => {
        gateway.handleNewMessage(
          {
            type: 'gladys-open-api',
            action: 'google-home-request',
            data: {
              inputs: [{ intent: 'action.devices.EXECUTE' }],
            },
          },
          {
            rsaPublicKeyRaw: 'key',
            ecdsaPublicKeyRaw: 'key',
            local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          },
          resolve,
        );
      });
      const promiseDisconnect = new Promise((resolve, reject) => {
        gateway.handleNewMessage(
          {
            type: 'gladys-open-api',
            action: 'google-home-request',
            data: {
              inputs: [{ intent: 'action.devices.DISCONNECT' }],
            },
          },
          {
            rsaPublicKeyRaw: 'key',
            ecdsaPublicKeyRaw: 'key',
            local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          },
          resolve,
        );
      });
      const promiseQuery = new Promise((resolve, reject) => {
        gateway.handleNewMessage(
          {
            type: 'gladys-open-api',
            action: 'google-home-request',
            data: {
              inputs: [{ intent: 'action.devices.QUERY' }],
            },
          },
          {
            rsaPublicKeyRaw: 'key',
            ecdsaPublicKeyRaw: 'key',
            local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          },
          resolve,
        );
      });
      const promiseUnknown = new Promise((resolve, reject) => {
        gateway.handleNewMessage(
          {
            type: 'gladys-open-api',
            action: 'google-home-request',
            data: {
              inputs: [{ intent: 'action.devices.UNKNOWN' }],
            },
          },
          {
            rsaPublicKeyRaw: 'key',
            ecdsaPublicKeyRaw: 'key',
            local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          },
          resolve,
        );
      });
      const [resultSync, resultQuery, resultExecute, resultUnkown, resultDisconnect] = await Promise.all([
        promiseSync,
        promiseQuery,
        promiseExecute,
        promiseUnknown,
        promiseDisconnect,
      ]);
      expect(resultSync).to.deep.equal({ status: 200, onSync: true });
      expect(resultQuery).to.deep.equal({ status: 200, onQuery: true });
      expect(resultExecute).to.deep.equal({ status: 200, onExecute: true });
      expect(resultUnkown).to.deep.equal({ status: 400 });
      expect(resultDisconnect).to.deep.equal({});
    });
    it('should handle a new gateway open api message: alexa-request', async function Test() {
      this.timeout(10000);
      const variable = {
        setValue: fake.resolves(null),
        destroy: fake.resolves(null),
      };
      const stateManager = {
        get: fake.returns({
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        }),
      };
      const serviceManager = {
        getService: fake.returns({
          alexaHandler: {
            onDiscovery: fake.resolves({ onDiscovery: true }),
            onReportState: fake.resolves({ onReportState: true }),
            onExecute: fake.resolves({ onExecute: true }),
          },
        }),
      };
      const eventGateway = {
        emit: fake.returns(null),
        on: fake.returns(null),
      };
      const gateway = new Gateway(
        variable,
        eventGateway,
        system,
        sequelize,
        config,
        {},
        stateManager,
        serviceManager,
        job,
      );
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      gateway.usersKeys = [
        {
          rsa_public_key: 'fingerprint',
          ecdsa_public_key: 'fingerprint',
          accepted: true,
        },
      ];

      const promiseDiscovery = new Promise((resolve, reject) => {
        gateway.handleNewMessage(
          {
            type: 'gladys-open-api',
            action: 'alexa-request',
            data: {
              directive: {
                header: {
                  namespace: 'Alexa.Discovery',
                  name: 'Discover',
                  messageId: 'd89e30ed-bbcb-4ec5-9684-8e5c14e3bffd',
                  payloadVersion: '3',
                },
                payload: {},
              },
            },
          },
          {
            rsaPublicKeyRaw: 'key',
            ecdsaPublicKeyRaw: 'key',
            local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          },
          resolve,
        );
      });
      const resultDiscovery = await promiseDiscovery;
      expect(resultDiscovery).to.deep.equal({ onDiscovery: true });
    });
  });
  describe('gateway.forwardDeviceStateToGoogleHome', () => {
    it('should forward an event to google home', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const stateManager = {
        get: (type) => {
          const feature = {
            id: 'f2e2d5ea-bcea-4092-b597-7b8fb723e070',
            device_id: '31ad9f11-4ec7-495e-8238-2e576092ac0c',
            name: 'Lampe luminosité',
            selector: 'mqtt-brightness',
            external_id: 'mqtt:brightness',
            category: 'light',
            type: 'brightness',
            read_only: false,
            keep_history: true,
            has_feedback: false,
            unit: null,
            min: 0,
            max: 100,
            last_value: 97,
            last_value_string: null,
          };
          if (type === 'deviceById') {
            return {
              id: '31ad9f11-4ec7-495e-8238-2e576092ac0c',
              service_id: '54a4c447-0caa-4ed5-aa6f-5019e4b27754',
              room_id: '89abf7bc-208c-411a-a69b-33a173753e81',
              name: 'Lampe modified',
              selector: 'mqtt-lampe',
              model: null,
              external_id: 'mqtt:lampe',
              should_poll: false,
              poll_frequency: null,
              features: [feature],
              params: [],
            };
          }
          return feature;
        },
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, stateManager, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      gateway.googleHomeForwardStateTimeout = 1;
      gateway.connected = true;
      gateway.googleHomeConnected = true;
      const oneEvent = {
        type: EVENTS.DEVICE.NEW_STATE,
        device_feature: 'my-car',
      };
      await gateway.forwardDeviceStateToGoogleHome(oneEvent);
      return new Promise((resolve) => {
        setTimeout(() => {
          assert.calledWith(gateway.gladysGatewayClient.googleHomeReportState, {
            devices: { states: { 'mqtt-lampe': { brightness: 97, online: true } } },
          });
          resolve();
        }, 10);
      });
    });
    it('should not forward event to google home, event empty', async () => {
      const variable = {
        getValue: fake.resolves('key'),
        setValue: fake.resolves(null),
      };
      const stateManager = {
        get: (type) => {
          const feature = {
            id: 'f2e2d5ea-bcea-4092-b597-7b8fb723e070',
            device_id: '31ad9f11-4ec7-495e-8238-2e576092ac0c',
            name: 'Camera',
            selector: 'mqtt-brightness',
            external_id: 'mqtt:brightness',
            category: 'camera',
            type: 'camera',
            read_only: false,
            keep_history: true,
            has_feedback: false,
            unit: null,
            min: 0,
            max: 100,
            last_value: 97,
            last_value_string: null,
          };
          if (type === 'deviceById') {
            return {
              id: '31ad9f11-4ec7-495e-8238-2e576092ac0c',
              service_id: '54a4c447-0caa-4ed5-aa6f-5019e4b27754',
              room_id: '89abf7bc-208c-411a-a69b-33a173753e81',
              name: 'Camera',
              selector: 'camera',
              model: null,
              external_id: 'camera',
              should_poll: false,
              poll_frequency: null,
              features: [feature],
              params: [],
            };
          }
          return feature;
        },
      };
      const gateway = new Gateway(variable, event, system, sequelize, config, {}, stateManager, {}, job);
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      gateway.googleHomeForwardStateTimeout = 1;
      gateway.connected = true;
      gateway.googleHomeConnected = true;
      const oneEvent = {
        type: EVENTS.DEVICE.NEW_STATE,
        device_feature: 'my-car',
      };
      await gateway.forwardDeviceStateToGoogleHome(oneEvent);
      return new Promise((resolve) => {
        setTimeout(() => {
          assert.notCalled(gateway.gladysGatewayClient.googleHomeReportState);
          resolve();
        }, 10);
      });
    });
  });
});
