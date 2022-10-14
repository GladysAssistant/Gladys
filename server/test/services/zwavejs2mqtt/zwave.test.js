const sinon = require('sinon');

const { expect } = require('chai');

const { fake } = sinon;

const Zwavejs2mqttService = require('../../../services/zwavejs2mqtt/index');

const ZWAVEJS2MQTT_SERVICE_ID = 'ZWAVEJS2MQTT_SERVICE_ID';
const DRIVER_PATH = 'DRIVER_PATH';

const event = {
  emit: fake.resolves(null),
};

const gladys = {
  event,
  service: {
    getService: () => {
      return {
        list: () => Promise.resolve([DRIVER_PATH]),
      };
    },
  },
  variable: {
    getValue: fake.resolves(true),
    setValue: fake.resolves(true),
  },
  system: {
    isDocker: fake.resolves(true),
  },
  installMqttContainer: fake.returns(true),
  installZ2mContainer: fake.returns(true),
};

describe('zwavejs2mqttService', () => {
  const zwavejs2mqttService = Zwavejs2mqttService(gladys, ZWAVEJS2MQTT_SERVICE_ID);

  beforeEach(() => {
    sinon.reset();
  });

  it('should have controllers', () => {
    expect(zwavejs2mqttService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should start service', async () => {
    gladys.variable.getValue = sinon.stub();
    gladys.variable.getValue
      .onFirstCall() // EXTERNAL_ZWAVEJS2MQTT
      .resolves('1')
      .onSecondCall() // DRIVER_PATH
      .resolves(DRIVER_PATH);
    await zwavejs2mqttService.start();
    expect(zwavejs2mqttService.device.mqttConnected).to.equal(true);
  });
  it('should stop service', async () => {
    await zwavejs2mqttService.stop();
    expect(zwavejs2mqttService.device.mqttConnected).to.equal(false);
  });
});
