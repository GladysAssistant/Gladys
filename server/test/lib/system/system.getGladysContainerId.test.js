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
  const procSelfCpuGroupDebia11 =
    '0::/system.slice/docker-2bb2c94b0c395fc8fdff9fa4ce364a3be0dd05792145ffc93ce8d665d06521f1.scope';

  const procSelfCpuGroupDebia11WithDataInSecondLine = `
      3:rdma:/
      0::/system.slice/docker-2bb2c94b0c395fc8fdff9fa4ce364a3be0dd05792145ffc93ce8d665d06521f1.scope
      `;

  const procSelfCpuGroupDebian10 = `12:cpuset:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          11:cpu,cpuacct:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          10:freezer:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          9:devices:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          8:blkio:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          7:perf_event:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          6:net_cls,net_prio:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          5:hugetlb:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          4:pids:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          3:rdma:/
          2:memory:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          1:name=systemd:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          0::/system.slice/containerd.service
    `;

  const procSelfCpuGroupDebian10WithDataInSecondLine = `
          3:rdma:/        
          12:cpuset:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          11:cpu,cpuacct:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          10:freezer:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          9:devices:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          8:blkio:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          7:perf_event:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          6:net_cls,net_prio:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          5:hugetlb:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          4:pids:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350 
          2:memory:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          1:name=systemd:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
          0::/system.slice/containerd.service
    `;

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
  it('should return containerId through exec in cgroup v2 (Debian 11)', async () => {
    FsMock.promises.access = fake.rejects();
    FsMock.promises.readFile = fake.resolves(procSelfCpuGroupDebia11);
    const containerId2 = await system.getGladysContainerId();
    expect(containerId2).to.eq('2bb2c94b0c395fc8fdff9fa4ce364a3be0dd05792145ffc93ce8d665d06521f1');
  });
  it('should return containerId through exec in cgroup v2 (Debian 11) with containerId not on first line', async () => {
    FsMock.promises.access = fake.rejects();
    FsMock.promises.readFile = fake.resolves(procSelfCpuGroupDebia11WithDataInSecondLine);
    const containerId2 = await system.getGladysContainerId();
    expect(containerId2).to.eq('2bb2c94b0c395fc8fdff9fa4ce364a3be0dd05792145ffc93ce8d665d06521f1');
  });
  it('should return containerId through exec in cgroup v1 (Debian 10)', async () => {
    FsMock.promises.access = fake.rejects();
    FsMock.promises.readFile = fake.resolves(procSelfCpuGroupDebian10);
    const containerId2 = await system.getGladysContainerId();
    expect(containerId2).to.eq('357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350');
  });
  it('should return containerId through exec in cgroup v1 (Debian 10) with containerId not on first line', async () => {
    FsMock.promises.access = fake.rejects();
    FsMock.promises.readFile = fake.resolves(procSelfCpuGroupDebian10WithDataInSecondLine);
    const containerId2 = await system.getGladysContainerId();
    expect(containerId2).to.eq('357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350');
  });
  it('should return error, system not compatible', async () => {
    FsMock.promises.access = fake.rejects();
    FsMock.promises.readFile = fake.resolves('3:rdma:/');
    try {
      await system.getGladysContainerId();
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });
});
