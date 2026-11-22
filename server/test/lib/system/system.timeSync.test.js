const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();
const { performance } = require('perf_hooks');

const {
  getTimeSyncStatus,
  enableTimeSync,
  parseTimeSyncStatus,
  parseVirtualization,
  buildTimeSyncStatusArgv,
  buildEnableTimeSyncArgv,
  buildVirtualizationArgv,
  TIME_SYNC_STATUS_CACHE_MS,
  TIME_SYNC_SETTLE_MS,
} = require('../../../lib/system/system.timeSync');

// What `dbus-send --print-reply ... Properties.GetAll string:org.freedesktop.timedate1` prints
const buildGetAllOutput = ({ canNtp = true, ntp = true, ntpSynchronized = true } = {}) => {
  const entry = (name, value) =>
    `      dict entry(\n         string "${name}"\n         variant             ${value}\n      )\n`;
  return [
    'method return time=1700000000.000000 sender=:1.42 -> destination=:1.43 serial=5 reply_serial=2\n',
    '   array [\n',
    entry('Timezone', 'string "Europe/Paris"'),
    entry('LocalRTC', 'boolean false'),
    canNtp === null ? '' : entry('CanNTP', `boolean ${canNtp}`),
    entry('NTP', `boolean ${ntp}`),
    entry('NTPSynchronized', `boolean ${ntpSynchronized}`),
    entry('TimeUSec', 'uint64 1700000000000000'),
    '   ]\n',
  ].join('');
};

// What `dbus-send --print-reply ... Properties.Get ... string:Virtualization` prints
const buildVirtualizationOutput = (virtualization) =>
  [
    'method return time=1700000000.000000 sender=:1.2 -> destination=:1.43 serial=5 reply_serial=2\n',
    `   variant       string "${virtualization}"\n`,
  ].join('');

describe('system.timeSync argv', () => {
  it('should read all the systemd-timedated properties', () => {
    const argv = buildTimeSyncStatusArgv();
    expect(argv).to.include('--system');
    expect(argv).to.include('--dest=org.freedesktop.timedate1');
    expect(argv).to.include('org.freedesktop.DBus.Properties.GetAll');
    expect(argv[argv.length - 1]).to.equal('string:org.freedesktop.timedate1');
  });

  it('should turn on NTP non-interactively', () => {
    const argv = buildEnableTimeSyncArgv();
    expect(argv).to.include('org.freedesktop.timedate1.SetNTP');
    expect(argv.slice(-2)).to.deep.equal(['boolean:true', 'boolean:false']);
  });

  it('should ask systemd for the virtualization of the host', () => {
    expect(buildVirtualizationArgv()).to.deep.equal([
      'dbus-send',
      '--system',
      '--print-reply',
      '--dest=org.freedesktop.systemd1',
      '/org/freedesktop/systemd1',
      'org.freedesktop.DBus.Properties.Get',
      'string:org.freedesktop.systemd1.Manager',
      'string:Virtualization',
    ]);
  });
});

describe('system.parseVirtualization', () => {
  it('should parse a container', () => {
    expect(parseVirtualization(buildVirtualizationOutput('lxc'))).to.equal('lxc');
  });

  it('should parse a bare-metal host', () => {
    expect(parseVirtualization(buildVirtualizationOutput(''))).to.equal('');
  });

  it('should strip the Docker log frame headers', () => {
    const output = `\u0001\u0000\u0000\u0000\u0000\u0000\u0000\u0080${buildVirtualizationOutput('lxc')}`;
    expect(parseVirtualization(output)).to.equal('lxc');
  });

  it('should return null when the output is not an answer of systemd', () => {
    expect(parseVirtualization('Error org.freedesktop.DBus.Error.ServiceUnknown')).to.equal(null);
    expect(parseVirtualization(undefined)).to.equal(null);
  });
});

describe('system.parseTimeSyncStatus', () => {
  it('should parse a synchronized host', () => {
    expect(parseTimeSyncStatus(buildGetAllOutput())).to.deep.equal({
      can_ntp: true,
      ntp_enabled: true,
      ntp_synchronized: true,
    });
  });

  it('should not mistake NTPSynchronized for NTP', () => {
    expect(parseTimeSyncStatus(buildGetAllOutput({ ntp: false, ntpSynchronized: true }))).to.deep.equal({
      can_ntp: true,
      ntp_enabled: false,
      ntp_synchronized: true,
    });
  });

  it('should parse a host with NTP turned off', () => {
    expect(parseTimeSyncStatus(buildGetAllOutput({ ntp: false, ntpSynchronized: false }))).to.deep.equal({
      can_ntp: true,
      ntp_enabled: false,
      ntp_synchronized: false,
    });
  });

  it('should strip the Docker log frame headers', () => {
    const output = `\u0001\u0000\u0000\u0000\u0000\u0000\u0001\u0010${buildGetAllOutput({ ntpSynchronized: false })}`;
    expect(parseTimeSyncStatus(output)).to.deep.equal({
      can_ntp: true,
      ntp_enabled: true,
      ntp_synchronized: false,
    });
  });

  it('should deduce CanNTP from NTP on an old systemd-timedated', () => {
    expect(parseTimeSyncStatus(buildGetAllOutput({ canNtp: null, ntp: false }))).to.deep.equal({
      can_ntp: false,
      ntp_enabled: false,
      ntp_synchronized: true,
    });
  });

  it('should return null when the output is not a systemd-timedated answer', () => {
    expect(parseTimeSyncStatus('Error org.freedesktop.DBus.Error.ServiceUnknown')).to.equal(null);
    expect(parseTimeSyncStatus(undefined)).to.equal(null);
  });
});

