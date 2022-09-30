const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const DockerodeMock = require('./DockerodeMock.test');

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
  tempFolder: '/tmp/gladys',
};

describe('system.installUpgrade', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    // Reset all fakes invoked within init call
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should fail: not run inside docker', async () => {
    system.dockerode = undefined;

    try {
      await system.installUpgrade();
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
      expect(e).to.have.property('message', 'SYSTEM_NOT_RUNNING_DOCKER');

      assert.notCalled(sequelize.close);
      assert.notCalled(event.on);
    }
  });

  it('should install upgrade', async () => {
    await system.installUpgrade();

    assert.calledOnce(system.dockerode.getContainer);
    assert.calledWith(system.dockerode.getContainer, 'b594e692-e6d3-4531-bdcc-f0afcf515113');

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
  });

  it('should fail: watchtower not installed', async () => {
    system.dockerode.listContainers = fake.resolves([]);

    try {
      await system.installUpgrade();
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
      expect(e).to.have.property('message', 'WATCHTOWER_NOT_FOUND');

      assert.notCalled(system.dockerode.getContainer);
      assert.notCalled(sequelize.close);
      assert.notCalled(event.on);
    }
  });
});
