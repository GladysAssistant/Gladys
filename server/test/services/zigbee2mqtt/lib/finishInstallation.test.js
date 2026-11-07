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
