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

describe('system.updateContainer', () => {
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
      await system.updateContainer('my-container', { RestartPolicy: { Name: 'always' } });
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);

      assert.notCalled(sequelize.close);
      assert.notCalled(event.on);
      assert.notCalled(event.emit);
    }
  });

  it('should updateContainer command with success', async () => {
    const result = await system.updateContainer('my-container', { RestartPolicy: { Name: 'always' } });

    expect(result).to.be.eq(true);

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
    assert.notCalled(event.emit);

    assert.calledOnceWithExactly(system.dockerode.getContainer, 'my-container');
    const [containerMock] = system.dockerode.getContainer.returnValues;
    assert.calledOnceWithExactly(containerMock.update, { RestartPolicy: { Name: 'always' } });
  });
});
