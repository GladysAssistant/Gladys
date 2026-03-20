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

describe('system.removeContainer', () => {
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
      await system.removeContainer('my-container');
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);

      assert.notCalled(sequelize.close);
      assert.notCalled(event.on);
      assert.notCalled(event.emit);
    }
  });

  it('should removeContainer command with success', async () => {
    const result = await system.removeContainer('my-container');

    expect(result).to.be.eq(undefined);

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
    assert.notCalled(event.emit);

    assert.calledOnce(system.dockerode.getContainer);
  });

  it('should resolve when container does not exist (HTTP 404)', async () => {
    const error = new Error('no such container');
    error.statusCode = 404;
    system.dockerode.getContainer = fake.returns({
      remove: fake.rejects(error),
    });

    await system.removeContainer('my-container');

    assert.calledOnce(system.dockerode.getContainer);
  });

  it('should throw on other Docker errors', async () => {
    const error = new Error('internal server error');
    error.statusCode = 500;
    system.dockerode.getContainer = fake.returns({
      remove: fake.rejects(error),
    });

    try {
      await system.removeContainer('my-container');
      assert.fail('should have failed');
    } catch (e) {
      expect(e.statusCode).to.be.eq(500);
      expect(e.message).to.be.eq('internal server error');
    }
  });
});
