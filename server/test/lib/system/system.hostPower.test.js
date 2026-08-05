const { expect } = require('chai');
const sinon = require('sinon');

const proxyquire = require('proxyquire').noCallThru();

describe('system.rebootHost', () => {
  it('should reboot the host through systemd-logind (DBus)', async () => {
    const exec = sinon.stub().callsFake((command, options, callback) => callback(null, { stdout: '', stderr: '' }));
    const { rebootHost } = proxyquire('../../../lib/system/system.rebootHost', {
      child_process: { exec },
    });
    await rebootHost();
    expect(exec.callCount).to.equal(1);
    const [command, options] = exec.firstCall.args;
    expect(command).to.contain('org.freedesktop.login1.Manager.Reboot');
    expect(command).to.contain('--system');
    expect(options)
      .to.have.property('timeout')
      .that.is.a('number');
  });

  it('should reject if the DBus command fails', async () => {
    const exec = sinon.stub().callsFake((command, options, callback) => callback(new Error('dbus-send not found')));
    const { rebootHost } = proxyquire('../../../lib/system/system.rebootHost', {
      child_process: { exec },
    });
    let caughtError;
    try {
      await rebootHost();
    } catch (err) {
      caughtError = err;
    }
    expect(caughtError).to.be.an('error');
    expect(caughtError.message).to.contain('dbus-send not found');
  });
});

describe('system.shutdownHost', () => {
  it('should power off the host through systemd-logind (DBus)', async () => {
    const exec = sinon.stub().callsFake((command, options, callback) => callback(null, { stdout: '', stderr: '' }));
    const { shutdownHost } = proxyquire('../../../lib/system/system.shutdownHost', {
      child_process: { exec },
    });
    await shutdownHost();
    expect(exec.callCount).to.equal(1);
    const [command, options] = exec.firstCall.args;
    expect(command).to.contain('org.freedesktop.login1.Manager.PowerOff');
    expect(command).to.contain('--system');
    expect(options)
      .to.have.property('timeout')
      .that.is.a('number');
  });

  it('should reject if the DBus command fails', async () => {
    const exec = sinon.stub().callsFake((command, options, callback) => callback(new Error('dbus-send not found')));
    const { shutdownHost } = proxyquire('../../../lib/system/system.shutdownHost', {
      child_process: { exec },
    });
    let caughtError;
    try {
      await shutdownHost();
    } catch (err) {
      caughtError = err;
    }
    expect(caughtError).to.be.an('error');
    expect(caughtError.message).to.contain('dbus-send not found');
  });
});
