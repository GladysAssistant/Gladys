const sinon = require('sinon');

const { assert, fake } = sinon;

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

describe('zwaveJSUIHandler.disconnect', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should disconnect MQTT broker', async () => {
    const mqttClient = {
      end: fake.returns(null),
      removeAllListeners: fake.returns(null),
      on: (event, cb) => {
        if (event === 'connect') {
          cb();
        }
      },
    };
    const mqttLibrary = {
      connect: fake.returns(mqttClient),
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, mqttLibrary, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    await zwaveJSUIHandler.disconnect();
    assert.called(mqttClient.end);
    assert.called(mqttClient.removeAllListeners);
  });
  it('should not disconnect MQTT broker (not connected)', async () => {
    const mqttClient = {
      end: fake.returns(null),
      removeAllListeners: fake.returns(null),
      on: (event, cb) => {
        if (event === 'connect') {
          cb();
        }
      },
    };
    const mqttLibrary = {
      connect: fake.returns(mqttClient),
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, mqttLibrary, serviceId);
    await zwaveJSUIHandler.disconnect();
    assert.notCalled(mqttClient.end);
    assert.notCalled(mqttClient.removeAllListeners);
  });
});
