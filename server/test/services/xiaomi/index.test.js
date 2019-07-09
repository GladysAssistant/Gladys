const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');
const { assert, fake } = require('sinon');

const XiaomiService = proxyquire('../../../services/xiaomi/index', {});
const XiaomiManager = require('../../../services/xiaomi/lib');
const XiaomiController = require('../../../services/xiaomi/api/xiaomi.controller');

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

describe('Xioami events', () => {
  const xiaomiManager = new XiaomiManager(gladys, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
  it('shoud add temperature sensor', async () => {
    await xiaomiManager.addTemperatureSensor(12346, 21, 50, 10, 50);
  });
  it('shoud add motion sensor', async () => {
    await xiaomiManager.addMotionSensor(12346, true, 50);
  });
  it('shoud add magnet sensor', async () => {
    await xiaomiManager.addMagnetSensor(12346, true, 10);
  });
  it('shoud add th sensor', async () => {
    await xiaomiManager.addThSensor(12346, 21, 50, 50);
  });
});

describe('Xiaomi commands', () => {
  const xiaomiManager = new XiaomiManager(gladys, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
  it('should get temperature sensor', async () => {
    const temperatureSensor = await xiaomiManager.getTemperatureSensor();
    expect(temperatureSensor).to.be.instanceOf(Object);
  });
  it('should get motion sensor', async () => {
    const motionSensor = await xiaomiManager.getMotionSensor();
    expect(motionSensor).to.be.instanceOf(Object);
  });
  it('should get magnet sensor', async () => {
    const magnetSensor = await xiaomiManager.getMagnetSensor();
    expect(magnetSensor).to.be.instanceOf(Object);
  });
  it('should get th sensor', async () => {
    const thSensor = await xiaomiManager.getThSensor();
    expect(thSensor).to.be.instanceOf(Object);
  });
});

const res = {
  json: fake.returns(null),
};

describe('GET /api/v1/service/xiaomi/sensor', () => {
  it('should get all sensors', async () => {
    const xiaomiManager = new XiaomiManager(gladys, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    const req = {};
    const xiaomiController = XiaomiController(xiaomiManager);
    await xiaomiController['get /api/v1/service/xiaomi/sensor'].controller(req, res);
    assert.calledWith(res.json, {});
  });
});

describe('GET /api/v1/service/xiaomi/sensor/temperature', () => {
  it('should get all temperature sensors', async () => {
    const xiaomiManager = new XiaomiManager(gladys, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    const req = {};
    const xiaomiController = XiaomiController(xiaomiManager);
    await xiaomiController['get /api/v1/service/xiaomi/sensor'].controller(req, res);
    assert.calledWith(res.json, {});
  });
});

describe('GET /api/v1/service/xiaomi/sensor/motion', () => {
  it('should get all motion sensors', async () => {
    const xiaomiManager = new XiaomiManager(gladys, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    const req = {};
    const xiaomiController = XiaomiController(xiaomiManager);
    await xiaomiController['get /api/v1/service/xiaomi/sensor/motion'].controller(req, res);
    assert.calledWith(res.json, {});
  });
});

describe('GET /api/v1/service/xiaomi/sensor/magnet', () => {
  it('should get all magnet sensors', async () => {
    const xiaomiManager = new XiaomiManager(gladys, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    const req = {};
    const xiaomiController = XiaomiController(xiaomiManager);
    await xiaomiController['get /api/v1/service/xiaomi/sensor/magnet'].controller(req, res);
    assert.calledWith(res.json, {});
  });
})