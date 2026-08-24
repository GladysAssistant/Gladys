const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const proxyquire = require('proxyquire').noCallThru();

const {
  parseCanReply,
  replyMeansAvailable,
  detectHostPowerManagement,
  redetectHostPowerManagement,
  HOST_POWER_REDETECTION_THROTTLE_MS,
} = require('../../../lib/system/system.detectHostPowerManagement');

describe('system.parseCanReply', () => {
  it('should extract the reply value from a dbus-send output', () => {
    expect(parseCanReply('method return time=1\n   string "yes"\n')).to.equal('yes');
  });
  it('should return null when there is no string reply', () => {
    expect(parseCanReply('')).to.equal(null);
    expect(parseCanReply('nothing here')).to.equal(null);
  });
});

describe('system.replyMeansAvailable', () => {
  it('should accept yes', () => {
    expect(replyMeansAvailable('yes')).to.equal(true);
  });
  it('should reject challenge, which needs an interactive authentication', () => {
    expect(replyMeansAvailable('challenge')).to.equal(false);
  });
  it('should reject no, na and null', () => {
    expect(replyMeansAvailable('no')).to.equal(false);
    expect(replyMeansAvailable('na')).to.equal(false);
    expect(replyMeansAvailable(null)).to.equal(false);
  });
});

describe('system.detectHostPowerManagement', () => {
  let platformStub;

  const load = (existsFake) => {
    const mod = proxyquire('../../../lib/system/system.detectHostPowerManagement', {
      fs: { existsSync: existsFake },
    });
    return mod.detectHostPowerManagement;
  };

  afterEach(() => {
    if (platformStub) {
      platformStub.restore();
      platformStub = null;
    }
  });

  it('should return null and cache it when not on Linux', async () => {
    platformStub = sinon.stub(process, 'platform').value('darwin');
    const detect = load(() => true);
    const self = { hostPowerManagement: undefined };
    const result = await detect.call(self);
    expect(result).to.equal(null);
    expect(self.hostPowerManagement).to.equal(null);
  });

  it('should return "local" when dbus-send, the socket and the CanReboot probe all answer', async () => {
    platformStub = sinon.stub(process, 'platform').value('linux');
    const detect = load(() => true);
    const runHostPowerDbusCommand = sinon.stub().resolves('   string "yes"');
    const self = { runHostPowerDbusCommand };
    const result = await detect.call(self);
    expect(result).to.equal('local');
    expect(self.hostPowerManagement).to.equal('local');
    expect(self.hostPowerCapabilities).to.deep.equal({ reboot: true, shutdown: true });
    sinon.assert.calledWithExactly(runHostPowerDbusCommand, 'CanReboot', 'local');
    sinon.assert.calledWithExactly(runHostPowerDbusCommand, 'CanPowerOff', 'local');
  });

  it('should not return "local" when the local probe is refused by polkit', async () => {
    platformStub = sinon.stub(process, 'platform').value('linux');
    const detect = load(() => true); // socket is there...
    const self = {
      dockerode: null,
      // ...but logind requires an interactive authentication we cannot provide
      runHostPowerDbusCommand: sinon.stub().resolves('   string "challenge"'),
    };
    const result = await detect.call(self);
    expect(result).to.equal(null);
    expect(self.hostPowerManagement).to.equal(null);
  });

  it('should fall back to the Docker helper when the local probe throws', async () => {
    platformStub = sinon.stub(process, 'platform').value('linux');
    const detect = load(() => true);
    const runHostPowerDbusCommand = sinon.stub();
    runHostPowerDbusCommand.withArgs('CanReboot', 'local').rejects(new Error('connection refused'));
    runHostPowerDbusCommand.withArgs('CanReboot', 'docker-helper').resolves('   string "yes"');
    const self = { dockerode: {}, runHostPowerDbusCommand };
    const result = await detect.call(self);
    expect(result).to.equal('docker-helper');
  });

  it('should return "docker-helper" when the CanReboot probe answers yes', async () => {
    platformStub = sinon.stub(process, 'platform').value('linux');
    const detect = load(() => false); // no local dbus
    const self = {
      dockerode: {},
      runHostPowerDbusCommand: sinon.stub().resolves('   string "yes"'),
    };
    const result = await detect.call(self);
    expect(result).to.equal('docker-helper');
    expect(self.hostPowerManagement).to.equal('docker-helper');
    expect(self.hostPowerCapabilities).to.deep.equal({ reboot: true, shutdown: true });
    sinon.assert.calledWithExactly(self.runHostPowerDbusCommand, 'CanReboot', 'docker-helper');
    sinon.assert.calledWithExactly(self.runHostPowerDbusCommand, 'CanPowerOff', 'docker-helper');
  });

  it('should enable only reboot when power-off is refused by the host', async () => {
    platformStub = sinon.stub(process, 'platform').value('linux');
    const detect = load(() => false);
    const runHostPowerDbusCommand = sinon.stub();
    runHostPowerDbusCommand.withArgs('CanReboot', 'docker-helper').resolves('   string "yes"');
    runHostPowerDbusCommand.withArgs('CanPowerOff', 'docker-helper').resolves('   string "no"');
    const self = { dockerode: {}, runHostPowerDbusCommand };
    const result = await detect.call(self);
    expect(result).to.equal('docker-helper');
    expect(self.hostPowerCapabilities).to.deep.equal({ reboot: true, shutdown: false });
  });

  it('should keep reboot available when the power-off probe itself fails', async () => {
    platformStub = sinon.stub(process, 'platform').value('linux');
    const detect = load(() => false);
    const runHostPowerDbusCommand = sinon.stub();
    runHostPowerDbusCommand.withArgs('CanReboot', 'docker-helper').resolves('   string "yes"');
    runHostPowerDbusCommand.withArgs('CanPowerOff', 'docker-helper').rejects(new Error('probe failed'));
    const self = { dockerode: {}, runHostPowerDbusCommand };
    const result = await detect.call(self);
    expect(result).to.equal('docker-helper');
    expect(self.hostPowerCapabilities).to.deep.equal({ reboot: true, shutdown: false });
  });

  it('should return null when the probe answers no', async () => {
    platformStub = sinon.stub(process, 'platform').value('linux');
    const detect = load(() => false);
    const self = { dockerode: {}, runHostPowerDbusCommand: sinon.stub().resolves('   string "no"') };
    const result = await detect.call(self);
    expect(result).to.equal(null);
    expect(self.hostPowerManagement).to.equal(null);
  });

  it('should return null when the probe throws', async () => {
    platformStub = sinon.stub(process, 'platform').value('linux');
    const detect = load(() => false);
    const self = { dockerode: {}, runHostPowerDbusCommand: sinon.stub().rejects(new Error('no socket')) };
    const result = await detect.call(self);
    expect(result).to.equal(null);
  });

  it('should return null when there is neither local dbus nor Docker', async () => {
    platformStub = sinon.stub(process, 'platform').value('linux');
    const detect = load(() => false);
    const self = { dockerode: null, runHostPowerDbusCommand: sinon.stub() };
    const result = await detect.call(self);
    expect(result).to.equal(null);
    sinon.assert.notCalled(self.runHostPowerDbusCommand);
  });

  it('should share a single in-flight detection between concurrent callers', async () => {
    platformStub = sinon.stub(process, 'platform').value('linux');
    const detect = load(() => false);
    const runHostPowerDbusCommand = sinon.stub().resolves('   string "yes"');
    const self = { dockerode: {}, runHostPowerDbusCommand };
    const [first, second] = await Promise.all([detect.call(self), detect.call(self)]);
    expect(first).to.equal('docker-helper');
    expect(second).to.equal('docker-helper');
    // one shared detection: the CanReboot probe ran once, not twice
    expect(runHostPowerDbusCommand.withArgs('CanReboot', 'docker-helper').callCount).to.equal(1);
    expect(self.hostPowerDetectionInFlight).to.equal(null);
    expect(self.hostPowerLastDetectionAt).to.be.a('number');
  });
});

