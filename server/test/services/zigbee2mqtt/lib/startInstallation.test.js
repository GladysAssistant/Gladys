const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ConflictError } = require('../../../../utils/coreErrors');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt startInstallation', () => {
  let zigbee2mqttManager;
  let gladys;
  let clock;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
      event: {
        emit: fake(),
      },
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    clock = sinon.useFakeTimers(1700000000000);
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should start following an installation, all its phases pending', () => {
    // EXECUTE
    zigbee2mqttManager.startInstallation('install');
    // ASSERT
    expect(zigbee2mqttManager.installation).to.deep.equal({
      state: 'running',
      kind: 'install',
      phases: [
        { key: 'pull_z2m', state: 'pending', progress: 0 },
        { key: 'pull_mqtt', state: 'pending', progress: 0 },
        { key: 'start_mqtt', state: 'pending', progress: 0 },
        { key: 'start_z2m', state: 'pending', progress: 0 },
        { key: 'connect_adapter', state: 'pending', progress: 0 },
      ],
      progress: 0,
      error: null,
      durationMs: null,
    });
    expect(zigbee2mqttManager.installationStartedAt).to.equal(1700000000000);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.INSTALL_PROGRESS,
      payload: { installation: zigbee2mqttManager.installation, prefetch: zigbee2mqttManager.prefetch },
    });
  });

  it('should replace the outcome of the previous installation, and forget its job', () => {
    // PREPARE
    zigbee2mqttManager.startInstallation('install');
    zigbee2mqttManager.finishInstallation(new Error('broken'));
    zigbee2mqttManager.installationJobId = 'previous-job';
    zigbee2mqttManager.installationJobProgress = 42;
    // EXECUTE
    zigbee2mqttManager.startInstallation('switch');
    // ASSERT
    expect(zigbee2mqttManager.installation).to.include({ state: 'running', kind: 'switch', error: null });
    // The progress of the new installation must not go to the job of the previous one
    expect(zigbee2mqttManager.installationJobId).to.equal(null);
    expect(zigbee2mqttManager.installationJobProgress).to.equal(0);
  });

  it('should refuse to start an installation while another one runs', () => {
    // PREPARE
    zigbee2mqttManager.startInstallation('install');
    const { installation } = zigbee2mqttManager;
    // EXECUTE
    expect(() => zigbee2mqttManager.startInstallation('switch')).to.throw(ConflictError);
    // ASSERT
    expect(zigbee2mqttManager.installation).to.equal(installation);
    expect(installation.kind).to.equal('install');
  });
});
