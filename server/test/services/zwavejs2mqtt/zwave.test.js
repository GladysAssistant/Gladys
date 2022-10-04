const { expect } = require('chai');
const EventEmitter = require('events');
const { assert, fake } = require('sinon');

const Zwavejs2mqttService = require('../../../services/zwavejs2mqtt/index');

const ZWAVEJS2MQTT_SERVICE_ID = 'ZWAVEJS2MQTT_SERVICE_ID';
const DRIVER_PATH = 'DRIVER_PATH';

const gladys = {
  event: new EventEmitter(),
  service: {
    getService: (name) =>
      fake.returns({
        list: fake.resolves([DRIVER_PATH]),
      }),
  },
  variable: {
    setValue: (name) => Promise.resolve(name === DRIVER_PATH ? DRIVER_PATH : null),
    getValue: (name) => Promise.resolve(name === DRIVER_PATH ? DRIVER_PATH : null),
  },
};

describe('zwavejs2mqttService', () => {
  const zwavejs2mqttService = Zwavejs2mqttService(gladys, ZWAVEJS2MQTT_SERVICE_ID);
  it('should have controllers', () => {
    expect(zwavejs2mqttService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should start service', async () => {
    await zwavejs2mqttService.start();
    assert.calledThrice(zwavejs2mqttService.device.driver.on);
    expect(zwavejs2mqttService.device.mqttConnected).to.equal(true);
  });
  it('should stop service', async () => {
    await zwavejs2mqttService.stop();
    expect(zwavejs2mqttService.device.mqttConnected).to.equal(false);
  });
});
