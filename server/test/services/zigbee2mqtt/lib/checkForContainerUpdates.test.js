const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');
const { ConflictError } = require('../../../../utils/coreErrors');
const { DEFAULT } = require('../../../../services/zigbee2mqtt/lib/constants');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

// Our own container, named after the requested filter
const ownContainer = (options) =>
  Promise.resolve([
    {
      id: 'container-id',
      name: `/${options.filters.name[0]}`,
      labels: { 'io.gladysassistant.service': 'zigbee2mqtt' },
    },
  ]);

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
    gladys.system.getContainers = fake(ownContainer);
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
    gladys.system.getContainers = fake(ownContainer);
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

  it('not updated, only containers with a similar name -> it should not remove them', async () => {
    // PREPARE
    gladys.system.getContainers = fake((options) =>
      Promise.resolve([{ id: 'user-container', name: `/${options.filters.name[0]}-old` }]),
    );
    const config = {
      dockerMqttVersion: 'BAD_REVISION',
      dockerZ2mVersion: 'BAD_REVISION',
    };
    // EXECUTE
    await zigbee2mqttManager.checkForContainerUpdates(config);
    // ASSERT
    assert.calledTwice(gladys.system.getContainers);
    assert.notCalled(gladys.system.removeContainer);
    expect(config).deep.equal({
      dockerMqttVersion: DEFAULT.DOCKER_MQTT_VERSION,
      dockerZ2mVersion: DEFAULT.DOCKER_Z2M_VERSION,
    });
  });

  it('not updated, our name is taken by a user container -> it should fail without removing it', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([{ id: 'user-container', name: '/gladys-z2m-mqtt', image: 'nginx' }]);
    gladys.system.inspectContainer = fake.resolves({ Config: { Image: 'nginx:alpine' } });
    const config = {
      dockerMqttVersion: 'BAD_REVISION',
      dockerZ2mVersion: 'BAD_REVISION',
    };
    // EXECUTE
    let error;
    try {
      await zigbee2mqttManager.checkForContainerUpdates(config);
    } catch (e) {
      error = e;
    }
    // ASSERT
    expect(error).to.be.instanceOf(ConflictError);
    assert.notCalled(gladys.system.removeContainer);
    expect(config.dockerMqttVersion).to.equal('BAD_REVISION');
  });

  it('not updated, z2m name taken by a user container -> nothing is removed, not even our MQTT', async () => {
    // PREPARE
    gladys.system.getContainers = fake((options) => {
      const [name] = options.filters.name;
      if (name === 'gladys-z2m-mqtt') {
        return Promise.resolve([
          { id: 'our-mqtt', name: '/gladys-z2m-mqtt', labels: { 'io.gladysassistant.service': 'zigbee2mqtt' } },
        ]);
      }
      return Promise.resolve([{ id: 'user-container', name: `/${name}`, image: 'nginx:alpine' }]);
    });
    gladys.system.inspectContainer = fake.resolves({ Config: { Image: 'nginx:alpine' } });
    const config = {
      dockerMqttVersion: 'BAD_REVISION',
      dockerZ2mVersion: 'BAD_REVISION',
    };
    // EXECUTE
    let error;
    try {
      await zigbee2mqttManager.checkForContainerUpdates(config);
    } catch (e) {
      error = e;
    }
    // ASSERT
    expect(error).to.be.instanceOf(ConflictError);
    assert.calledTwice(gladys.system.getContainers);
    assert.notCalled(gladys.system.removeContainer);
    expect(config).deep.equal({
      dockerMqttVersion: 'BAD_REVISION',
      dockerZ2mVersion: 'BAD_REVISION',
    });
  });
});
