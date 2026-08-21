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
  tempFolder: process.env.TEMP_FOLDER || '/tmp/gladys',
};

/**
 * @description Build a Docker error carrying an HTTP status code.
 * @param {number} statusCode - The HTTP status code returned by the daemon.
 * @param {string} message - The error message.
 * @returns {Error} The error.
 * @example
 * const error = dockerError(409, 'image is being used');
 */
function dockerError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

describe('system.removeImage', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    // Reset all fakes invoked within init call (the Dockerode mock fakes live
    // in the mock file's own sandbox, hence the dedicated reset)
    sinon.reset();
    DockerodeMock.resetMockHistory();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should failed as not on docker env', async () => {
    system.dockerode = undefined;

    try {
      await system.removeImage('my-image:1.0.0');
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should remove the image', async () => {
    const remove = fake.resolves(true);
    system.dockerode.getImage = fake.returns({ remove });

    const removed = await system.removeImage('my-image:1.0.0', { noprune: true });

    expect(removed).to.equal(true);
    assert.calledWith(system.dockerode.getImage, 'my-image:1.0.0');
    assert.calledWith(remove, { noprune: true, force: false });
  });

  it('should never force, even when a caller asks for it', async () => {
    // the "never force" rule is the safety invariant of every caller: deleting
    // an image from under a running container turns a cleanup into an outage
    const remove = fake.resolves(true);
    system.dockerode.getImage = fake.returns({ remove });

    await system.removeImage('my-image:1.0.0', { force: true });

    assert.calledWith(remove, { force: false });
  });

  it('should resolve with false when the image does not exist (HTTP 404)', async () => {
    system.dockerode.getImage = fake.returns({
      remove: fake.rejects(dockerError(404, 'no such image')),
    });

    expect(await system.removeImage('my-image:1.0.0')).to.equal(false);
  });

  it('should resolve with false when the image is still in use (HTTP 409)', async () => {
    system.dockerode.getImage = fake.returns({
      remove: fake.rejects(dockerError(409, 'image is being used by running container')),
    });

    expect(await system.removeImage('my-image:1.0.0')).to.equal(false);
  });

  it('should throw on other Docker errors', async () => {
    system.dockerode.getImage = fake.returns({
      remove: fake.rejects(dockerError(500, 'internal server error')),
    });

    try {
      await system.removeImage('my-image:1.0.0');
      assert.fail('should have failed');
    } catch (e) {
      expect(e.statusCode).to.equal(500);
      expect(e.message).to.equal('internal server error');
    }
  });
});
