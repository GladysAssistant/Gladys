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

describe('system.getContainerMounts', () => {
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
      await system.getContainerMounts('fake_id');
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should return container binds', async () => {
    const binds = await system.getContainerMounts('a8293feec54547a797aa2e52cc14b93f89a007d6c5608c587e30491feec8ee61');
    assert.match(binds, [
      {
        Source: '/home/myname/gladys',
        Destination: '/var/lib/gladysassistant',
      },
    ]);
  });

  it('should return empty list because no container found', async () => {
    system.dockerode.listContainers = fake.resolves([]);
    const binds = await system.getContainerMounts('fake_id');
    assert.match(binds, []);
  });
});
