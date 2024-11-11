const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const gladys = {
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
  variable: {
    getValue: fake.resolves('toto'),
  },
  event: {
    emit: fake.returns(null),
  },
};

describe('zigbee2mqttManager.publish', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should publish MQTT message', () => {
    const mqttClient = {
      publish: fake.returns(null),
    };
    const mqttLibrary = {
      connect: fake.returns(mqttClient),
    };
    const zigbee2mqttManager = new Zigbee2mqttManager(gladys, mqttLibrary, serviceId);
    zigbee2mqttManager.mqttClient = mqttClient;
    zigbee2mqttManager.publish('toto', 'message');
    assert.calledWith(mqttClient.publish, 'toto', 'message');
  });
  it('should publish MQTT message with error', () => {
    const mqttClient = {
      publish: (topic, message, random, cb) => {
        cb('toto');
      },
    };
    const mqttLibrary = {
      connect: fake.returns(mqttClient),
    };
    const zigbee2mqttManager = new Zigbee2mqttManager(gladys, mqttLibrary, serviceId);
    zigbee2mqttManager.mqttClient = mqttClient;
    zigbee2mqttManager.publish('toto', 'mesage');
  });
  it('should not publish MQTT message', async () => {
    const mqttLibrary = {
      connect: fake.returns(null),
    };
    const zigbee2mqttManager = new Zigbee2mqttManager(gladys, mqttLibrary, serviceId);
    try {
      zigbee2mqttManager.publish('toto', 'mesage');
    } catch (e) {
      expect(e).instanceOf(ServiceNotConfiguredError);

      return;
    }

    assert.fail();
  });
});
