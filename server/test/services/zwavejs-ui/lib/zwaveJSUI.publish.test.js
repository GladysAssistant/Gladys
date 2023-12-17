const sinon = require('sinon');

const { assert, fake } = sinon;
const { assert: chaiAssert } = require('chai');

const ZwaveJSUIHandler = require('../../../../services/zwavejs-ui/lib');

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

  it('should publish MQTT message', async () => {
    const mqttClient = {
      publish: fake.returns(null),
    };
    const mqttLibrary = {
      connect: fake.returns(mqttClient),
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, mqttLibrary, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    await zwaveJSUIHandler.publish('toto', 'message');
    assert.calledWith(mqttClient.publish, 'toto', 'message');
  });
  it('should publish MQTT message with error', async () => {
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
    await zwaveJSUIHandler.publish('toto', 'mesage');
  });
  it('should not publish MQTT message', async () => {
    const mqttClient = {
      publish: fake.returns(null),
    };
    const mqttLibrary = {
      connect: fake.returns(mqttClient),
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, mqttLibrary, serviceId);
    await chaiAssert.isRejected(zwaveJSUIHandler.publish('toto', 'mesage'));
  });
});
