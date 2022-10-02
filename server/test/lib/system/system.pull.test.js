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

describe('system.pull', () => {
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
      await system.pull('latest');
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);

      assert.notCalled(sequelize.close);
      assert.notCalled(event.on);
      assert.notCalled(event.emit);
    }
  });

  it('should pull image', async () => {
    const tag = 'latest';
    const onProgress = fake.returns(null);
    await system.pull(tag, onProgress);

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);

    assert.calledOnce(onProgress);
  });

  it('should fail downloading upgrade', async () => {
    const tag = 'fail';
    const onProgress = fake.returns(null);

    try {
      await system.pull(tag, onProgress);
      assert.fail('should have fail');
    } catch (e) {
      assert.notCalled(onProgress);
      assert.notCalled(sequelize.close);
      assert.notCalled(event.on);
      assert.notCalled(event.emit);
    }
  });
});
