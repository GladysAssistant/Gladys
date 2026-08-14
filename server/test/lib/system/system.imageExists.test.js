const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

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

describe('system.imageExists', () => {
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
      await system.imageExists('my-image');
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should return true when the image is present locally', async () => {
    const exists = await system.imageExists('my-image:latest');
    expect(exists).to.equal(true);
  });

  it('should return false when the image is not present locally', async () => {
    const notFoundError = new Error('no such image');
    notFoundError.statusCode = 404;
    system.dockerode.getImage = fake.returns({
      inspect: fake.rejects(notFoundError),
    });
    const exists = await system.imageExists('my-image:latest');
    expect(exists).to.equal(false);
  });

  it('should rethrow a daemon error', async () => {
    const daemonError = new Error('docker daemon unreachable');
    daemonError.statusCode = 500;
    system.dockerode.getImage = fake.returns({
      inspect: fake.rejects(daemonError),
    });
    try {
      await system.imageExists('my-image:latest');
      assert.fail('should have fail');
    } catch (e) {
      expect(e.message).to.equal('docker daemon unreachable');
    }
  });
});