describe('system.getTimeSyncStatus', () => {
  const originalPlatform = process.platform;
  let existsSync;
  let getTimeSyncStatusWithFs;

  const setPlatform = (platform) => Object.defineProperty(process, 'platform', { value: platform });

  beforeEach(() => {
    setPlatform('linux');
    existsSync = sinon.stub().returns(false);
    ({ getTimeSyncStatus: getTimeSyncStatusWithFs } = proxyquire('../../../lib/system/system.timeSync', {
      fs: { existsSync },
    }));
  });

  afterEach(() => {
    setPlatform(originalPlatform);
    sinon.restore();
  });

  const buildSystem = (runHostDbusCommand, dockerode = {}) => ({
    dockerode,
    timeSyncMechanism: null,
    timeSyncStatus: null,
    timeSyncStatusReadAt: null,
    timeSyncStatusInFlight: null,
    hostVirtualization: null,
    runHostDbusCommand,
  });

  it('should read the status through the Docker helper', async () => {
    const runHostDbusCommand = sinon.stub().resolves(buildGetAllOutput());
    const system = buildSystem(runHostDbusCommand);
    const status = await getTimeSyncStatusWithFs.call(system);
    expect(status).to.deep.equal({
      available: true,
      can_ntp: true,
      ntp_enabled: true,
      ntp_synchronized: true,
      in_container: false,
    });
    // a host plainly kept on time is not asked whether it is a container
    sinon.assert.calledOnceWithExactly(
      runHostDbusCommand,
      buildTimeSyncStatusArgv(),
      'docker-helper',
      'time-sync-status',
    );
    expect(system.timeSyncMechanism).to.equal('docker-helper');
  });

  it('should try the host bus directly first, then fall back to the Docker helper', async () => {
    existsSync.returns(true);
    const runHostDbusCommand = sinon.stub();
    runHostDbusCommand.withArgs(sinon.match.any, 'local').rejects(new Error('dbus-send: not found'));
    runHostDbusCommand.withArgs(sinon.match.any, 'docker-helper').resolves(buildGetAllOutput());
    const system = buildSystem(runHostDbusCommand);
    const status = await getTimeSyncStatusWithFs.call(system);
    expect(status.available).to.equal(true);
    expect(runHostDbusCommand.firstCall.args[1]).to.equal('local');
    expect(runHostDbusCommand.secondCall.args[1]).to.equal('docker-helper');
  });

  it('should try first the mechanism that answered last time', async () => {
    existsSync.returns(true);
    const runHostDbusCommand = sinon.stub().resolves(buildGetAllOutput());
    const system = buildSystem(runHostDbusCommand);
    system.timeSyncMechanism = 'docker-helper';
    await getTimeSyncStatusWithFs.call(system);
    sinon.assert.calledOnce(runHostDbusCommand);
    expect(runHostDbusCommand.firstCall.args[1]).to.equal('docker-helper');
  });

  it('should report the status as unavailable when nothing answers like systemd-timedated', async () => {
    const runHostDbusCommand = sinon.stub().resolves('Error org.freedesktop.DBus.Error.ServiceUnknown');
    const system = buildSystem(runHostDbusCommand);
    system.timeSyncMechanism = 'local';
    const status = await getTimeSyncStatusWithFs.call(system);
    expect(status).to.deep.equal({
      available: false,
      can_ntp: false,
      ntp_enabled: false,
      ntp_synchronized: false,
      in_container: false,
    });
    expect(system.timeSyncMechanism).to.equal(null);
  });

  // a host whose time service is not running, with the given answers about its virtualization
  const stubHostNotKeptOnTime = () => {
    const runHostDbusCommand = sinon.stub();
    runHostDbusCommand
      .withArgs(sinon.match.any, sinon.match.any, 'time-sync-status')
      .resolves(buildGetAllOutput({ ntp: false, ntpSynchronized: true }));
    return {
      runHostDbusCommand,
      virtualization: runHostDbusCommand.withArgs(buildVirtualizationArgv(), 'docker-helper', 'host-virtualization'),
    };
  };

  it('should report that the host is a container, and ask it only once', async () => {
    const { runHostDbusCommand, virtualization } = stubHostNotKeptOnTime();
    virtualization.resolves(buildVirtualizationOutput('lxc'));
    const system = buildSystem(runHostDbusCommand);
    const status = await getTimeSyncStatusWithFs.call(system);
    expect(status).to.deep.equal({
      available: true,
      can_ntp: true,
      ntp_enabled: false,
      ntp_synchronized: true,
      in_container: true,
    });
    expect((await getTimeSyncStatusWithFs.call(system, { refresh: true })).in_container).to.equal(true);
    sinon.assert.calledOnce(virtualization);
  });

  ['', 'kvm', 'wsl'].forEach((id) => {
    it(`should not report a host with the virtualization "${id}" as a container, and ask it only once`, async () => {
      const { runHostDbusCommand, virtualization } = stubHostNotKeptOnTime();
      virtualization.resolves(buildVirtualizationOutput(id));
      const system = buildSystem(runHostDbusCommand);
      expect((await getTimeSyncStatusWithFs.call(system)).in_container).to.equal(false);
      expect((await getTimeSyncStatusWithFs.call(system, { refresh: true })).in_container).to.equal(false);
      sinon.assert.calledOnce(virtualization);
    });
  });

  it('should still report the status when the virtualization cannot be read, and ask again next time', async () => {
    const { runHostDbusCommand, virtualization } = stubHostNotKeptOnTime();
    virtualization.onFirstCall().rejects(new Error('timeout'));
    virtualization.onSecondCall().resolves('Error org.freedesktop.DBus.Error.AccessDenied');
    virtualization.onThirdCall().resolves(buildVirtualizationOutput('lxc'));
    const system = buildSystem(runHostDbusCommand);
    const first = await getTimeSyncStatusWithFs.call(system);
    expect(first.available).to.equal(true);
    expect(first.in_container).to.equal(false);
    expect((await getTimeSyncStatusWithFs.call(system, { refresh: true })).in_container).to.equal(false);
    expect((await getTimeSyncStatusWithFs.call(system, { refresh: true })).in_container).to.equal(true);
  });

  it('should report the status as unavailable without any way to reach the host bus', async () => {
    const runHostDbusCommand = sinon.stub();
    const system = buildSystem(runHostDbusCommand, null);
    const status = await getTimeSyncStatusWithFs.call(system);
    expect(status.available).to.equal(false);
    sinon.assert.notCalled(runHostDbusCommand);
  });

  it('should report the status as unavailable outside Linux', async () => {
    setPlatform('darwin');
    const runHostDbusCommand = sinon.stub();
    const system = buildSystem(runHostDbusCommand);
    const status = await getTimeSyncStatus.call(system);
    expect(status.available).to.equal(false);
    sinon.assert.notCalled(runHostDbusCommand);
  });

  it('should cache the status on the monotonic clock, and share a read in flight', async () => {
    let monotonicNow = 1000;
    sinon.stub(performance, 'now').callsFake(() => monotonicNow);
    const runHostDbusCommand = sinon.stub().resolves(buildGetAllOutput());
    const system = buildSystem(runHostDbusCommand);
    const [first, second] = await Promise.all([
      getTimeSyncStatusWithFs.call(system),
      getTimeSyncStatusWithFs.call(system),
    ]);
    expect(first).to.equal(second);
    await getTimeSyncStatusWithFs.call(system);
    sinon.assert.calledOnce(runHostDbusCommand);
    monotonicNow += TIME_SYNC_STATUS_CACHE_MS + 1;
    await getTimeSyncStatusWithFs.call(system);
    sinon.assert.calledTwice(runHostDbusCommand);
  });

  it('should read the status again when a refresh is asked, even when cached', async () => {
    const runHostDbusCommand = sinon.stub();
    runHostDbusCommand.onFirstCall().resolves('Error org.freedesktop.DBus.Error.ServiceUnknown');
    runHostDbusCommand.onSecondCall().resolves(buildGetAllOutput());
    const system = buildSystem(runHostDbusCommand);
    expect((await getTimeSyncStatusWithFs.call(system)).available).to.equal(false);
    expect((await getTimeSyncStatusWithFs.call(system)).available).to.equal(false);
    sinon.assert.calledOnce(runHostDbusCommand);
    expect((await getTimeSyncStatusWithFs.call(system, { refresh: true })).available).to.equal(true);
    sinon.assert.calledTwice(runHostDbusCommand);
  });
});

