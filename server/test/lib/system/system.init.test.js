const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const DockerodeMock = require('./DockerodeMock.test');
const logger = require('../../../utils/logger');

const System = proxyquire('../../../lib/system', {
  dockerode: DockerodeMock,
});

const Job = require('../../../lib/job');

const sequelize = {
  close: fake.resolves(null),
};

const event = {
  on: fake.resolves(null),
  emit: fake.returns(null),
};

const job = new Job(event);

const config = {
  tempFolder: process.env.TEMP_FOLDER || '/tmp/gladys',
};

describe('system.init', () => {
  let system;

  beforeEach(async () => {
    // To test system.setDuckDbTimezone, we need to mock variable.getValue
    const variable = {
      getValue: fake.resolves('Europe/Paris'),
    };
    system = new System(sequelize, event, config, job, variable);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should init system', async () => {
    await system.init();

    assert.called(system.dockerode.listContainers);

    assert.notCalled(sequelize.close);
    assert.called(event.on);
  });

  it('should not fail init when the host power management detection crashes', async () => {
    // logger is a module singleton: restore it explicitly, sinon.reset() would
    // leave the stubs in place for every following test file.
    const warnStub = sinon.stub(logger, 'warn');
    const debugStub = sinon.stub(logger, 'debug');
    sinon.stub(system, 'detectHostPowerManagement').rejects(new Error('docker daemon unreachable'));
    try {
      await system.init();
      // init() does not await the detection, so let the rejection handler run.
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      assert.calledWith(warnStub, 'System.init: host power management detection failed');
      assert.called(debugStub);
    } finally {
      warnStub.restore();
      debugStub.restore();
    }
  });
});
