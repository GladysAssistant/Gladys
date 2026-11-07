const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../../services/zigbee2mqtt/lib');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');
const logger = require('../../../../../utils/logger');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt emitInstallProgress', () => {
  let zigbee2mqttManager;
  let gladys;
  let clock;
  // The progress sent with each message, read when sent as the websocket does
  let sentProgresses;

  beforeEach(() => {
    sentProgresses = [];
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
        updateProgress: fake.resolves(null),
      },
      event: {
        emit: fake((eventName, { payload }) => sentProgresses.push(payload.installation.progress)),
      },
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    clock = sinon.useFakeTimers(1700000000000);
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should send the installation and the prefetch at once', () => {
    // EXECUTE
    zigbee2mqttManager.emitInstallProgress();
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.INSTALL_PROGRESS,
      payload: {
        installation: {
          state: 'idle',
          kind: null,
          phases: [],
          progress: 0,
          error: null,
          durationMs: null,
        },
        prefetch: {
          state: 'idle',
          progress: 0,
          freeBytes: null,
          neededBytes: null,
          error: null,
        },
      },
    });
  });

  it('should send at most twice a second, the last state always', () => {
    // EXECUTE
    zigbee2mqttManager.emitInstallProgress();
    clock.tick(100);
    zigbee2mqttManager.installation.progress = 10;
    zigbee2mqttManager.emitInstallProgress();
    clock.tick(100);
    zigbee2mqttManager.installation.progress = 20;
    zigbee2mqttManager.emitInstallProgress();
    expect(sentProgresses).to.deep.equal([0]);
    clock.tick(299);
    expect(sentProgresses).to.deep.equal([0]);
    clock.tick(1);
    // ASSERT
    expect(sentProgresses).to.deep.equal([0, 20]);
    clock.tick(5000);
    expect(sentProgresses).to.deep.equal([0, 20]);
  });

  it('should send at once after the interval', () => {
    // EXECUTE
    zigbee2mqttManager.emitInstallProgress();
    clock.tick(500);
    zigbee2mqttManager.installation.progress = 10;
    zigbee2mqttManager.emitInstallProgress();
    // ASSERT
    expect(sentProgresses).to.deep.equal([0, 10]);
  });

  it('should update the progress of the installation job when it changes', () => {
    // PREPARE
    zigbee2mqttManager.installationJobId = 'job-id';
    // EXECUTE
    zigbee2mqttManager.emitInstallProgress();
    clock.tick(500);
    zigbee2mqttManager.installation.progress = 10;
    zigbee2mqttManager.emitInstallProgress();
    clock.tick(500);
    zigbee2mqttManager.emitInstallProgress();
    // ASSERT
    assert.calledOnceWithExactly(gladys.job.updateProgress, 'job-id', 10);
    expect(zigbee2mqttManager.installationJobProgress).to.equal(10);
  });

  it('should not update a job before the installation job starts', () => {
    // PREPARE
    zigbee2mqttManager.installation.progress = 10;
    // EXECUTE
    zigbee2mqttManager.emitInstallProgress();
    // ASSERT
    assert.notCalled(gladys.job.updateProgress);
  });

  it('should go on when the progress of the job fails to be updated', async () => {
    // PREPARE
    const warnStub = sinon.stub(logger, 'warn');
    gladys.job.updateProgress = fake.rejects(new Error('Job not found'));
    zigbee2mqttManager.installationJobId = 'job-id';
    zigbee2mqttManager.installation.progress = 10;
    // EXECUTE
    try {
      zigbee2mqttManager.emitInstallProgress();
      await Promise.resolve();
      await Promise.resolve();
    } finally {
      warnStub.restore();
    }
    // ASSERT
    assert.calledOnce(gladys.event.emit);
    assert.calledOnceWithExactly(
      warnStub,
      'Zigbee2mqtt: failed to update the progress of the installation job: Job not found',
    );
  });
});
