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
      mqttContainerName: 'gladys-z2m-mqtt',
      z2mContainerName: 'gladys-z2m-zigbee2mqtt',
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
      mqttContainerName: 'gladys-z2m-mqtt',
      z2mContainerName: 'gladys-z2m-zigbee2mqtt',
    });
  });

  it('not updated, found both containers -> it should remove only our exact-name containers and update config', async () => {
    // PREPARE - each lookup returns the container matching exactly the queried name
    gladys.system.getContainers = fake(async ({ filters }) => [
      { id: `id-${filters.name[0]}`, name: `/${filters.name[0]}` },
    ]);
    const config = {
      dockerMqttVersion: 'BAD_REVISION',
      dockerZ2mVersion: 'BAD_REVISION',
      mqttContainerName: 'gladys-z2m-mqtt',
      z2mContainerName: 'gladys-z2m-zigbee2mqtt',
    };
    // EXECUTE
    await zigbee2mqttManager.checkForContainerUpdates(config);
    // ASSERT
    assert.calledTwice(gladys.system.getContainers);
    assert.calledTwice(gladys.system.removeContainer);
    assert.calledWithExactly(gladys.system.removeContainer, 'id-gladys-z2m-mqtt', { force: true });
    assert.calledWithExactly(gladys.system.removeContainer, 'id-gladys-z2m-zigbee2mqtt', { force: true });

    expect(config).deep.equal({
      dockerMqttVersion: DEFAULT.DOCKER_MQTT_VERSION,
      dockerZ2mVersion: DEFAULT.DOCKER_Z2M_VERSION,
      mqttContainerName: 'gladys-z2m-mqtt',
      z2mContainerName: 'gladys-z2m-zigbee2mqtt',
    });
  });

  it('a user container matching only as substring must be ignored (never removed)', async () => {
    // PREPARE - Docker filters match by substring, only the exact name is ours
    gladys.system.getContainers = fake.resolves([{ id: 'user-container', name: '/gladys-z2m-mqtt-old' }]);
    const config = {
      dockerMqttVersion: 'BAD_REVISION',
      dockerZ2mVersion: 'BAD_REVISION',
      mqttContainerName: 'gladys-z2m-mqtt',
      z2mContainerName: 'gladys-z2m-zigbee2mqtt',
    };
    // EXECUTE
    await zigbee2mqttManager.checkForContainerUpdates(config);
    // ASSERT - the substring container is never removed
    assert.notCalled(gladys.system.removeContainer);
  });

  it('should remove the resolved (suffixed) container on a version bump', async () => {
    // PREPARE - names were resolved to suffixed values because of a foreign homonym
    gladys.system.getContainers = fake(async ({ filters }) => [
      { id: `id-${filters.name[0]}`, name: `/${filters.name[0]}` },
    ]);
    const config = {
      dockerMqttVersion: 'BAD_REVISION',
      dockerZ2mVersion: 'BAD_REVISION',
      mqttContainerName: 'gladys-z2m-mqtt-ab12cd3',
      z2mContainerName: 'gladys-z2m-zigbee2mqtt-ef45gh6',
    };
    // EXECUTE
    await zigbee2mqttManager.checkForContainerUpdates(config);
    // ASSERT - only the resolved names are looked up and removed
    assert.calledWithExactly(gladys.system.getContainers, {
      all: true,
      filters: { name: ['gladys-z2m-mqtt-ab12cd3'] },
    });
    assert.calledWithExactly(gladys.system.removeContainer, 'id-gladys-z2m-mqtt-ab12cd3', { force: true });
    assert.calledWithExactly(gladys.system.removeContainer, 'id-gladys-z2m-zigbee2mqtt-ef45gh6', { force: true });
  });

  it('already updated -> it should do nothing', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([{ id: 'container-id', name: '/gladys-z2m-mqtt' }]);
    const config = {
      dockerMqttVersion: DEFAULT.DOCKER_MQTT_VERSION,
      dockerZ2mVersion: DEFAULT.DOCKER_Z2M_VERSION,
      mqttContainerName: 'gladys-z2m-mqtt',
      z2mContainerName: 'gladys-z2m-zigbee2mqtt',
    };
    // EXECUTE
    await zigbee2mqttManager.checkForContainerUpdates(config);
    // ASSERT
    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.system.removeContainer);

    expect(config).deep.equal({
      dockerMqttVersion: DEFAULT.DOCKER_MQTT_VERSION,
      dockerZ2mVersion: DEFAULT.DOCKER_Z2M_VERSION,
      mqttContainerName: 'gladys-z2m-mqtt',
      z2mContainerName: 'gladys-z2m-zigbee2mqtt',
    });
  });
});
