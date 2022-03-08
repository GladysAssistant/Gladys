const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const DockerodeMock = require('./DockerodeMock.test');

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

describe('system.getGladysContainerId', () => {
  let system;
  let FsMock;

  beforeEach(async () => {
    FsMock = {
      promises: {
        access: fake.resolves(null),
        readFile: fake.resolves('967ef3114fa2ceb8c4f6dbdbc78ee411a6f33fb1fe1d32455686ef6e89f41d1c'),
      },
      constants: {
        FS_OK: 1,
      },
    };

    const getGladysContainerId = proxyquire('../../../lib/system/system.getGladysContainerId', {
      '../../utils/childProcess': {
        exec: fake.resolves('499145208e86b9e2c1a5f11c135a45f207b399768be5ecb1f56b1b14d6b9c94a'),
      },
      fs: FsMock,
    });

    const System = proxyquire('../../../lib/system', {
      dockerode: DockerodeMock,
      './system.getGladysContainerId': getGladysContainerId,
    });

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
      await system.getGladysContainerId();
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should return containerId through cidfile', async () => {
    const containerId = await system.getGladysContainerId();
    expect(containerId).to.eq('967ef3114fa2ceb8c4f6dbdbc78ee411a6f33fb1fe1d32455686ef6e89f41d1c');
  });
  it('should return containerId through exec', async () => {
    FsMock.promises.access = fake.rejects();
    const containerId2 = await system.getGladysContainerId();
    expect(containerId2).to.eq('499145208e86b9e2c1a5f11c135a45f207b399768be5ecb1f56b1b14d6b9c94a');
  });
});
