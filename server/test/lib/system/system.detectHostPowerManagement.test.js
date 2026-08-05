const { expect } = require('chai');
const sinon = require('sinon');

const proxyquire = require('proxyquire').noCallThru();

const { parseCanReply, replyMeansAvailable } = require('../../../lib/system/system.detectHostPowerManagement');

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
  it('should accept yes and challenge', () => {
    expect(replyMeansAvailable('yes')).to.equal(true);
    expect(replyMeansAvailable('challenge')).to.equal(true);
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

  it('should return "local" when dbus-send binary and socket are present', async () => {
    platformStub = sinon.stub(process, 'platform').value('linux');
    const detect = load(() => true);
    const runHostPowerDbusCommand = sinon.stub();
    const self = { runHostPowerDbusCommand };
    const result = await detect.call(self);
    expect(result).to.equal('local');
    expect(self.hostPowerManagement).to.equal('local');
    // local path must not spin up a helper container
    sinon.assert.notCalled(runHostPowerDbusCommand);
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
    sinon.assert.calledOnceWithExactly(self.runHostPowerDbusCommand, 'CanReboot', 'docker-helper');
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
});
