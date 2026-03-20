const { expect } = require('chai');
const sinon = require('sinon');
const { EventEmitter } = require('events');

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

describe('system.getContainerLogs', () => {
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

  it('should throw PlatformNotCompatible when not running in Docker', async () => {
    system.dockerode = undefined;

    try {
      await system.getContainerLogs('abc123');
      assert.fail('should have failed');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should return container logs stream with default options', async () => {
    const fakeStream = new EventEmitter();
    const logsFake = fake.returns(fakeStream);
    system.dockerode.getContainer = fake.returns({ logs: logsFake });

    const result = await system.getContainerLogs('abc123');

    expect(result).to.equal(fakeStream);
    assert.calledOnceWithExactly(system.dockerode.getContainer, 'abc123');
    assert.calledWith(logsFake, { stdout: true, stderr: true, tail: 100, follow: false });
  });

  it('should merge custom options with defaults', async () => {
    const fakeStream = new EventEmitter();
    const logsFake = fake.returns(fakeStream);
    system.dockerode.getContainer = fake.returns({ logs: logsFake });

    const result = await system.getContainerLogs('abc123', { tail: 200, follow: true });

    expect(result).to.equal(fakeStream);
    assert.calledWith(logsFake, { stdout: true, stderr: true, tail: 200, follow: true });
  });
});