describe('system.redetectHostPowerManagement', () => {
  let platformStub;

  afterEach(() => {
    if (platformStub) {
      platformStub.restore();
      platformStub = null;
    }
  });

  it('should return the cached mechanism without re-running the detection', async () => {
    const self = {
      hostPowerManagement: 'local',
      detectHostPowerManagement: sinon.stub().resolves('local'),
    };
    const result = await redetectHostPowerManagement.call(self);
    expect(result).to.equal('local');
    sinon.assert.notCalled(self.detectHostPowerManagement);
  });

  it('should join an in-flight detection instead of starting a new one', async () => {
    const inFlight = Promise.resolve('docker-helper');
    const self = {
      hostPowerManagement: null,
      hostPowerDetectionInFlight: inFlight,
      detectHostPowerManagement: sinon.stub().resolves('docker-helper'),
    };
    const result = await redetectHostPowerManagement.call(self);
    expect(result).to.equal('docker-helper');
    sinon.assert.notCalled(self.detectHostPowerManagement);
  });

  it('should not retry within the throttle window', async () => {
    const self = {
      hostPowerManagement: null,
      hostPowerDetectionInFlight: null,
      hostPowerLastDetectionAt: Date.now(),
      detectHostPowerManagement: sinon.stub().resolves(null),
    };
    const result = await redetectHostPowerManagement.call(self);
    expect(result).to.equal(null);
    sinon.assert.notCalled(self.detectHostPowerManagement);
  });

  it('should retry once the throttle window has passed', async () => {
    platformStub = sinon.stub(process, 'platform').value('linux');
    const self = {
      hostPowerManagement: null,
      hostPowerDetectionInFlight: null,
      hostPowerLastDetectionAt: Date.now() - HOST_POWER_REDETECTION_THROTTLE_MS - 1,
      dockerode: null,
      runHostPowerDbusCommand: sinon.stub(),
      detectHostPowerManagement,
    };
    const result = await redetectHostPowerManagement.call(self);
    expect(result).to.equal(null);
    // the detection really ran: it stamped its completion time
    expect(self.hostPowerLastDetectionAt).to.be.greaterThan(Date.now() - 1000);
  });
});
