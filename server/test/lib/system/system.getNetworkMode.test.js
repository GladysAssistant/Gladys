const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();
const fs = require('fs');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const DockerodeMock = require('./DockerodeMock.test');

let fsError = false;
const fsMock = {
  ...fs,
  access: (file, options, callback) => {
    callback(fsError);
  },
};
const getNetworkMode = proxyquire('../../../lib/system/system.getNetworkMode', {
  '../../utils/childProcess': { exec: () => 'containerId' },
  fs: fsMock,
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
    fsError = false;
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

  it('should get cidfile content', async () => {
    fsMock.readFile = fake.returns('8c0b4110ae930dbe26b258de9bc34a03f98056ed6f27f991d32919bfe401d7c5');
    const network = await system.getNetworkMode();
    expect(network).to.eq('host');
    assert.calledOnce(system.dockerode.getContainer);
    assert.calledOnce(fsMock.readFile);
    assert.calledWith(fsMock.readFile, '/var/lib/gladysassistant/containerId', 'utf8');
  });

  it('should check network', async () => {
    fsError = true;
    const network = await system.getNetworkMode();
    expect(network).to.eq('host');
    assert.calledOnce(system.dockerode.getContainer);
  });
});
