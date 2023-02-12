const { expect } = require('chai');
const sinon = require('sinon');
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

    gateway = new Gateway(variable, event, system, sequelize, config, {}, {}, {}, job, scheduler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should download and restore backup, then shutdown', async () => {
    const encryptedBackupFilePath = path.join(__dirname, 'encoded-gladys-db-backup.db.gz.enc');
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
