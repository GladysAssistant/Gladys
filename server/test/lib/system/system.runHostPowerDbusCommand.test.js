const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const proxyquire = require('proxyquire').noCallThru();

const {
  buildDbusArgv,
  runHostDbusCommand,
  runHostPowerDbusCommand,
  demuxDockerLogs,
} = require('../../../lib/system/system.runHostPowerDbusCommand');
const { parseTimeSyncStatus } = require('../../../lib/system/system.timeSync');

// What the Docker logs API returns for a container started without a TTY: one
// frame per log message, i.e. per output line with the json-file driver
const buildDockerLogs = (lines) =>
  Buffer.concat(
    lines.map((line) => {
      const payload = Buffer.from(`${line}\n`, 'utf8');
      const header = Buffer.alloc(8);
      header[0] = 1;
      header.writeUInt32BE(payload.length, 4);
      return Buffer.concat([header, payload]);
    }),
  );

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
    // The docker-default AppArmor profile has no dbus rules, so the helper must
    // run unconfined to reach systemd-logind on AppArmor-mediated hosts.
    expect(options.HostConfig.SecurityOpt).to.deep.equal(['apparmor=unconfined']);
    sinon.assert.calledOnce(container.remove);
  });

  it('should retry without the AppArmor security option when the daemon rejects it', async () => {
    const container = buildContainer(0, 'method return\n   string "yes"\n');
    const self = buildSelf(container);
    self.dockerode.createContainer = sinon
      .stub()
      .onFirstCall()
      .rejects(new Error('invalid --security-opt: "apparmor=unconfined"'))
      .onSecondCall()
      .resolves(container);
    const output = await runHostPowerDbusCommand.call(self, 'CanReboot', 'docker-helper');
    expect(output).to.contain('yes');
    sinon.assert.calledTwice(self.dockerode.createContainer);
    const firstOptions = self.dockerode.createContainer.firstCall.args[0];
    expect(firstOptions.HostConfig.SecurityOpt).to.deep.equal(['apparmor=unconfined']);
    const secondOptions = self.dockerode.createContainer.secondCall.args[0];
    expect(secondOptions.HostConfig).to.not.have.property('SecurityOpt');
    sinon.assert.calledOnce(container.remove);
  });

  it('should not retry when the helper container creation fails for an unrelated reason', async () => {
    const container = buildContainer(0, '');
    const self = buildSelf(container);
    self.dockerode.createContainer = sinon.stub().rejects(new Error('No such image: gladysassistant/gladys:v4'));
    let caught;
    try {
      await runHostPowerDbusCommand.call(self, 'CanReboot', 'docker-helper');
    } catch (e) {
      caught = e;
    }
    expect(caught).to.be.an('error');
    expect(caught.message).to.contain('No such image');
    sinon.assert.calledOnce(self.dockerode.createContainer);
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

  it('should explain the failure when the Gladys image cannot be identified', async () => {
    const self = {
      dockerode: { createContainer: sinon.stub() },
      getGladysImage: sinon.stub().rejects(new Error('DOCKER_CONTAINER_ID_NOT_AVAILABLE')),
    };
    let caught;
    try {
      await runHostPowerDbusCommand.call(self, 'CanReboot', 'docker-helper');
    } catch (e) {
      caught = e;
    }
    expect(caught).to.be.an('error');
    expect(caught.message).to.contain('Unable to identify the Gladys container image');
    expect(caught.message).to.contain('DOCKER_CONTAINER_ID_NOT_AVAILABLE');
    sinon.assert.notCalled(self.dockerode.createContainer);
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

describe('system.runHostDbusCommand', () => {
  it('should run any dbus-send argv on the host bus', async () => {
    const container = {
      start: sinon.stub().resolves(),
      wait: sinon.stub().resolves({ StatusCode: 0 }),
      logs: sinon.stub().resolves(Buffer.from('variant boolean true')),
      kill: sinon.stub().resolves(),
      remove: sinon.stub().resolves(),
    };
    const self = {
      dockerode: { createContainer: sinon.stub().resolves(container) },
      getGladysImage: sinon.stub().resolves({ image: 'gladysassistant/gladys:v4' }),
    };
    const argv = ['dbus-send', '--system', '--print-reply', '--dest=org.freedesktop.timedate1'];
    const output = await runHostDbusCommand.call(self, argv, 'docker-helper', 'time-sync-status');
    expect(output).to.contain('true');
    const options = self.dockerode.createContainer.firstCall.args[0];
    expect(options.Cmd).to.deep.equal(argv);
    expect(options.name).to.match(/^gladys-time-sync-status-\d+-[0-9a-f]{6}$/);
  });

  it('should refuse to run anything else than dbus-send', async () => {
    const self = { dockerode: { createContainer: sinon.stub() } };
    let caught;
    try {
      await runHostDbusCommand.call(self, ['sh', '-c', 'reboot'], 'docker-helper', 'test');
    } catch (e) {
      caught = e;
    }
    expect(caught.message).to.equal('HOST_DBUS_COMMAND_NOT_ALLOWED');
    sinon.assert.notCalled(self.dockerode.createContainer);
  });

  it('should read the helper output out of the Docker log frames', async () => {
    const lines = [
      'method return time=1700000000.000000 sender=:1.42 -> destination=:1.43 serial=5 reply_serial=2',
      '   array [',
      '      dict entry(',
      '         string "NTP"',
      '         variant             boolean false',
      '      )',
      '      dict entry(',
      '         string "NTPSynchronized"',
      '         variant             boolean true',
      '      )',
      '   ]',
    ];
    const container = {
      start: sinon.stub().resolves(),
      wait: sinon.stub().resolves({ StatusCode: 0 }),
      logs: sinon.stub().resolves(buildDockerLogs(lines)),
      kill: sinon.stub().resolves(),
      remove: sinon.stub().resolves(),
    };
    const self = {
      dockerode: { createContainer: sinon.stub().resolves(container) },
      getGladysImage: sinon.stub().resolves({ image: 'gladysassistant/gladys:v4' }),
    };
    const output = await runHostDbusCommand.call(self, ['dbus-send'], 'docker-helper', 'time-sync-status');
    expect(output).to.equal(`${lines.join('\n')}\n`);
    expect(parseTimeSyncStatus(output)).to.deep.equal({ can_ntp: false, ntp_enabled: false, ntp_synchronized: true });
  });

  it('should throw when the mechanism is not supported', async () => {
    let caught;
    try {
      await runHostDbusCommand.call({}, ['dbus-send'], 'nope', 'test');
    } catch (e) {
      caught = e;
    }
    expect(caught.message).to.equal('HOST_DBUS_NOT_AVAILABLE');
  });
});

describe('system.demuxDockerLogs', () => {
  it('should strip the header of every frame, even when its size bytes are printable', () => {
    // a 41-byte line has a ")" (0x29) as last header byte: left in place, it
    // would sit between a property name and its value
    const line = '         variant             boolean true';
    const logs = buildDockerLogs(['         string "NTP"', line]);
    expect(logs.includes(Buffer.from([0, 0, 0, line.length + 1]))).to.equal(true);
    expect(demuxDockerLogs(logs)).to.equal(`         string "NTP"\n${line}\n`);
  });

  it('should return a plain output as it is', () => {
    expect(demuxDockerLogs(Buffer.from('method return\n   string "yes"\n'))).to.equal(
      'method return\n   string "yes"\n',
    );
  });

  it('should return an empty output for empty logs', () => {
    expect(demuxDockerLogs(Buffer.alloc(0))).to.equal('');
  });
});
