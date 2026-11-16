const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt waitForZigbee2mqtt', () => {
  let zigbee2mqttManager;
  let clock;

  const connectAdapterPhase = () =>
    zigbee2mqttManager.installation.phases.find((phase) => phase.key === 'connect_adapter');

  // Settled or not, without waiting for it
  const follow = (promise) => {
    const followed = { settled: false, error: null };
    (async () => {
      try {
        await promise;
      } catch (e) {
        followed.error = e;
      }
      followed.settled = true;
    })();
    return followed;
  };

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
    zigbee2mqttManager.getConfiguration = fake.resolves({ mqttMode: 'local' });
    zigbee2mqttManager.startInstallation('install');
    // A plugged dongle, Zigbee2mqtt started
    zigbee2mqttManager.usbConfigured = true;
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should end at once when Zigbee2mqtt already answers', async () => {
    // PREPARE
    zigbee2mqttManager.zigbee2mqttConnected = true;
    // EXECUTE
    await zigbee2mqttManager.waitForZigbee2mqtt();
    // ASSERT
    expect(connectAdapterPhase()).to.deep.equal({ key: 'connect_adapter', state: 'done', progress: 100 });
  });

  it('should wait for Zigbee2mqtt to answer', async () => {
    // EXECUTE
    const wait = follow(zigbee2mqttManager.waitForZigbee2mqtt());
    await clock.tickAsync(10000);
    expect(wait.settled).to.equal(false);
    expect(connectAdapterPhase().state).to.equal('running');
    zigbee2mqttManager.zigbee2mqttConnected = true;
    await clock.tickAsync(500);
    // ASSERT
    expect(wait).to.deep.equal({ settled: true, error: null });
    expect(connectAdapterPhase().state).to.equal('done');
  });

  it('should fail as soon as the logs of the container tell why Zigbee2mqtt does not start', async () => {
    // PREPARE
    zigbee2mqttManager.zigbee2mqttStarting = true;
    // EXECUTE
    const wait = follow(zigbee2mqttManager.waitForZigbee2mqtt());
    await clock.tickAsync(1000);
    zigbee2mqttManager.z2mContainerError = { code: 'ADAPTER_NO_RESPONSE', message: null };
    await clock.tickAsync(500);
    // ASSERT
    expect(wait.settled).to.equal(true);
    expect(wait.error.message).to.equal('Zigbee2mqtt failed to start: ADAPTER_NO_RESPONSE');
    expect(wait.error.installationError).to.deep.equal({ code: 'ADAPTER_NO_RESPONSE', message: null });
    // Marked as failed by finishInstallation
    expect(connectAdapterPhase().state).to.equal('running');
  });

  it('should fail with the raw error of the logs when it is not a known one', async () => {
    // PREPARE
    zigbee2mqttManager.z2mContainerError = { code: null, message: 'Error: Error while opening socket' };
    // EXECUTE
    const promise = zigbee2mqttManager.waitForZigbee2mqtt();
    // ASSERT
    const error = await promise.catch((e) => e);
    expect(error.message).to.equal('Zigbee2mqtt failed to start: Error: Error while opening socket');
    expect(error.installationError).to.deep.equal({ code: null, message: 'Error: Error while opening socket' });
  });

  it('should fail at once when the dongle is not plugged in, as nothing was started', async () => {
    // PREPARE
    zigbee2mqttManager.usbConfigured = false;
    // EXECUTE
    const error = await zigbee2mqttManager.waitForZigbee2mqtt().catch((e) => e);
    // ASSERT
    expect(error.installationError).to.deep.equal({ code: 'DONGLE_NOT_FOUND', message: null });
    // Marked as failed by finishInstallation
    expect(connectAdapterPhase().state).to.equal('running');
  });

  it('should fail at once when the dongle is not plugged in, even with the MQTT client of a previous run', async () => {
    // PREPARE
    zigbee2mqttManager.usbConfigured = false;
    // Still connected to the Zigbee2mqtt of the dongle configured before, which answers
    zigbee2mqttManager.mqttClient = {};
    zigbee2mqttManager.zigbee2mqttConnected = true;
    // EXECUTE
    const error = await zigbee2mqttManager.waitForZigbee2mqtt().catch((e) => e);
    // ASSERT
    expect(error.installationError).to.deep.equal({ code: 'DONGLE_NOT_FOUND', message: null });
  });

  it('should wait for Zigbee2mqtt behind a network coordinator', async () => {
    // PREPARE
    zigbee2mqttManager.usbConfigured = false;
    zigbee2mqttManager.networkAdapterConfigured = true;
    zigbee2mqttManager.zigbee2mqttConnected = true;
    // EXECUTE
    await zigbee2mqttManager.waitForZigbee2mqtt();
    // ASSERT
    expect(connectAdapterPhase().state).to.equal('done');
  });

  describe('with an external broker', () => {
    beforeEach(() => {
      // Gladys installs nothing
      zigbee2mqttManager.usbConfigured = false;
      zigbee2mqttManager.getConfiguration = fake.resolves({ mqttMode: 'external' });
    });

    it('should end once Gladys is connected to the broker, without waiting for Zigbee2mqtt', async () => {
      // EXECUTE
      const wait = follow(zigbee2mqttManager.waitForZigbee2mqtt());
      await clock.tickAsync(1000);
      expect(wait.settled).to.equal(false);
      zigbee2mqttManager.gladysConnected = true;
      await clock.tickAsync(500);
      // ASSERT
      // The status tells whether Zigbee2mqtt answers
      expect(zigbee2mqttManager.zigbee2mqttConnected).to.equal(false);
      expect(wait).to.deep.equal({ settled: true, error: null });
      expect(connectAdapterPhase().state).to.equal('done');
    });

    it('should fail as soon as Gladys fails to connect to the broker', async () => {
      // EXECUTE
      const wait = follow(zigbee2mqttManager.waitForZigbee2mqtt());
      await clock.tickAsync(1000);
      zigbee2mqttManager.mqttConnectionError = { code: 'BROKER_UNREACHABLE', message: null };
      await clock.tickAsync(500);
      // ASSERT
      expect(wait.settled).to.equal(true);
      expect(wait.error.installationError).to.deep.equal({ code: 'BROKER_UNREACHABLE', message: null });
    });

    it('should fail when Gladys is not connected to the broker in time, without telling why', async () => {
      // PREPARE
      zigbee2mqttManager.zigbee2mqttStartingTimeoutInMs = 60000;
      // EXECUTE
      const wait = follow(zigbee2mqttManager.waitForZigbee2mqtt());
      await clock.tickAsync(59500);
      expect(wait.settled).to.equal(false);
      await clock.tickAsync(500);
      // ASSERT
      expect(wait.settled).to.equal(true);
      expect(wait.error.installationError).to.deep.equal({ code: 'BROKER_UNREACHABLE', message: null });
    });
  });

  it('should fail as soon as Gladys fails to connect to the broker', async () => {
    // EXECUTE
    const wait = follow(zigbee2mqttManager.waitForZigbee2mqtt());
    await clock.tickAsync(1000);
    zigbee2mqttManager.mqttConnectionError = { code: 'BAD_CREDENTIALS', message: null };
    await clock.tickAsync(500);
    // ASSERT
    expect(wait.settled).to.equal(true);
    expect(wait.error.installationError).to.deep.equal({ code: 'BAD_CREDENTIALS', message: null });
  });

  it('should fail when Zigbee2mqtt does not answer in time', async () => {
    // PREPARE
    zigbee2mqttManager.zigbee2mqttStartingTimeoutInMs = 60000;
    // EXECUTE
    const wait = follow(zigbee2mqttManager.waitForZigbee2mqtt());
    await clock.tickAsync(59500);
    expect(wait.settled).to.equal(false);
    await clock.tickAsync(500);
    // ASSERT
    expect(wait.settled).to.equal(true);
    expect(wait.error.installationError).to.deep.equal({ code: 'NO_ANSWER', message: null });
  });

  it('should wait longer while Zigbee2mqtt starts again, as after the ezsp fallback', async () => {
    // PREPARE
    zigbee2mqttManager.zigbee2mqttStartingTimeoutInMs = 60000;
    zigbee2mqttManager.zigbee2mqttStarting = true;
    // EXECUTE
    const wait = follow(zigbee2mqttManager.waitForZigbee2mqtt());
    await clock.tickAsync(90000);
    expect(wait.settled).to.equal(false);
    // The startup window of the new run is over
    zigbee2mqttManager.zigbee2mqttStarting = false;
    await clock.tickAsync(500);
    // ASSERT
    expect(wait.settled).to.equal(true);
    expect(wait.error.installationError).to.deep.equal({ code: 'NO_ANSWER', message: null });
  });
});
