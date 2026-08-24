const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const { isNanoCpusError } = require('../../../lib/system/system.createContainer');
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

describe('system.createContainer', () => {
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
      await system.createContainer({ image: 'my-image' });
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);

      assert.notCalled(sequelize.close);
      assert.notCalled(event.on);
      assert.notCalled(event.emit);
    }
  });

  it('should createContainer', async () => {
    const image = { image: 'my-image' };
    await system.createContainer(image);

    assert.calledOnce(system.dockerode.createContainer);
    assert.calledOnce(system.dockerode.listContainers);
    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
  });

  const buildNanoCpusError = () =>
    Object.assign(
      new Error(
        '(HTTP code 400) unexpected - NanoCPUs can not be set, as your kernel does not support CPU CFS scheduler or the cgroup is not mounted',
      ),
      {
        statusCode: 400,
        json: {
          message:
            'NanoCPUs can not be set, as your kernel does not support CPU CFS scheduler or the cgroup is not mounted',
        },
      },
    );

  it('should retry without NanoCpus when the daemon rejects the CPU limit', async () => {
    const createContainerStub = sinon.stub();
    createContainerStub.onFirstCall().rejects(buildNanoCpusError());
    createContainerStub.onSecondCall().resolves({ id: 'container-1' });
    system.dockerode.createContainer = createContainerStub;

    const options = { Image: 'my-image', HostConfig: { NanoCpus: 500000000, Memory: 268435456 } };
    await system.createContainer(options);

    assert.calledTwice(createContainerStub);
    expect(createContainerStub.secondCall.args[0]).to.deep.equal({
      Image: 'my-image',
      HostConfig: { Memory: 268435456 },
    });
    // the original descriptor is not mutated
    expect(options.HostConfig.NanoCpus).to.equal(500000000);
    // remembered so future descriptors omit the CPU limit directly
    expect(system.cpuCfsSupport).to.equal(false);
  });

  it('should not retry when the error is not the CPU CFS rejection', async () => {
    const error = Object.assign(new Error('(HTTP code 409) conflict'), { statusCode: 409 });
    const createContainerStub = sinon.stub().rejects(error);
    system.dockerode.createContainer = createContainerStub;

    try {
      await system.createContainer({ Image: 'my-image', HostConfig: { NanoCpus: 500000000 } });
      assert.fail('should have fail');
    } catch (e) {
      expect(e).to.equal(error);
    }
    assert.calledOnce(createContainerStub);
    expect(system.cpuCfsSupport).to.equal(null);
  });

  it('should not retry when the descriptor has no NanoCpus', async () => {
    const error = buildNanoCpusError();
    const createContainerStub = sinon.stub().rejects(error);
    system.dockerode.createContainer = createContainerStub;

    try {
      await system.createContainer({ Image: 'my-image', HostConfig: { Memory: 268435456 } });
      assert.fail('should have fail');
    } catch (e) {
      expect(e).to.equal(error);
    }
    assert.calledOnce(createContainerStub);
  });
});

describe('system.createContainer isNanoCpusError', () => {
  const NANO_CPUS_MESSAGE =
    'NanoCPUs can not be set, as your kernel does not support CPU CFS scheduler or the cgroup is not mounted';

  it('should return false without an error', () => {
    expect(isNanoCpusError(null)).to.equal(false);
    expect(isNanoCpusError(undefined)).to.equal(false);
  });

  it('should match on the error message', () => {
    const error = Object.assign(new Error(`(HTTP code 400) unexpected - ${NANO_CPUS_MESSAGE}`), { statusCode: 400 });
    expect(isNanoCpusError(error)).to.equal(true);
  });

  it('should match on the daemon json message alone', () => {
    expect(isNanoCpusError({ statusCode: 400, json: { message: NANO_CPUS_MESSAGE } })).to.equal(true);
  });

  it('should not match another 400 or another status code', () => {
    expect(isNanoCpusError(Object.assign(new Error('(HTTP code 400) invalid port'), { statusCode: 400 }))).to.equal(
      false,
    );
    expect(isNanoCpusError(Object.assign(new Error(NANO_CPUS_MESSAGE), { statusCode: 500 }))).to.equal(false);
  });
});
