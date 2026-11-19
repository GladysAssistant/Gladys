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

  it('should restart Zigbee2mqtt alone when there is no broker of ours', async () => {
    // PREPARE
    zigbee2mqttManager.gladysConnected = false;
    gladys.system.getContainers = fake((options) =>
      options.filters.name[0] === 'gladys-z2m-mqtt' ? Promise.resolve([]) : ownContainers(options),
    );
    // EXECUTE
    await zigbee2mqttManager.restart();
    // ASSERT
    assert.notCalled(gladys.system.restartContainer);
    assert.calledOnce(zigbee2mqttManager.restartZ2mContainer);
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

  it('should refuse to restart without a Zigbee2mqtt container of ours', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([]);
    // EXECUTE
    await expect(zigbee2mqttManager.restart()).to.be.rejectedWith(BadParameters, 'no container to restart');
    // ASSERT
    assert.notCalled(zigbee2mqttManager.restartZ2mContainer);
  });

  it('should refuse to restart when Gladys does not run in Docker, without container of ours', async () => {
    // PREPARE
    gladys.system.getContainers = fake.rejects(new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER'));
    // EXECUTE
    await expect(zigbee2mqttManager.restart()).to.be.rejectedWith(BadParameters, 'no container to restart');
    // ASSERT
    assert.notCalled(zigbee2mqttManager.restartZ2mContainer);
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
