const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');
const { CONFIGURATION } = require('../../../../services/zigbee2mqtt/lib/constants');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const MQTT_NAME = 'gladys-z2m-mqtt';
const Z2M_NAME = 'gladys-z2m-zigbee2mqtt';

describe('zigbee2mqtt allocateContainerNames', () => {
  let zigbee2mqttManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => async () => func(),
      },
      system: {
        getContainers: fake.resolves([]),
      },
      variable: {
        setValue: fake.resolves(null),
      },
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should allocate the default names on a fresh install (no container yet)', async () => {
    const config = {};
    await zigbee2mqttManager.allocateContainerNames(config);
    expect(config.mqttContainerName).to.equal(MQTT_NAME);
    expect(config.z2mContainerName).to.equal(Z2M_NAME);
    // Both resolved names are persisted immediately, before any container is created
    assert.calledWith(gladys.variable.setValue, CONFIGURATION.MQTT_CONTAINER_NAME, MQTT_NAME, serviceId);
    assert.calledWith(gladys.variable.setValue, CONFIGURATION.Z2M_CONTAINER_NAME, Z2M_NAME, serviceId);
  });

  it('should adopt legacy healthy containers (image proves they are ours)', async () => {
    gladys.system.getContainers = fake(async ({ filters }) => {
      const name = filters.name[0];
      if (name === MQTT_NAME) {
        return [{ id: 'mqtt', name: `/${MQTT_NAME}`, image: 'eclipse-mosquitto:2.0.15' }];
      }
      if (name === Z2M_NAME) {
        return [{ id: 'z2m', name: `/${Z2M_NAME}`, image: 'koenkk/zigbee2mqtt:2.12.0' }];
      }
      return [];
    });
    const config = {};
    await zigbee2mqttManager.allocateContainerNames(config);
    expect(config.mqttContainerName).to.equal(MQTT_NAME);
    expect(config.z2mContainerName).to.equal(Z2M_NAME);
  });

  it('should allocate a suffixed name when a foreign container owns the default name', async () => {
    gladys.system.getContainers = fake(async ({ filters }) => {
      const name = filters.name[0];
      // The two default names are taken by foreign containers
      if (name === MQTT_NAME || name === Z2M_NAME) {
        return [{ id: 'foreign', name: `/${name}`, image: 'nginx:latest' }];
      }
      // Any suffixed candidate is free
      return [];
    });
    const config = {};
    await zigbee2mqttManager.allocateContainerNames(config);
    expect(config.mqttContainerName).to.match(/^gladys-z2m-mqtt-[a-z0-9]{7}$/);
    expect(config.z2mContainerName).to.match(/^gladys-z2m-zigbee2mqtt-[a-z0-9]{7}$/);
  });

  it('should ignore a user container that only matches as a substring', async () => {
    // Docker returns a substring match, but the exact-name lookup discards it,
    // so the default names are considered free and adopted as-is.
    gladys.system.getContainers = fake.resolves([{ id: 'user', name: '/gladys-z2m-mqtt-backup', image: 'nginx' }]);
    const config = {};
    await zigbee2mqttManager.allocateContainerNames(config);
    expect(config.mqttContainerName).to.equal(MQTT_NAME);
    expect(config.z2mContainerName).to.equal(Z2M_NAME);
  });

  it('should reuse already persisted names without any Docker lookup', async () => {
    const config = {
      mqttContainerName: 'gladys-z2m-mqtt-persisted',
      z2mContainerName: 'gladys-z2m-zigbee2mqtt-persisted',
    };
    await zigbee2mqttManager.allocateContainerNames(config);
    expect(config.mqttContainerName).to.equal('gladys-z2m-mqtt-persisted');
    expect(config.z2mContainerName).to.equal('gladys-z2m-zigbee2mqtt-persisted');
    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.variable.setValue);
  });

  it('should reject and persist nothing when the Docker lookup fails', async () => {
    gladys.system.getContainers = fake.rejects(new Error('docker socket unavailable'));
    const config = {};

    let error;
    try {
      await zigbee2mqttManager.allocateContainerNames(config);
    } catch (e) {
      error = e;
    }

    expect(error).to.be.an('error');
    expect(config.mqttContainerName).to.equal(undefined);
    assert.notCalled(gladys.variable.setValue);
  });
});
