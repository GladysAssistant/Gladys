const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');
const { DEFAULT } = require('../../../../services/zigbee2mqtt/lib/constants');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt checkForContainerUpdates', () => {
  // PREPARE
  let zigbee2mqttManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
      system: {
        getContainers: fake.resolves([]),
        removeContainer: fake.resolves(true),
      },
    };

    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('not updated, but no containers runnning -> it should only update config', async () => {
    // PREPARE
    const config = {
      dockerMqttVersion: 'BAD_REVISION',
      dockerZ2mVersion: 'BAD_REVISION',
    };
    // EXECUTE
    await zigbee2mqttManager.checkForContainerUpdates(config);
    // ASSERT
    assert.calledTwice(gladys.system.getContainers);
    assert.calledWithExactly(gladys.system.getContainers, {
      all: true,
      filters: { name: ['gladys-z2m-mqtt'] },
    });
    assert.calledWithExactly(gladys.system.getContainers, {
      all: true,
      filters: { name: ['gladys-z2m-zigbee2mqtt'] },
    });
    assert.notCalled(gladys.system.removeContainer);

    expect(config).deep.equal({
      dockerMqttVersion: DEFAULT.DOCKER_MQTT_VERSION,
      dockerZ2mVersion: DEFAULT.DOCKER_Z2M_VERSION,
    });
  });

  it('not updated, found both containers -> it should remove containers and update config', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([{ id: 'container-id' }]);
    const config = {
      dockerMqttVersion: 'BAD_REVISION',
      dockerZ2mVersion: 'BAD_REVISION',
    };
    // EXECUTE
    await zigbee2mqttManager.checkForContainerUpdates(config);
    // ASSERT
    assert.calledTwice(gladys.system.getContainers);
    assert.calledWithExactly(gladys.system.getContainers, {
      all: true,
      filters: { name: ['gladys-z2m-mqtt'] },
    });
    assert.calledWithExactly(gladys.system.getContainers, {
      all: true,
      filters: { name: ['gladys-z2m-zigbee2mqtt'] },
    });

    assert.calledTwice(gladys.system.removeContainer);
    assert.calledWithExactly(gladys.system.removeContainer, 'container-id', { force: true });

    expect(config).deep.equal({
      dockerMqttVersion: DEFAULT.DOCKER_MQTT_VERSION,
      dockerZ2mVersion: DEFAULT.DOCKER_Z2M_VERSION,
    });
  });

  it('already updated -> it should do nothing', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([{ id: 'container-id' }]);
    const config = {
      dockerMqttVersion: DEFAULT.DOCKER_MQTT_VERSION,
      dockerZ2mVersion: DEFAULT.DOCKER_Z2M_VERSION,
    };
    // EXECUTE
    await zigbee2mqttManager.checkForContainerUpdates(config);
    // ASSERT
    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.system.removeContainer);

    expect(config).deep.equal({
      dockerMqttVersion: DEFAULT.DOCKER_MQTT_VERSION,
      dockerZ2mVersion: DEFAULT.DOCKER_Z2M_VERSION,
    });
  });
});
