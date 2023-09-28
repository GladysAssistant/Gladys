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
  emit: fake.resolves(null),
};

const job = new Job(event);

const config = {
  tempFolder: '/tmp/gladys',
};

describe('system.getContainers', () => {
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

  it('should failed as not on docker env', async () => {
    system.dockerode = undefined;

    try {
      await system.getContainers();
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);

      assert.notCalled(sequelize.close);
      assert.notCalled(event.on);
    }
  });

  it('should list containers', async () => {
    const containers = await system.getContainers();
    expect(containers).be.instanceOf(Array);
    expect(containers).be.lengthOf(2);

    containers.forEach((container) => {
      expect(container).to.have.property('name');
      expect(container).to.have.property('state');
      expect(container).to.have.property('id');
      expect(container).to.have.property('devices');
      expect(container).to.have.property('created_at');
    });

    assert.calledOnce(system.dockerode.listContainers);
    assert.calledWith(system.dockerode.listContainers, { all: true });

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
  });

  it('should list containers with options', async () => {
    const options = { all: true, filters: 'any' };

    const containers = await system.getContainers(options);
    expect(containers).be.instanceOf(Array);
    expect(containers).be.lengthOf(2);

    containers.forEach((container) => {
      expect(container).to.have.property('name');
      expect(container).to.have.property('state');
      expect(container).to.have.property('id');
      expect(container).to.have.property('created_at');
    });

    assert.calledOnce(system.dockerode.listContainers);
    assert.calledWith(system.dockerode.listContainers, options);

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
  });
});
