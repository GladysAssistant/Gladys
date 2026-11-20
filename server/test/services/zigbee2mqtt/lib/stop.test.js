const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const logger = require('../../../../utils/logger');
const { ConflictError, PlatformNotCompatible } = require('../../../../utils/coreErrors');
const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

// Our own containers, each with the id of its name
const ownContainers = (options) =>
  Promise.resolve([
    {
      id: options.filters.name[0],
      name: `/${options.filters.name[0]}`,
      labels: { 'io.gladysassistant.service': 'zigbee2mqtt' },
    },
  ]);

describe('zigbee2mqtt stop', () => {
  let zigbee2mqttManager;
  let gladys;
  let mqttClient;
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers(new Date('2026-11-17T08:00:00.000Z'));
    gladys = {
      job: {
        wrapper: (type, func) => async () => func(),
      },
      event: {
        emit: fake(),
      },
      variable: {
        setValue: fake.resolves(null),
        getValue: fake.resolves('local'),
      },
      system: {
        getContainers: fake(ownContainers),
        updateContainer: fake.resolves(null),
        stopContainer: fake.resolves(null),
      },
    };
    mqttClient = {
      end: fake(),
      removeAllListeners: fake(),
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    zigbee2mqttManager.mqttClient = mqttClient;
    zigbee2mqttManager.gladysConnected = true;
    zigbee2mqttManager.mqttRunning = true;
    zigbee2mqttManager.zigbee2mqttRunning = true;
    zigbee2mqttManager.zigbee2mqttConnected = true;
    zigbee2mqttManager.zigbee2mqttStarting = true;
    zigbee2mqttManager.startingTimer = setTimeout(() => {}, 120000);
    zigbee2mqttManager.z2mContainerError = { code: 'NO_ANSWER', message: null };
    zigbee2mqttManager.backupScheduledJob = { cancel: fake() };
    zigbee2mqttManager.stopWatchingDongle = fake();
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  it('should remember the stop, disconnect Gladys and stop the containers, kept', async () => {
    const { backupScheduledJob } = zigbee2mqttManager;
    // EXECUTE
    await zigbee2mqttManager.stop();
    // ASSERT
    assert.calledOnceWithExactly(gladys.variable.setValue, 'Z2M_STOPPED', '2026-11-17T08:00:00.000Z', serviceId);
    expect(zigbee2mqttManager.stopped).to.equal(true);
    expect(zigbee2mqttManager.stoppedAt).to.equal('2026-11-17T08:00:00.000Z');
    // Disconnected, nothing that follows Zigbee2mqtt left
    assert.calledOnce(mqttClient.end);
    expect(zigbee2mqttManager.mqttClient).to.equal(null);
    assert.calledOnce(backupScheduledJob.cancel);
    assert.calledOnce(zigbee2mqttManager.stopWatchingDongle);
    // Not started again by Docker when the machine restarts, Zigbee2mqtt stopped before its broker
    assert.calledWithExactly(gladys.system.updateContainer, 'gladys-z2m-zigbee2mqtt', {
      RestartPolicy: { Name: 'no' },
    });
    assert.calledWithExactly(gladys.system.updateContainer, 'gladys-z2m-mqtt', { RestartPolicy: { Name: 'no' } });
    assert.calledTwice(gladys.system.stopContainer);
    assert.calledWithExactly(gladys.system.stopContainer.firstCall, 'gladys-z2m-zigbee2mqtt');
    assert.calledWithExactly(gladys.system.stopContainer.secondCall, 'gladys-z2m-mqtt');
    expect(zigbee2mqttManager.mqttRunning).to.equal(false);
    expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(false);
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.equal(false);
    expect(zigbee2mqttManager.zigbee2mqttStarting).to.equal(false);
    expect(zigbee2mqttManager.startingTimer).to.equal(null);
    expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
    expect(zigbee2mqttManager.runningOperations).to.equal(0);
    assert.calledWithMatch(gladys.event.emit, 'websocket.send-all', {
      payload: { stopped: true, stoppedAt: '2026-11-17T08:00:00.000Z', zigbee2mqttConnected: false },
    });
  });

  it('should only disconnect from an external broker when Gladys does not run in Docker', async () => {
    // PREPARE
    gladys.system.getContainers = fake.rejects(new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER'));
    // EXECUTE
    await zigbee2mqttManager.stop();
    // ASSERT
    expect(zigbee2mqttManager.stopped).to.equal(true);
    assert.calledOnce(mqttClient.end);
    assert.notCalled(gladys.system.updateContainer);
    assert.notCalled(gladys.system.stopContainer);
    assert.calledWithMatch(gladys.event.emit, 'websocket.send-all', { payload: { stopped: true } });
  });

  it('should stop the containers even when Docker refuses their restart policy', async () => {
    // PREPARE
    gladys.system.updateContainer = fake.rejects(new Error('docker refuses'));
    sinon.stub(logger, 'warn');
    // EXECUTE
    await zigbee2mqttManager.stop();
    // ASSERT
    assert.calledTwice(gladys.system.stopContainer);
    assert.calledWithMatch(logger.warn, 'Zigbee2mqtt: restart policy of gladys-z2m-zigbee2mqtt not set to "no":');
  });

  it('should tell that joining is closed, forget the devices seen joining, and ignore the logs of the run it stops', async () => {
    // PREPARE
    zigbee2mqttManager.z2mPermitJoin = true;
    zigbee2mqttManager.z2mPermitJoinEnd = Date.now() + 10000;
    zigbee2mqttManager.pairingDevices = { '0x01': { ieee_address: '0x01', status: 'joined' } };
    zigbee2mqttManager.z2mRun = 2;
    // EXECUTE
    await zigbee2mqttManager.stop();
    // ASSERT
    expect(zigbee2mqttManager.z2mPermitJoin).to.equal(false);
    expect(zigbee2mqttManager.z2mPermitJoinEnd).to.equal(null);
    expect(zigbee2mqttManager.pairingDevices).to.deep.equal({});
    assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', {
      type: 'zigbee2mqtt.permit-join',
      payload: { allowed: false, remainingSeconds: null },
    });
    assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', {
      type: 'zigbee2mqtt.pairing',
      payload: [],
    });
    expect(zigbee2mqttManager.z2mRun).to.equal(3);
  });

  it('should no longer tell Zigbee2mqtt answering when a container fails to stop', async () => {
    // PREPARE
    gladys.system.stopContainer = fake((id) =>
      id === 'gladys-z2m-mqtt' ? Promise.reject(new Error('docker timeout')) : Promise.resolve(null),
    );
    // EXECUTE
    await expect(zigbee2mqttManager.stop()).to.be.rejectedWith('docker timeout');
    // ASSERT
    expect(zigbee2mqttManager.stopped).to.equal(true);
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.equal(false);
    expect(zigbee2mqttManager.zigbee2mqttStarting).to.equal(false);
    assert.calledWithMatch(gladys.event.emit, 'websocket.send-all', {
      payload: { stopped: true, zigbee2mqttConnected: false },
    });
    expect(zigbee2mqttManager.runningOperations).to.equal(0);
  });

  it('should only disconnect from an external broker, without container', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([]);
    // EXECUTE
    await zigbee2mqttManager.stop();
    // ASSERT
    assert.calledOnce(mqttClient.end);
    assert.notCalled(gladys.system.updateContainer);
    assert.notCalled(gladys.system.stopContainer);
    expect(zigbee2mqttManager.stopped).to.equal(true);
  });

  it('should only disconnect from an external broker, leaving the containers of ours running', async () => {
    // PREPARE: a former local installation left them (see the spec, L)
    gladys.variable.getValue = fake.resolves('external');
    // EXECUTE
    await zigbee2mqttManager.stop();
    // ASSERT
    assert.calledOnceWithExactly(gladys.variable.getValue, 'Z2M_MQTT_MODE', serviceId);
    assert.calledOnce(mqttClient.end);
    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.system.updateContainer);
    assert.notCalled(gladys.system.stopContainer);
    expect(zigbee2mqttManager.stopped).to.equal(true);
    expect(zigbee2mqttManager.runningOperations).to.equal(0);
  });

  it('should fail the stop when Docker cannot list the containers, which may still run', async () => {
    // PREPARE
    gladys.system.getContainers = fake.rejects(new Error('docker down'));
    // EXECUTE
    await expect(zigbee2mqttManager.stop()).to.be.rejectedWith('docker down');
    // ASSERT
    assert.notCalled(gladys.system.stopContainer);
    expect(zigbee2mqttManager.stopped).to.equal(true);
    expect(zigbee2mqttManager.runningOperations).to.equal(0);
  });

  it('should refuse to stop while an installation runs, and remember nothing', async () => {
    // PREPARE
    zigbee2mqttManager.startInstallation('install');
    // EXECUTE
    await expect(zigbee2mqttManager.stop()).to.be.rejectedWith(ConflictError);
    // ASSERT
    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(gladys.system.stopContainer);
    expect(zigbee2mqttManager.stopped).to.equal(false);
  });

  it('should leave the integration free when the stop cannot be saved', async () => {
    // PREPARE
    gladys.variable.setValue = fake.rejects(new Error('database locked'));
    // EXECUTE
    await expect(zigbee2mqttManager.stop()).to.be.rejectedWith('database locked');
    // ASSERT
    expect(zigbee2mqttManager.runningOperations).to.equal(0);
    expect(zigbee2mqttManager.stopped).to.equal(false);
    assert.notCalled(gladys.system.stopContainer);
  });
});
