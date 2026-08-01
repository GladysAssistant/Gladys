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

describe('system.createNetwork', () => {
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
      await system.createNetwork('gladys-integrations');
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should return the existing network without creating it', async () => {
    const network = await system.createNetwork('network');
    expect(network).to.have.property('Name', 'network');
    assert.notCalled(system.dockerode.createNetwork);
  });

  it('should create a missing network with the given options', async () => {
    await system.createNetwork('gladys-integrations', {
      Options: { 'com.docker.network.bridge.enable_icc': 'false' },
    });
    assert.calledWith(system.dockerode.createNetwork, {
      Name: 'gladys-integrations',
      Driver: 'bridge',
      Options: { 'com.docker.network.bridge.enable_icc': 'false' },
    });
  });

  it('should fall back to auto-assignment when the pinned subnet is taken', async () => {
    system.dockerode.createNetwork = sinon
      .stub()
      .onFirstCall()
      .rejects(new Error('Pool overlaps with other one on this address space'))
      .onSecondCall()
      .resolves(true);
    const options = {
      IPAM: { Driver: 'default', Config: [{ Subnet: '172.30.0.0/24', Gateway: '172.30.0.1' }] },
      Options: { 'com.docker.network.bridge.enable_icc': 'false' },
    };
    await system.createNetwork('gladys-integrations', options);
    expect(system.dockerode.createNetwork.secondCall.args[0]).to.deep.equal({
      Name: 'gladys-integrations',
      Driver: 'bridge',
      Options: { 'com.docker.network.bridge.enable_icc': 'false' },
    });
  });

  it('should throw when creation fails without IPAM to retry', async () => {
    system.dockerode.createNetwork = fake.rejects(new Error('CANNOT_CREATE'));
    try {
      await system.createNetwork('gladys-integrations');
      assert.fail('should have fail');
    } catch (e) {
      expect(e.message).to.equal('CANNOT_CREATE');
    }
  });
});
