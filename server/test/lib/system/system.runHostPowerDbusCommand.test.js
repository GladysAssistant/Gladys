const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const proxyquire = require('proxyquire').noCallThru();

const { buildDbusArgv, runHostPowerDbusCommand } = require('../../../lib/system/system.runHostPowerDbusCommand');

describe('system.buildDbusArgv', () => {
  it('should append boolean:false for action methods', () => {
    const argv = buildDbusArgv('Reboot');
    expect(argv).to.include('org.freedesktop.login1.Manager.Reboot');
    expect(argv).to.include('--system');
    expect(argv[argv.length - 1]).to.equal('boolean:false');
  });

  it('should not append an argument for query methods', () => {
    const argv = buildDbusArgv('CanReboot');
    expect(argv).to.include('org.freedesktop.login1.Manager.CanReboot');
    expect(argv).to.not.include('boolean:false');
  });
});

describe('system.runHostPowerDbusCommand (local)', () => {
  it('should run dbus-send directly and return its stdout', async () => {
    const exec = sinon
      .stub()
      .callsFake((command, options, callback) => callback(null, { stdout: 'string "yes"', stderr: '' }));
    const { runHostPowerDbusCommand: runWithStubbedExec } = proxyquire(
      '../../../lib/system/system.runHostPowerDbusCommand',
      {
        child_process: { exec },
      },
    );
    const output = await runWithStubbedExec.call({}, 'CanReboot', 'local');
    expect(output).to.contain('yes');
    const [command, options] = exec.firstCall.args;
    expect(command).to.contain('org.freedesktop.login1.Manager.CanReboot');
    expect(options)
      .to.have.property('timeout')
      .that.is.a('number');
  });
});

describe('system.runHostPowerDbusCommand (docker-helper)', () => {
  const buildContainer = (statusCode, logs) => ({
    start: sinon.stub().resolves(),
    wait: sinon.stub().resolves({ StatusCode: statusCode }),
    logs: sinon.stub().resolves(Buffer.from(logs)),
    kill: sinon.stub().resolves(),
    remove: sinon.stub().resolves(),
  });

  const buildSelf = (container) => ({
    dockerode: { createContainer: sinon.stub().resolves(container) },
    getGladysImage: sinon.stub().resolves({ image: 'gladysassistant/gladys:v4' }),
  });

  it('should launch a helper container mounting the host DBus socket and return its output', async () => {
    const container = buildContainer(0, 'method return\n   string "yes"\n');
    const self = buildSelf(container);
    const output = await runHostPowerDbusCommand.call(self, 'Reboot', 'docker-helper');
    expect(output).to.contain('yes');
    sinon.assert.calledOnce(self.getGladysImage);
    const options = self.dockerode.createContainer.firstCall.args[0];
    expect(options.Image).to.equal('gladysassistant/gladys:v4');
    expect(options.Cmd).to.include('org.freedesktop.login1.Manager.Reboot');
    expect(options.HostConfig.Binds).to.deep.equal(['/run/dbus:/run/dbus:ro']);
    sinon.assert.calledOnce(container.remove);
  });

  it('should throw when the helper container exits with a non-zero status', async () => {
    const container = buildContainer(1, 'boom');
    const self = buildSelf(container);
    let caught;
    try {
      await runHostPowerDbusCommand.call(self, 'Reboot', 'docker-helper');
    } catch (e) {
      caught = e;
    }
    expect(caught).to.be.an('error');
    expect(caught.message).to.contain('status 1');
    sinon.assert.calledOnce(container.remove);
  });

  it('should time out and clean up when the helper container never exits', async () => {
    const clock = sinon.useFakeTimers();
    try {
      const container = buildContainer(0, '');
      // a stuck helper: wait() never settles
      container.wait = sinon.stub().returns(new Promise(() => {}));
      const self = buildSelf(container);
      const promise = runHostPowerDbusCommand.call(self, 'Reboot', 'docker-helper');
      let caught;
      // attach the handler before advancing the clock, so the rejection is never unhandled
      const settled = (async () => {
        try {
          await promise;
        } catch (e) {
          caught = e;
        }
      })();
      await clock.tickAsync(20000);
      await settled;
      expect(caught).to.be.an('error');
      expect(caught.message).to.contain('timed out');
      sinon.assert.calledOnce(container.kill);
      sinon.assert.calledOnce(container.remove);
    } finally {
      clock.restore();
    }
  });

  it('should throw when Docker is not available for the helper', async () => {
    let caught;
    try {
      await runHostPowerDbusCommand.call({ dockerode: null }, 'Reboot', 'docker-helper');
    } catch (e) {
      caught = e;
    }
    expect(caught).to.be.an('error');
  });
});

describe('system.runHostPowerDbusCommand (unknown mechanism)', () => {
  it('should throw when the mechanism is not supported', async () => {
    let caught;
    try {
      await runHostPowerDbusCommand.call({}, 'Reboot', 'nope');
    } catch (e) {
      caught = e;
    }
    expect(caught).to.be.an('error');
  });
});
