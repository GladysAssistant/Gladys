const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const DockerodeMock = require('./DockerodeMock.test');
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

  const procSelfMountInfo = `
          888 708 0:47 / / rw,relatime master:264 - overlay overlay rw,lowerdir=/var/lib/docker/overlay2/l/6T3ZSFC7JNUBDFNLCKRD5QPPXY:/var/lib/docker/overlay2/l/5AJTXS5HN3KIZ5YR6BA2ZFRE3L:/var/lib/docker/overlay2/l/GVCKZC2NKRDM2WOSBBBQ46WIFN:/var/lib/docker/overlay2/l/KLX2J6EGBYQ34BL3JEGLOHQ7RU:/var/lib/docker/overlay2/l/PTGKFMXP6YB7S4QBYJ5O3ETJS5:/var/lib/docker/overlay2/l/7J46PQ3IIPKFHQNQZMMC6Z7BA5:/var/lib/docker/overlay2/l/CS73HPLIUVRXW6KIBPPH35QABK:/var/lib/docker/overlay2/l/3QXP33I66FIO6ZCZBZSRVJNWDL:/var/lib/docker/overlay2/l/TMM2SSXHFGB5IYQDOGIHMSNHEL:/var/lib/docker/overlay2/l/F4236R2CV5MLREPSLPVLAOPUEA:/var/lib/docker/overlay2/l/WOJUCHWNDFEPC62VG7MS2LXJO3:/var/lib/docker/overlay2/l/VOIOH6NPQNUY5HGM77CMD5OT4D:/var/lib/docker/overlay2/l/LLH5HDLCV4QB4LPJDLYOOSNMYY:/var/lib/docker/overlay2/l/PVZJ2K4NDE6FMENS7OWSWQSFKM,upperdir=/var/lib/docker/overlay2/ce769bb9a8388f80ef67a31944f39ce12c06e38c0fc952920996d0c455bca177/diff,workdir=/var/lib/docker/overlay2/ce769bb9a8388f80ef67a31944f39ce12c06e38c0fc952920996d0c455bca177/work
          889 888 0:66 / /proc rw,nosuid,nodev,noexec,relatime - proc proc rw
          890 888 0:18 / /sys rw,nosuid,nodev,noexec,relatime - sysfs sysfs rw
          891 890 0:23 / /sys/fs/cgroup rw,nosuid,nodev,noexec,relatime - cgroup2 cgroup rw,nsdelegate,memory_recursiveprot
          892 888 0:5 / /dev rw,relatime - devtmpfs devtmpfs rw,size=1776952k,nr_inodes=444238,mode=755
          893 892 0:19 / /dev/shm rw,nosuid,nodev - tmpfs tmpfs rw
          894 892 0:20 / /dev/pts rw,nosuid,noexec,relatime - devpts devpts rw,gid=5,mode=620,ptmxmode=000
          895 892 0:15 / /dev/mqueue rw,nosuid,nodev,noexec,relatime - mqueue mqueue rw
          830 888 0:21 /udev /run/udev ro - tmpfs tmpfs rw,size=777088k,nr_inodes=819200,mode=755
          918 888 179:2 /var/lib/docker/containers/83fa542c0b140e45e63ad7263c539ac08e2cbf7916894f1c51c3f016397b168e/resolv.conf /etc/resolv.conf rw,noatime - ext4 /dev/root rw
          1075 888 179:2 /var/lib/docker/containers/83fa542c0b140e45e63ad7263c539ac08e2cbf7916894f1c51c3f016397b168e/hostname /etc/hostname rw,noatime - ext4 /dev/root rw
          1077 888 179:2 /var/lib/docker/containers/83fa542c0b140e45e63ad7263c539ac08e2cbf7916894f1c51c3f016397b168e/hosts /etc/hosts rw,noatime - ext4 /dev/root rw
          1099 888 179:2 /home/pi/data/gladys /var/lib/gladysassistant rw,noatime - ext4 /dev/root rw
          632 888 0:21 /docker.sock /run/docker.sock rw,nosuid,nodev - tmpfs tmpfs rw,size=777088k,nr_inodes=819200,mode=755
    `;

  beforeEach(async () => {
    FsMock = {
      promises: {
        access: sinon.stub(),
        readFile: sinon.stub(),
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
      await system.getGladysContainerId();
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should return containerId through cidfile', async () => {
    FsMock.promises.access.withArgs('/var/lib/gladysassistant/containerId').resolves(null);
    FsMock.promises.readFile.resolves('967ef3114fa2ceb8c4f6dbdbc78ee411a6f33fb1fe1d32455686ef6e89f41d1c');
    const containerId = await system.getGladysContainerId();
    expect(containerId).to.eq('967ef3114fa2ceb8c4f6dbdbc78ee411a6f33fb1fe1d32455686ef6e89f41d1c');
  });
  it('should return containerId through exec in mountinfo (Debian 11)', async () => {
    FsMock.promises.access
      .withArgs('/var/lib/gladysassistant/containerId')
      .rejects()
      .withArgs('/proc/self/cgroup')
      .resolves(null)
      .withArgs('/proc/self/mountinfo')
      .resolves(null);
    FsMock.promises.readFile
      .withArgs('/proc/self/cgroup', 'utf-8')
      .resolves('0::/')
      .withArgs('/proc/self/mountinfo', 'utf-8')
      .resolves(procSelfMountInfo);
    const containerId2 = await system.getGladysContainerId();
    expect(containerId2).to.eq('83fa542c0b140e45e63ad7263c539ac08e2cbf7916894f1c51c3f016397b168e');
  });
  it('should return containerId through exec in mountinfo (Debian 11) when cgroup does not exist', async () => {
    FsMock.promises.access
      .withArgs('/var/lib/gladysassistant/containerId')
      .rejects()
      .withArgs('/proc/self/cgroup')
      .rejects()
      .withArgs('/proc/self/mountinfo')
      .resolves(null);
    FsMock.promises.readFile.withArgs('/proc/self/mountinfo', 'utf-8').resolves(procSelfMountInfo);
    const containerId2 = await system.getGladysContainerId();
    expect(containerId2).to.eq('83fa542c0b140e45e63ad7263c539ac08e2cbf7916894f1c51c3f016397b168e');
  });
  it('should return containerId through exec in cgroup v2 (Debian 11)', async () => {
    FsMock.promises.access
      .withArgs('/var/lib/gladysassistant/containerId')
      .rejects()
      .withArgs('/proc/self/cgroup')
      .resolves(null);
    FsMock.promises.readFile = fake.resolves(procSelfCpuGroupDebia11);
    const containerId2 = await system.getGladysContainerId();
    expect(containerId2).to.eq('2bb2c94b0c395fc8fdff9fa4ce364a3be0dd05792145ffc93ce8d665d06521f1');
  });
  it('should return containerId through exec in cgroup v2 (Debian 11) with containerId not on first line', async () => {
    FsMock.promises.access
      .withArgs('/var/lib/gladysassistant/containerId')
      .rejects()
      .withArgs('/proc/self/cgroup')
      .resolves(null);
    FsMock.promises.readFile = fake.resolves(procSelfCpuGroupDebia11WithDataInSecondLine);
    const containerId2 = await system.getGladysContainerId();
    expect(containerId2).to.eq('2bb2c94b0c395fc8fdff9fa4ce364a3be0dd05792145ffc93ce8d665d06521f1');
  });
  it('should return containerId through exec in cgroup v1 (Debian 10)', async () => {
    FsMock.promises.access
      .withArgs('/var/lib/gladysassistant/containerId')
      .rejects()
      .withArgs('/proc/self/cgroup')
      .resolves(null);
    FsMock.promises.readFile = fake.resolves(procSelfCpuGroupDebian10);
    const containerId2 = await system.getGladysContainerId();
    expect(containerId2).to.eq('357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350');
  });
  it('should return containerId through exec in cgroup v1 (Debian 10) with containerId not on first line', async () => {
    FsMock.promises.access
      .withArgs('/var/lib/gladysassistant/containerId')
      .rejects()
      .withArgs('/proc/self/cgroup')
      .resolves(null);
    FsMock.promises.readFile = fake.resolves(procSelfCpuGroupDebian10WithDataInSecondLine);
    const containerId2 = await system.getGladysContainerId();
    expect(containerId2).to.eq('357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350');
  });
  it('should return error, system not compatible', async () => {
    FsMock.promises.access
      .withArgs('/var/lib/gladysassistant/containerId')
      .rejects()
      .withArgs('/proc/self/mountinfo')
      .rejects()
      .withArgs('/proc/self/cgroup')
      .resolves(null);
    FsMock.promises.readFile = fake.resolves('3:rdma:/');
    try {
      await system.getGladysContainerId();
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });
});
