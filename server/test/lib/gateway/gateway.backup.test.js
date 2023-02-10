const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const db = require('../../../models');
const getConfig = require('../../../utils/getConfig');
const { NotFoundError } = require('../../../utils/coreErrors');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.backup', async function describe() {
  this.timeout(20000);

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

    variable.getValue = fake.resolves('variable');
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

    gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job, scheduler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should backup gladys', async () => {
    await gateway.backup();

    assert.calledOnce(gateway.gladysGatewayClient.initializeMultiPartBackup);
    assert.calledOnce(gateway.gladysGatewayClient.uploadOneBackupChunk);
    assert.calledOnce(gateway.gladysGatewayClient.finalizeMultiPartBackup);
  });

  it('should start and abort backup', async () => {
    gateway.gladysGatewayClient.uploadOneBackupChunk = fake.rejects(new Error('error'));

    try {
      await gateway.backup();
      assert.fail();
    } catch (e) {
      expect(e)
        .instanceOf(Error)
        .haveOwnProperty('message', 'error');
    }

    assert.calledOnce(gateway.gladysGatewayClient.initializeMultiPartBackup);
    assert.calledOnce(gateway.gladysGatewayClient.abortMultiPartBackup);
  });

  it('should backup gladys with lots of insert at the same time', async () => {
    const promisesDevices = [];
    const promises = [];
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
    variable.getValue = fake.resolves(null);

    try {
      await gateway.backup();
      assert.fail();
    } catch (e) {
      expect(e)
        .instanceOf(NotFoundError)
        .haveOwnProperty('message', 'GLADYS_GATEWAY_BACKUP_KEY_NOT_FOUND');
    }
  });
});
