const { assert } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;
const EventEmitter = require('events');
const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const eventMqtt = new EventEmitter();
const event = {
  emit: fake.resolves(null),
};
const mqtt = Object.assign(eventMqtt, {
  subscribe: fake.resolves(null),
});
const mqttLibrary = {
  connect: fake.returns(mqtt),
};
const gladys = {
  event,
  variable: {
    setValue: fake.resolves(true),
  },
  system: {
    getContainerMounts: fake.resolves([]),
  },
};

describe('zigbee2mqtt basePath', () => {
  // PREPARE
  const zigbee2mqttManager = new Zigbee2mqttManager(gladys, mqttLibrary, serviceId);

  beforeEach(() => {
    sinon.reset();
  });
  it('should return default basePath because no mount', async () => {
    delete process.env.SQLITE_FILE_PATH;
    zigbee2mqttManager.gladys.system.getContainerMounts = fake.resolves([]);
    const result = await zigbee2mqttManager.basePath();
    return assert.deepEqual(result, {
      basePathOnHost: '/var/lib/gladysassistant',
      basePathOnContainer: '/var/lib/gladysassistant',
    });
  });
  it('should return basePath from mount without SQLITE_FILE_PATH env variable', async () => {
    delete process.env.SQLITE_FILE_PATH;
    zigbee2mqttManager.gladys.system.getContainerMounts = fake.resolves([
      {
        Source: '/var/lib/dir_on_host',
        Destination: '/var/lib/gladysassistant',
      },
    ]);
    const result = await zigbee2mqttManager.basePath();
    return assert.deepEqual(result, {
      basePathOnHost: '/var/lib/dir_on_host',
      basePathOnContainer: '/var/lib/gladysassistant',
    });
  });
  it('should return basePath from mount with SQLITE_FILE_PATH env variable', async () => {
    process.env.SQLITE_FILE_PATH = '/var/lib/dummy_directory/gladys.db';
    zigbee2mqttManager.gladys.system.getContainerMounts = fake.resolves([
      {
        Source: '/var/lib/dir_on_host',
        Destination: '/var/lib/dummy_directory',
      },
    ]);
    const result = await zigbee2mqttManager.basePath();
    return assert.deepEqual(result, {
      basePathOnHost: '/var/lib/dir_on_host',
      basePathOnContainer: '/var/lib/dummy_directory',
    });
  });
});
