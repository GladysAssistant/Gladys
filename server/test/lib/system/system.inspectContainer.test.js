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

describe('system.inspectContainer', () => {
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
      await system.inspectContainer('e90e34656806');
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);

      assert.notCalled(sequelize.close);
      assert.notCalled(event.on);
    }
  });

  it('should inspect container', async () => {
    const containerDescriptor = await system.inspectContainer('e90e34656806');

    expect(containerDescriptor).be.instanceOf(Object);
    expect(containerDescriptor).to.have.property('HostConfig');

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
  });

  it('should inspect container with options', async () => {
    const options = { size: true };

    const containerDescriptor = await system.inspectContainer('e90e34656806', options);
    expect(containerDescriptor).be.instanceOf(Object);
    expect(containerDescriptor).to.have.property('HostConfig');
    expect(containerDescriptor).to.have.property('SizeRw');

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
  });
});
