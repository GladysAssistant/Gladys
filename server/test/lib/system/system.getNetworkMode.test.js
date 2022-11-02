const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const DockerodeMock = require('./DockerodeMock.test');

const System = proxyquire('../../../lib/system', {
  dockerode: DockerodeMock,
  './system.getGladysContainerId': {
    getGladysContainerId: fake.resolves('967ef3114fa2ceb8c4f6dbdbc78ee411a6f33fb1fe1d32455686ef6e89f41d1c'),
  },
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

describe('system.getNetworkMode', () => {
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
      await system.getNetworkMode();
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should check network', async () => {
    const network = await system.getNetworkMode();
    expect(network).to.eq('host');
    assert.calledOnce(system.dockerode.getContainer);
  });
});
