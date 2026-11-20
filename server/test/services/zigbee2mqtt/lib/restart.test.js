const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const { BadParameters, ConflictError, PlatformNotCompatible } = require('../../../../utils/coreErrors');
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

describe('zigbee2mqtt restart', () => {
  let zigbee2mqttManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => async () => func(),
      },
      event: {
        emit: fake(),
      },
      system: {
        getContainers: fake(ownContainers),
        restartContainer: fake.resolves(null),
      },
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    zigbee2mqttManager.mqttClient = { publish: fake() };
    zigbee2mqttManager.gladysConnected = true;
    zigbee2mqttManager.restartZ2mContainer = fake.resolves(null);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should restart Zigbee2mqtt, followed as it starts', async () => {
    // EXECUTE
    await zigbee2mqttManager.restart();
    // ASSERT
    assert.calledOnceWithExactly(zigbee2mqttManager.restartZ2mContainer, 'gladys-z2m-zigbee2mqtt');
    // Gladys reaches its broker: left as is
    assert.notCalled(gladys.system.restartContainer);
    assert.calledWithMatch(gladys.event.emit, 'websocket.send-all');
    expect(zigbee2mqttManager.runningOperations).to.equal(0);
  });

  it('should restart the broker first when Gladys is not connected to it', async () => {
    // PREPARE
    zigbee2mqttManager.gladysConnected = false;
    // EXECUTE
    await zigbee2mqttManager.restart();
    // ASSERT
    assert.calledOnceWithExactly(gladys.system.restartContainer, 'gladys-z2m-mqtt');
    assert.callOrder(gladys.system.restartContainer, zigbee2mqttManager.restartZ2mContainer);
  });

  it('should start again through an installation when the broker of ours is missing', async () => {
    // PREPARE: Gladys lost its broker, whose container is gone
    zigbee2mqttManager.gladysConnected = false;
    gladys.system.getContainers = fake((options) =>
      options.filters.name[0] === 'gladys-z2m-mqtt' ? Promise.resolve([]) : ownContainers(options),
    );
    zigbee2mqttManager.start = fake(async () => {
      // Free again: start refuses while an operation runs
      expect(zigbee2mqttManager.runningOperations).to.equal(0);
    });
    // EXECUTE
    await zigbee2mqttManager.restart();
    // ASSERT
    assert.calledOnce(zigbee2mqttManager.start);
    assert.notCalled(gladys.system.restartContainer);
    assert.notCalled(zigbee2mqttManager.restartZ2mContainer);
  });

  it('should forget the failure being retried, the new run telling its own', async () => {
    // PREPARE
    zigbee2mqttManager.z2mContainerError = { code: 'ADAPTER_NO_RESPONSE', message: 'HOST_FATAL_ERROR' };
    zigbee2mqttManager.startInstallation('start');
    zigbee2mqttManager.finishInstallation(new Error('Zigbee2mqtt did not answer'));
    expect(zigbee2mqttManager.installation.state).to.equal('failed');
    // EXECUTE
    await zigbee2mqttManager.restart();
    // ASSERT
    expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
    expect(zigbee2mqttManager.installation.state).to.equal('idle');
    assert.calledOnce(zigbee2mqttManager.restartZ2mContainer);
  });

  it('should keep the failure when Docker refuses the restart, which changed nothing', async () => {
    // PREPARE
    const containerError = { code: 'ADAPTER_NO_RESPONSE', message: 'HOST_FATAL_ERROR' };
    zigbee2mqttManager.z2mContainerError = containerError;
    zigbee2mqttManager.startInstallation('start');
    zigbee2mqttManager.finishInstallation(new Error('Zigbee2mqtt did not answer'));
    zigbee2mqttManager.restartZ2mContainer = fake.rejects(new Error('docker refuses'));
    // EXECUTE
    await expect(zigbee2mqttManager.restart()).to.be.rejectedWith('docker refuses');
    // ASSERT
    expect(zigbee2mqttManager.z2mContainerError).to.equal(containerError);
    expect(zigbee2mqttManager.installation.state).to.equal('failed');
    expect(zigbee2mqttManager.runningOperations).to.equal(0);
    // Told: the status no longer says that it starts
    assert.calledWithMatch(gladys.event.emit, 'websocket.send-all', {
      payload: { zigbee2mqttStarting: false, z2mContainerError: containerError },
    });
  });

  it('should start again through an installation when Gladys has no client of the broker', async () => {
    // PREPARE: the last init failed before connecting
    zigbee2mqttManager.mqttClient = null;
    zigbee2mqttManager.gladysConnected = false;
    zigbee2mqttManager.start = fake.resolves(null);
    // EXECUTE
    await zigbee2mqttManager.restart();
    // ASSERT
    assert.calledOnce(zigbee2mqttManager.start);
    assert.notCalled(zigbee2mqttManager.restartZ2mContainer);
    assert.notCalled(gladys.system.restartContainer);
    expect(zigbee2mqttManager.runningOperations).to.equal(0);
  });

  it('should refuse to restart what the user stopped', async () => {
    // PREPARE
    zigbee2mqttManager.stopped = true;
    // EXECUTE
    await expect(zigbee2mqttManager.restart()).to.be.rejectedWith(BadParameters, 'start it instead');
    // ASSERT
    assert.notCalled(zigbee2mqttManager.restartZ2mContainer);
    expect(zigbee2mqttManager.runningOperations).to.equal(0);
  });

  it('should start again through an installation when the Zigbee2mqtt container is missing', async () => {
    // PREPARE: a change of dongle removed it, and its installation failed
    gladys.system.getContainers = fake.resolves([]);
    zigbee2mqttManager.start = fake.resolves(null);
    // EXECUTE
    await zigbee2mqttManager.restart();
    // ASSERT
    assert.calledOnce(zigbee2mqttManager.start);
    assert.notCalled(zigbee2mqttManager.restartZ2mContainer);
    expect(zigbee2mqttManager.runningOperations).to.equal(0);
  });

  it('should start again through an installation when Gladys does not run in Docker', async () => {
    // PREPARE
    gladys.system.getContainers = fake.rejects(new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER'));
    zigbee2mqttManager.start = fake.resolves(null);
    // EXECUTE
    await zigbee2mqttManager.restart();
    // ASSERT
    assert.calledOnce(zigbee2mqttManager.start);
    assert.notCalled(zigbee2mqttManager.restartZ2mContainer);
  });

  it('should leave the integration free when Docker cannot list the containers', async () => {
    // PREPARE
    gladys.system.getContainers = fake.rejects(new Error('docker down'));
    // EXECUTE
    await expect(zigbee2mqttManager.restart()).to.be.rejectedWith('docker down');
    // ASSERT
    assert.notCalled(zigbee2mqttManager.restartZ2mContainer);
    expect(zigbee2mqttManager.runningOperations).to.equal(0);
  });

  it('should refuse to restart while an installation runs', async () => {
    // PREPARE
    zigbee2mqttManager.startInstallation('install');
    // EXECUTE
    await expect(zigbee2mqttManager.restart()).to.be.rejectedWith(ConflictError);
    // ASSERT
    assert.notCalled(zigbee2mqttManager.restartZ2mContainer);
  });
});
