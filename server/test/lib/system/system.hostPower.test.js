const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { rebootHost } = require('../../../lib/system/system.rebootHost');
const { shutdownHost } = require('../../../lib/system/system.shutdownHost');

describe('system.rebootHost', () => {
  it('should reboot using the cached mechanism without re-detecting', async () => {
    const self = {
      hostPowerManagement: 'docker-helper',
      detectHostPowerManagement: sinon.stub().resolves('docker-helper'),
      runHostPowerDbusCommand: sinon.stub().resolves(''),
    };
    await rebootHost.call(self);
    sinon.assert.notCalled(self.detectHostPowerManagement);
    sinon.assert.calledOnceWithExactly(self.runHostPowerDbusCommand, 'Reboot', 'docker-helper');
  });

  it('should detect the mechanism when not cached, then reboot', async () => {
    const self = {
      hostPowerManagement: null,
      detectHostPowerManagement: sinon.stub().resolves('local'),
      runHostPowerDbusCommand: sinon.stub().resolves(''),
    };
    await rebootHost.call(self);
    sinon.assert.calledOnce(self.detectHostPowerManagement);
    sinon.assert.calledOnceWithExactly(self.runHostPowerDbusCommand, 'Reboot', 'local');
  });

  it('should throw and not run any command when no mechanism is available', async () => {
    const self = {
      hostPowerManagement: null,
      detectHostPowerManagement: sinon.stub().resolves(null),
      runHostPowerDbusCommand: sinon.stub().resolves(''),
    };
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
    const self = {
      hostPowerManagement: 'docker-helper',
      detectHostPowerManagement: sinon.stub().resolves('docker-helper'),
      runHostPowerDbusCommand: sinon.stub().resolves(''),
    };
    await shutdownHost.call(self);
    sinon.assert.notCalled(self.detectHostPowerManagement);
    sinon.assert.calledOnceWithExactly(self.runHostPowerDbusCommand, 'PowerOff', 'docker-helper');
  });

  it('should throw when no mechanism is available', async () => {
    const self = {
      hostPowerManagement: null,
      detectHostPowerManagement: sinon.stub().resolves(null),
      runHostPowerDbusCommand: sinon.stub().resolves(''),
    };
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
