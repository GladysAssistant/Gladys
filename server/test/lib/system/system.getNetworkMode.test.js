const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const DockerodeMock = require('./DockerodeMock.test');

const getNetworkMode = proxyquire('../../../lib/system/system.getNetworkMode', {
  '../../utils/childProcess': { exec: () => 'containerId' },
});

const System = proxyquire('../../../lib/system', {
  dockerode: DockerodeMock,
  './system.getNetworkMode': getNetworkMode,
});

const sequelize = {
  close: fake.resolves(null),
};

const event = {
  on: fake.resolves(null),
  emit: fake.resolves(null),
};

const config = {
  tempFolder: '/tmp/gladys',
};

describe('system.getNetworkMode', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config);
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
