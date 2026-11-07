const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt updateInstallationPhase', () => {
  let zigbee2mqttManager;

  const phase = (key) =>
    zigbee2mqttManager.installation.phases.find((installationPhase) => installationPhase.key === key);

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
    zigbee2mqttManager.startInstallation('install');
    zigbee2mqttManager.emitInstallProgress.resetHistory();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should do nothing outside an installation', () => {
    // PREPARE
    zigbee2mqttManager.finishInstallation(null);
    zigbee2mqttManager.emitInstallProgress.resetHistory();
    const installation = JSON.parse(JSON.stringify(zigbee2mqttManager.installation));
    // EXECUTE
    zigbee2mqttManager.updateInstallationPhase('pull_z2m', { state: 'running', progress: 42 });
    // ASSERT
    expect(zigbee2mqttManager.installation).to.deep.equal(installation);
    assert.notCalled(zigbee2mqttManager.emitInstallProgress);
  });

  it('should update a running phase, and the progress of the installation by the weight of the phase', () => {
    // EXECUTE
    zigbee2mqttManager.updateInstallationPhase('pull_z2m', { state: 'running', progress: 42 });
    // ASSERT
    expect(phase('pull_z2m')).to.deep.equal({ key: 'pull_z2m', state: 'running', progress: 42 });
    // Half of the installation is the download of the Zigbee2mqtt image
    expect(zigbee2mqttManager.installation.progress).to.equal(21);
    assert.calledOnceWithExactly(zigbee2mqttManager.emitInstallProgress);
  });

  it('should start a phase without progress', () => {
    // EXECUTE
    zigbee2mqttManager.updateInstallationPhase('start_mqtt', { state: 'running' });
    // ASSERT
    expect(phase('start_mqtt')).to.deep.equal({ key: 'start_mqtt', state: 'running', progress: 0 });
    expect(zigbee2mqttManager.installation.progress).to.equal(0);
  });

  it('should never take a progress back', () => {
    // EXECUTE
    zigbee2mqttManager.updateInstallationPhase('pull_z2m', { state: 'running', progress: 42 });
    zigbee2mqttManager.updateInstallationPhase('pull_z2m', { state: 'running', progress: 30 });
    // ASSERT
    expect(phase('pull_z2m').progress).to.equal(42);
    expect(zigbee2mqttManager.installation.progress).to.equal(21);
  });

  it('should count a phase done or skipped as complete', () => {
    // EXECUTE
    zigbee2mqttManager.updateInstallationPhase('pull_z2m', { state: 'done' });
    zigbee2mqttManager.updateInstallationPhase('pull_mqtt', { state: 'skipped' });
    // ASSERT
    expect(phase('pull_z2m')).to.deep.equal({ key: 'pull_z2m', state: 'done', progress: 100 });
    expect(phase('pull_mqtt')).to.deep.equal({ key: 'pull_mqtt', state: 'skipped', progress: 100 });
    expect(zigbee2mqttManager.installation.progress).to.equal(60);
  });

  it('should reach 100 once every phase is complete', () => {
    // EXECUTE
    ['pull_z2m', 'pull_mqtt', 'start_mqtt', 'start_z2m', 'connect_adapter'].forEach((key) =>
      zigbee2mqttManager.updateInstallationPhase(key, { state: 'done' }),
    );
    // ASSERT
    expect(zigbee2mqttManager.installation.progress).to.equal(100);
  });

  it('should not skip a phase that already ran, when Zigbee2mqtt is installed again by the ezsp fallback', () => {
    // PREPARE
    zigbee2mqttManager.updateInstallationPhase('pull_z2m', { state: 'done' });
    zigbee2mqttManager.updateInstallationPhase('start_z2m', { state: 'done' });
    zigbee2mqttManager.emitInstallProgress.resetHistory();
    // EXECUTE
    zigbee2mqttManager.updateInstallationPhase('pull_z2m', { state: 'skipped' });
    zigbee2mqttManager.updateInstallationPhase('start_z2m', { state: 'running' });
    // ASSERT
    expect(phase('pull_z2m')).to.deep.equal({ key: 'pull_z2m', state: 'done', progress: 100 });
    // Running again, without taking its progress back
    expect(phase('start_z2m')).to.deep.equal({ key: 'start_z2m', state: 'running', progress: 100 });
    expect(zigbee2mqttManager.installation.progress).to.equal(60);
    assert.calledOnce(zigbee2mqttManager.emitInstallProgress);
  });
});
