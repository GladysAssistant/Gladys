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

describe('system.hasCpuCfsSupport', () => {
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
      await system.hasCpuCfsSupport();
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should return true when the kernel supports CPU CFS', async () => {
    // real casing of the /info API JSON keys (moby json struct tags)
    system.dockerode.info = fake.resolves({ CpuCfsQuota: true, CpuCfsPeriod: true });
    const cpuCfsSupported = await system.hasCpuCfsSupport();
    expect(cpuCfsSupported).to.equal(true);
  });

  it('should return false when the kernel has no CPU CFS support', async () => {
    // what a Synology DSM daemon actually returns
    system.dockerode.info = fake.resolves({ CpuCfsQuota: false, CpuCfsPeriod: false });
    const cpuCfsSupported = await system.hasCpuCfsSupport();
    expect(cpuCfsSupported).to.equal(false);
  });

  it('should return false when only the CFS period is unsupported', async () => {
    system.dockerode.info = fake.resolves({ CpuCfsQuota: true, CpuCfsPeriod: false });
    const cpuCfsSupported = await system.hasCpuCfsSupport();
    expect(cpuCfsSupported).to.equal(false);
  });

  it('should also accept the Go field name casing of the flags', async () => {
    system.dockerode.info = fake.resolves({ CPUCfsQuota: false, CPUCfsPeriod: false });
    const cpuCfsSupported = await system.hasCpuCfsSupport();
    expect(cpuCfsSupported).to.equal(false);
  });

  it('should cache the result', async () => {
    const info = fake.resolves({ CpuCfsQuota: false, CpuCfsPeriod: false });
    system.dockerode.info = info;
    await system.hasCpuCfsSupport();
    const cpuCfsSupported = await system.hasCpuCfsSupport();
    expect(cpuCfsSupported).to.equal(false);
    assert.calledOnce(info);
  });

  it('should default to true when the field is missing', async () => {
    system.dockerode.info = fake.resolves({});
    const cpuCfsSupported = await system.hasCpuCfsSupport();
    expect(cpuCfsSupported).to.equal(true);
  });

  it('should default to true when Docker info fails, without caching', async () => {
    system.dockerode.info = fake.rejects(new Error('socket error'));
    const cpuCfsSupported = await system.hasCpuCfsSupport();
    expect(cpuCfsSupported).to.equal(true);
    expect(system.cpuCfsSupport).to.equal(null);
  });
});
