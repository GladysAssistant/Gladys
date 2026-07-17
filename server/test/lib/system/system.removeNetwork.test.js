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

describe('system.removeNetwork', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should failed as not on docker env', async () => {
    system.dockerode = undefined;
    try {
      await system.removeNetwork('network');
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should remove an existing network', async () => {
    const remove = fake.resolves(null);
    system.dockerode.listNetworks = fake.resolves([{ Name: 'network', Id: 'network-id' }]);
    system.dockerode.getNetwork = fake.returns({ remove });
    await system.removeNetwork('network');
    assert.calledWith(system.dockerode.getNetwork, 'network-id');
    assert.calledOnce(remove);
  });

  it('should be a no-op when the network does not exist', async () => {
    system.dockerode.listNetworks = fake.resolves([]);
    system.dockerode.getNetwork = fake.returns({ remove: fake.resolves(null) });
    await system.removeNetwork('missing-network');
    assert.notCalled(system.dockerode.getNetwork);
  });
});

describe('system.getNetworks', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should failed as not on docker env', async () => {
    system.dockerode = undefined;
    try {
      await system.getNetworks();
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should list the networks with filters', async () => {
    system.dockerode.listNetworks = fake.resolves([{ Name: 'network' }]);
    const networks = await system.getNetworks({ filters: { label: ['some-label'] } });
    expect(networks).to.deep.equal([{ Name: 'network' }]);
    assert.calledWith(system.dockerode.listNetworks, { filters: { label: ['some-label'] } });
  });
});
