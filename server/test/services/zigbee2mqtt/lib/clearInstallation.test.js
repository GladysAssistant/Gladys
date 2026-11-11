const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt clearInstallation', () => {
  let zigbee2mqttManager;

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
  });

  afterEach(() => {
    sinon.restore();
  });

  [
    ['succeeded', null],
    ['failed', new Error('docker fail pull')],
  ].forEach(([outcome, error]) => {
    it(`should forget an installation that ${outcome}, its job with it, and send the idle installation`, () => {
      // PREPARE
      zigbee2mqttManager.startInstallation('install');
      zigbee2mqttManager.installationJobId = 'job-id';
      zigbee2mqttManager.installationJobProgress = 100;
      zigbee2mqttManager.finishInstallation(error);
      zigbee2mqttManager.emitInstallProgress.resetHistory();
      // EXECUTE
      zigbee2mqttManager.clearInstallation();
      // ASSERT
      expect(zigbee2mqttManager.installation).to.deep.equal({
        state: 'idle',
        kind: null,
        phases: [],
        progress: 0,
        error: null,
        durationMs: null,
      });
      // The progress of the idle installation does not go to the job of the previous one
      expect(zigbee2mqttManager.installationJobId).to.equal(null);
      expect(zigbee2mqttManager.installationJobProgress).to.equal(0);
      assert.calledOnceWithExactly(zigbee2mqttManager.emitInstallProgress);
    });
  });

  it('should keep a running installation, which tells its own outcome', () => {
    // PREPARE
    zigbee2mqttManager.startInstallation('install');
    zigbee2mqttManager.installationJobId = 'job-id';
    const { installation } = zigbee2mqttManager;
    zigbee2mqttManager.emitInstallProgress.resetHistory();
    // EXECUTE
    zigbee2mqttManager.clearInstallation();
    // ASSERT
    expect(zigbee2mqttManager.installation).to.equal(installation);
    expect(zigbee2mqttManager.installationJobId).to.equal('job-id');
    assert.notCalled(zigbee2mqttManager.emitInstallProgress);
  });

  it('should send nothing when there is no outcome to forget', () => {
    // PREPARE
    const { installation } = zigbee2mqttManager;
    // EXECUTE
    zigbee2mqttManager.clearInstallation();
    // ASSERT
    expect(zigbee2mqttManager.installation).to.equal(installation);
    assert.notCalled(zigbee2mqttManager.emitInstallProgress);
  });
});
