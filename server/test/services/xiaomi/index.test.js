const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');

const XiaomiService = proxyquire('../../../services/xiaomi/index', {});

describe('XiaomiService', () => {
  const xiaomiService = XiaomiService();
  it('should have start function', () => {
    expect(xiaomiService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
  });
  it('should have stop function', () => {
    expect(xiaomiService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });
  it('should have controllers', () => {
    expect(xiaomiService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
});

describe('XiaomiService lifecycle', () => {
  const xiaomiService = XiaomiService();
  it('should start the service', async () => {
    await xiaomiService.start();
  });
  it('should stop the service', async () => {
    await xiaomiService.stop();
  });
});

const gladys = {
  event: new EventEmitter(),
  variable: {
    getValue: () => Promise.resolve('test'),
  },
};

describe('XiaomiService.controllers', () => {
  const xiaomiService = XiaomiService(gladys, 'be86c4db-489f-466c-aeea-1e262c4ee721');
  it('shoud add temperature sensor', async () => {
    await xiaomiService.controllers.addTemperatureSensor(12346, 21, 50, 10, 50);
  });
  it('shoud add motion sensor', async () => {
    await xiaomiService.controllers.addTemperatureSensor(12346, true, 50);
  });
  it('shoud add magnet sensor', async () => {
    await xiaomiService.controllers.addTemperatureSensor(12346, true, 10);
  });
  it('shoud add th sensor', async () => {
    await xiaomiService.controllers.addThSensor(12346, 21, 50, 50);
  });
});
