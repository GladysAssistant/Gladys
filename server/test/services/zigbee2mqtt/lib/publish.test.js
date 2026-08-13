const sinon = require('sinon').createSandbox();
const { expect } = require('chai');
const proxyquire = require('proxyquire');

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
  it('should log the topic and the message published', () => {
    // Stubbing the shared logger singleton is racy under mocha --parallel: test files
    // using proxyquire.noPreserveCache() evict utils/logger from the require cache, so
    // depending on the worker's file order this file and the already-cached publish.js
    // can hold two different logger instances, and a stub on the test's instance never
    // sees the call. Injecting the stub through proxyquire pins the instance instead.
    const debugStub = sinon.stub();
    const { publish } = proxyquire('../../../../services/zigbee2mqtt/lib/publish', {
      '../../../utils/logger': { debug: debugStub },
    });
    const mqttClient = {
      publish: fake.returns(null),
    };
    publish.call({ mqttClient }, 'zigbee2mqtt/my-device/set', '{"state":"ON"}');

    assert.calledWith(mqttClient.publish, 'zigbee2mqtt/my-device/set', '{"state":"ON"}', undefined, sinon.match.func);
    assert.calledWith(debugStub, sinon.match('zigbee2mqtt/my-device/set').and(sinon.match('{"state":"ON"}')));
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
