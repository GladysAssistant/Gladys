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

  it('should fail when Docker reports an error in the progress stream', async () => {
    // Docker answers 200 then streams the failure: followProgress resolves
    system.dockerode.modem.followProgress = (stream, onFinished) =>
      onFinished(null, [
        { status: 'Downloading' },
        {
          errorDetail: { message: 'write /var/lib/docker/tmp/GetImageBlob123: no space left on device' },
          error: 'write /var/lib/docker/tmp/GetImageBlob123: no space left on device',
        },
      ]);

    try {
      await system.pull('gladysassistant/gladys:v4');
      assert.fail('should have fail');
    } catch (e) {
      expect(e).to.have.property('message', 'write /var/lib/docker/tmp/GetImageBlob123: no space left on device');
    }
  });

  it('should pass the abort signal to Docker', async () => {
    const abortController = new AbortController();
    const dockerPull = fake.resolves(true);
    system.dockerode.pull = dockerPull;

    await system.pull('gladysassistant/gladys:v4', undefined, { abortSignal: abortController.signal });

    assert.calledOnceWithExactly(dockerPull, 'gladysassistant/gladys:v4', { abortSignal: abortController.signal });
  });

  it('should not send an abort signal to Docker when none is given', async () => {
    const dockerPull = fake.resolves(true);
    system.dockerode.pull = dockerPull;

    await system.pull('gladysassistant/gladys:v4');

    assert.calledOnceWithExactly(dockerPull, 'gladysassistant/gladys:v4', {});
  });

  it('should ignore empty progress events', async () => {
    system.dockerode.modem.followProgress = (stream, onFinished) => onFinished(null, [null, { status: 'Done' }]);

    const output = await system.pull('gladysassistant/gladys:v4');

    expect(output).to.deep.equal([null, { status: 'Done' }]);
  });

  it('should resolve when the progress output is not a list', async () => {
    system.dockerode.modem.followProgress = (stream, onFinished) => onFinished(null, undefined);

    const output = await system.pull('gladysassistant/gladys:v4');

    expect(output).to.equal(undefined);
  });

  it('should fail when the progress stream breaks', async () => {
    system.dockerode.modem.followProgress = (stream, onFinished) => onFinished(new Error('SOCKET_CLOSED'), []);

    try {
      await system.pull('gladysassistant/gladys:v4');
      assert.fail('should have fail');
    } catch (e) {
      expect(e).to.have.property('message', 'SOCKET_CLOSED');
    }
  });

  it('should fail when the progress stream error has no detail', async () => {
    system.dockerode.modem.followProgress = (stream, onFinished) => onFinished(null, [{ error: 'unexpected EOF' }]);

    try {
      await system.pull('gladysassistant/gladys:v4');
      assert.fail('should have fail');
    } catch (e) {
      expect(e).to.have.property('message', 'unexpected EOF');
    }
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
