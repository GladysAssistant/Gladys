const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');
const { PlatformNotCompatible } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt finishInstallation', () => {
  let zigbee2mqttManager;
  let clock;

  beforeEach(() => {
    const gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    zigbee2mqttManager.emitInstallProgress = fake();
    clock = sinon.useFakeTimers(1700000000000);
    zigbee2mqttManager.startInstallation('switch');
    zigbee2mqttManager.updateInstallationPhase('pull_z2m', { state: 'skipped' });
    zigbee2mqttManager.updateInstallationPhase('pull_mqtt', { state: 'skipped' });
    zigbee2mqttManager.updateInstallationPhase('start_mqtt', { state: 'skipped' });
    zigbee2mqttManager.updateInstallationPhase('start_z2m', { state: 'running' });
    zigbee2mqttManager.emitInstallProgress.resetHistory();
    clock.tick(102400);
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  it('should tell that the installation succeeded, the phases with nothing to do skipped', () => {
    // PREPARE
    const infoStub = sinon.stub(logger, 'info');
    zigbee2mqttManager.updateInstallationPhase('start_z2m', { state: 'done' });
    zigbee2mqttManager.emitInstallProgress.resetHistory();
    // EXECUTE
    zigbee2mqttManager.finishInstallation(null);
    // ASSERT
    expect(zigbee2mqttManager.installation).to.deep.equal({
      state: 'done',
      kind: 'switch',
      phases: [
        { key: 'pull_z2m', state: 'skipped', progress: 100 },
        { key: 'pull_mqtt', state: 'skipped', progress: 100 },
        { key: 'start_mqtt', state: 'skipped', progress: 100 },
        { key: 'start_z2m', state: 'done', progress: 100 },
        { key: 'connect_adapter', state: 'skipped', progress: 100 },
      ],
      progress: 100,
      error: null,
      durationMs: 102400,
    });
    assert.calledWithExactly(infoStub, 'Zigbee2mqtt: switch done in 1 min 42 s');
    assert.calledOnceWithExactly(zigbee2mqttManager.emitInstallProgress);
  });

  it('should tell that the installation ended to whoever waits for it', async () => {
    // PREPARE
    sinon.stub(logger, 'info');
    let ended = false;
    // eslint-disable-next-line promise/prefer-await-to-then
    zigbee2mqttManager.installationEnd.then(() => {
      ended = true;
    });
    await Promise.resolve();
    expect(ended).to.equal(false);
    // EXECUTE
    zigbee2mqttManager.finishInstallation(null);
    // ASSERT
    await zigbee2mqttManager.installationEnd;
    expect(ended).to.equal(true);
  });

  it('should tell done a phase left running once the installation succeeded', () => {
    // PREPARE
    sinon.stub(logger, 'info');
    // A broker slow to answer during an update: its start is left running, the update goes on
    zigbee2mqttManager.updateInstallationPhase('start_mqtt', { state: 'running' });
    // EXECUTE
    zigbee2mqttManager.finishInstallation(null);
    // ASSERT
    expect(zigbee2mqttManager.installation.phases.find((phase) => phase.key === 'start_mqtt')).to.deep.equal({
      key: 'start_mqtt',
      state: 'done',
      progress: 100,
    });
  });

  it('should tell why Zigbee2mqtt failed to start, and the phase that failed', () => {
    // PREPARE
    const warnStub = sinon.stub(logger, 'warn');
    const error = new Error('Zigbee2mqtt failed to start: INVALID_CONFIGURATION');
    error.installationError = { code: 'INVALID_CONFIGURATION', message: 'serial.port is required' };
    // EXECUTE
    zigbee2mqttManager.finishInstallation(error);
    // ASSERT
    expect(zigbee2mqttManager.installation).to.deep.equal({
      state: 'failed',
      kind: 'switch',
      phases: [
        { key: 'pull_z2m', state: 'skipped', progress: 100 },
        { key: 'pull_mqtt', state: 'skipped', progress: 100 },
        { key: 'start_mqtt', state: 'skipped', progress: 100 },
        { key: 'start_z2m', state: 'failed', progress: 0 },
        { key: 'connect_adapter', state: 'pending', progress: 0 },
      ],
      progress: 70,
      error: { code: 'INVALID_CONFIGURATION', message: 'serial.port is required' },
      durationMs: 102400,
    });
    assert.calledOnceWithExactly(warnStub, 'Zigbee2mqtt: switch failed after 1 min 42 s');
    assert.calledOnceWithExactly(zigbee2mqttManager.emitInstallProgress);
  });

  it('should not blame the download still running alongside the one that failed', () => {
    // PREPARE
    sinon.stub(logger, 'info');
    // Not the one of beforeEach, whose downloads are skipped
    zigbee2mqttManager.finishInstallation(null);
    zigbee2mqttManager.startInstallation('install');
    zigbee2mqttManager.updateInstallationPhase('pull_z2m', { state: 'running', progress: 30 });
    zigbee2mqttManager.updateInstallationPhase('pull_mqtt', { state: 'running', progress: 60 });
    // The download of the broker image fails, see pullImage
    zigbee2mqttManager.updateInstallationPhase('pull_mqtt', { state: 'failed' });
    // EXECUTE
    zigbee2mqttManager.finishInstallation(new Error('docker fail pull'));
    // ASSERT
    expect(zigbee2mqttManager.installation.phases).to.deep.equal([
      // Not followed any more: neither failed nor running
      { key: 'pull_z2m', state: 'pending', progress: 30 },
      { key: 'pull_mqtt', state: 'failed', progress: 60 },
      { key: 'start_mqtt', state: 'pending', progress: 0 },
      { key: 'start_z2m', state: 'pending', progress: 0 },
      { key: 'connect_adapter', state: 'pending', progress: 0 },
    ]);
  });

  it('should give the code of a platform not compatible', () => {
    // EXECUTE
    zigbee2mqttManager.finishInstallation(new PlatformNotCompatible('DOCKER_BAD_NETWORK'));
    // ASSERT
    expect(zigbee2mqttManager.installation.error).to.deep.equal({ code: 'DOCKER_BAD_NETWORK', message: null });
  });

  it('should give the message of any other error', () => {
    // EXECUTE
    zigbee2mqttManager.finishInstallation(new Error('(HTTP code 500) server error - no space left on device'));
    // ASSERT
    expect(zigbee2mqttManager.installation.error).to.deep.equal({
      code: null,
      message: '(HTTP code 500) server error - no space left on device',
    });
  });
});
