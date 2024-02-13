const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;

const ZwaveJSUIHandler = require('../../../../services/zwavejs-ui/lib');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {
  variable: {
    getValue: fake.resolves('toto'),
  },
  event: {
    emit: fake.returns(null),
  },
};

describe('zwaveJSUIHandler.publish', () => {
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
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, mqttLibrary, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    zwaveJSUIHandler.publish('toto', 'message');
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
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, mqttLibrary, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    zwaveJSUIHandler.publish('toto', 'mesage');
  });
  it('should not publish MQTT message', async () => {
    const mqttLibrary = {
      connect: fake.returns(null),
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, mqttLibrary, serviceId);
    try {
      zwaveJSUIHandler.publish('toto', 'mesage');
    } catch (e) {
      expect(e).instanceOf(ServiceNotConfiguredError);

      return;
    }

    assert.fail();
  });
});