describe('system.enableTimeSync', () => {
  const buildSystem = (status, newStatus) => ({
    timeSyncMechanism: 'docker-helper',
    timeSyncStatus: status,
    timeSyncStatusReadAt: Date.now(),
    timeSyncStatusInFlight: null,
    getTimeSyncStatus: sinon.stub().callsFake(async function getStatus() {
      return (
        this.timeSyncStatus ||
        newStatus || { available: true, can_ntp: true, ntp_enabled: true, ntp_synchronized: false }
      );
    }),
    runHostDbusCommand: sinon.stub().resolves('method return'),
  });
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers({ toFake: ['setTimeout'] });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should turn on NTP on the host and return the new status', async () => {
    const system = buildSystem({ available: true, can_ntp: true, ntp_enabled: false, ntp_synchronized: false });
    const promise = enableTimeSync.call(system);
    await clock.tickAsync(TIME_SYNC_SETTLE_MS);
    const status = await promise;
    sinon.assert.calledOnceWithExactly(
      system.runHostDbusCommand,
      buildEnableTimeSyncArgv(),
      'docker-helper',
      'time-sync-enable',
    );
    expect(system.timeSyncStatusReadAt).to.equal(null);
    expect(status).to.deep.equal({ available: true, can_ntp: true, ntp_enabled: true, ntp_synchronized: false });
  });

  it('should leave the time service the time to start before reading the new status', async () => {
    const system = buildSystem({ available: true, can_ntp: true, ntp_enabled: false, ntp_synchronized: false });
    const promise = enableTimeSync.call(system);
    await clock.tickAsync(TIME_SYNC_SETTLE_MS - 1);
    sinon.assert.calledOnce(system.getTimeSyncStatus);
    await clock.tickAsync(1);
    await promise;
    sinon.assert.calledTwice(system.getTimeSyncStatus);
    expect(system.getTimeSyncStatus.secondCall.args).to.deep.equal([{ refresh: true }]);
  });

  it('should not return the status of a read started before the change', async () => {
    const system = buildSystem({ available: true, can_ntp: true, ntp_enabled: false, ntp_synchronized: false });
    let endReadInFlight;
    system.timeSyncStatusInFlight = new Promise((resolve) => {
      endReadInFlight = resolve;
    });
    const promise = enableTimeSync.call(system);
    await clock.tickAsync(TIME_SYNC_SETTLE_MS);
    sinon.assert.calledOnce(system.getTimeSyncStatus);
    endReadInFlight({ available: true, can_ntp: true, ntp_enabled: false, ntp_synchronized: false });
    expect((await promise).ntp_enabled).to.equal(true);
    sinon.assert.calledTwice(system.getTimeSyncStatus);
  });

  it('should warn when the host accepted the request but its time service is not running', async () => {
    const logger = { debug: sinon.stub(), info: sinon.stub(), warn: sinon.stub() };
    const { enableTimeSync: enableTimeSyncWithLogger } = proxyquire('../../../lib/system/system.timeSync', {
      '../../utils/logger': logger,
    });
    const notRunning = { available: true, can_ntp: true, ntp_enabled: false, ntp_synchronized: false };
    const system = buildSystem(notRunning, notRunning);
    const promise = enableTimeSyncWithLogger.call(system);
    await clock.tickAsync(TIME_SYNC_SETTLE_MS);
    expect(await promise).to.deep.equal(notRunning);
    sinon.assert.calledOnce(logger.warn);
  });

  it('should refuse when the host is a container', async () => {
    const system = buildSystem({
      available: true,
      can_ntp: true,
      ntp_enabled: false,
      ntp_synchronized: false,
      in_container: true,
    });
    let caught;
    try {
      await enableTimeSync.call(system);
    } catch (e) {
      caught = e;
    }
    expect(caught.message).to.equal('TIME_SYNC_IN_CONTAINER');
    sinon.assert.notCalled(system.runHostDbusCommand);
  });

  it('should refuse when the host time synchronization cannot be reached', async () => {
    const system = buildSystem({ available: false, can_ntp: false, ntp_enabled: false, ntp_synchronized: false });
    let caught;
    try {
      await enableTimeSync.call(system);
    } catch (e) {
      caught = e;
    }
    expect(caught.message).to.equal('TIME_SYNC_NOT_AVAILABLE');
    sinon.assert.notCalled(system.runHostDbusCommand);
  });

  it('should refuse when the host has no network time service', async () => {
    const system = buildSystem({ available: true, can_ntp: false, ntp_enabled: false, ntp_synchronized: false });
    let caught;
    try {
      await enableTimeSync.call(system);
    } catch (e) {
      caught = e;
    }
    expect(caught.message).to.equal('TIME_SYNC_NO_NTP_SERVICE');
    sinon.assert.notCalled(system.runHostDbusCommand);
  });
});
