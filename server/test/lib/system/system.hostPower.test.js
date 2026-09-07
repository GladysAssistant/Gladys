const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { rebootHost } = require('../../../lib/system/system.rebootHost');
const { shutdownHost } = require('../../../lib/system/system.shutdownHost');

const buildSelf = (overrides = {}) => ({
  hostPowerManagement: 'docker-helper',
  hostPowerCapabilities: { reboot: true, shutdown: true },
  detectHostPowerManagement: sinon.stub().resolves('docker-helper'),
  runHostPowerDbusCommand: sinon.stub().resolves(''),
  ...overrides,
});

describe('system.rebootHost', () => {
  it('should reboot using the cached mechanism without re-detecting', async () => {
    const self = buildSelf();
    await rebootHost.call(self);
    sinon.assert.notCalled(self.detectHostPowerManagement);
    sinon.assert.calledOnceWithExactly(self.runHostPowerDbusCommand, 'Reboot', 'docker-helper');
  });

  it('should detect the mechanism when not cached, then reboot', async () => {
    const self = buildSelf({
      hostPowerManagement: null,
      detectHostPowerManagement: sinon.stub().resolves('local'),
    });
    await rebootHost.call(self);
    sinon.assert.calledOnce(self.detectHostPowerManagement);
    sinon.assert.calledOnceWithExactly(self.runHostPowerDbusCommand, 'Reboot', 'local');
  });

  it('should throw and not run any command when no mechanism is available', async () => {
    const self = buildSelf({
      hostPowerManagement: null,
      detectHostPowerManagement: sinon.stub().resolves(null),
    });
    let caught;
    try {
      await rebootHost.call(self);
    } catch (e) {
      caught = e;
    }
    expect(caught).to.be.an('error');
    sinon.assert.notCalled(self.runHostPowerDbusCommand);
  });

  it('should throw when the host allows power off but refuses reboot', async () => {
    const self = buildSelf({ hostPowerCapabilities: { reboot: false, shutdown: true } });
    let caught;
    try {
      await rebootHost.call(self);
    } catch (e) {
      caught = e;
    }
    expect(caught).to.be.an('error');
    expect(caught.message).to.equal('HOST_POWER_REBOOT_NOT_AVAILABLE');
    sinon.assert.notCalled(self.runHostPowerDbusCommand);
  });

  it('should throw when the capabilities were never populated', async () => {
    const self = buildSelf({ hostPowerCapabilities: undefined });
    let caught;
    try {
      await rebootHost.call(self);
    } catch (e) {
      caught = e;
    }
    expect(caught).to.be.an('error');
    sinon.assert.notCalled(self.runHostPowerDbusCommand);
  });
});

describe('system.shutdownHost', () => {
  it('should power off using the cached mechanism', async () => {
    const self = buildSelf();
    await shutdownHost.call(self);
    sinon.assert.notCalled(self.detectHostPowerManagement);
    sinon.assert.calledOnceWithExactly(self.runHostPowerDbusCommand, 'PowerOff', 'docker-helper');
  });

  it('should throw when no mechanism is available', async () => {
    const self = buildSelf({
      hostPowerManagement: null,
      detectHostPowerManagement: sinon.stub().resolves(null),
    });
    let caught;
    try {
      await shutdownHost.call(self);
    } catch (e) {
      caught = e;
    }
    expect(caught).to.be.an('error');
    sinon.assert.notCalled(self.runHostPowerDbusCommand);
  });

  it('should throw when the host allows reboot but refuses power off', async () => {
    const self = buildSelf({ hostPowerCapabilities: { reboot: true, shutdown: false } });
    let caught;
    try {
      await shutdownHost.call(self);
    } catch (e) {
      caught = e;
    }
    expect(caught).to.be.an('error');
    expect(caught.message).to.equal('HOST_POWER_SHUTDOWN_NOT_AVAILABLE');
    sinon.assert.notCalled(self.runHostPowerDbusCommand);
  });

  it('should throw when the capabilities were never populated', async () => {
    const self = buildSelf({ hostPowerCapabilities: undefined });
    let caught;
    try {
      await shutdownHost.call(self);
    } catch (e) {
      caught = e;
    }
    expect(caught).to.be.an('error');
    sinon.assert.notCalled(self.runHostPowerDbusCommand);
  });
});
