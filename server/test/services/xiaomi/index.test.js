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

const sensorResult = {
  12346: {
    external_id: 'xiaomi:12346',
    features: [{
  category: 'temperature-sensor',
  external_id: 'xiaomitemperature:12346:decimal:temperature',
  has_feedback: false,
  keep_history: true,
  max: 100,
  min: -20,
  name: 'xiaomi-12346-temperature',
  read_only: true,
  type: 'decimal',
  unit: 'celsius'
}, {
  category: 'humidity-sensor',
  external_id: 'xiaomihumidity:12346:decimal',
  has_feedback: false,
  keep_history: true,
  max: 100,
  min: 0,
  name: 'xiaomi-12346-humidity',
  read_only: true,
  type: 'decimal',
  unit: '%'
}],
    name: 'xiaomi-12346-sensor-temp-hum-pression',
    service_id: 'de051f90-f34a-4fd5-be2e-e502339ec9bd',
    should_poll: false
  }
};

describe('GET /api/v1/service/xiaomi/sensor', () => {
  it('should get all sensors', async () => {
    const xiaomiManager = new XiaomiManager(gladys, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    await xiaomiManager.addTemperatureSensor(12346, 21, 50, 10, 50);
    await xiaomiManager.addMotionSensor(12346, true, 50);
    await xiaomiManager.addMagnetSensor(12346, true, 10);
    await xiaomiManager.addThSensor(12346, 21, 50, 50);
    const req = {};
    const xiaomiController = XiaomiController(xiaomiManager);
    await xiaomiController['get /api/v1/service/xiaomi/sensor'].controller(req, res);
    assert.calledWith(res.json, sensorResult);
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
});


// describe('Update value of sensor', () => {
//   it('should update value of magnet sensor', async () => {
//     await authenticatedRequest
//       .post('/api/v1/device')
//       .send({
//         service_id: 'de051f90-f34a-4fd5-be2e-e502339ec9bx',
//         name: 'xiaomi-1234567-sensor-magnet',
//         external_id: 'xiaomi:1234567',
//         should_poll: false,
//         features: [
//           {
//             name: 'xiaomi-1234567-closed',
//             external_id: 'xiaomimagnet:1234567:binary:magnet',
//             category: 'door-opening-sensor',
//             type: 'binary',
//             read_only: true,
//             keep_history: true,
//             has_feedback: false,
//             min: false,
//             max: true,
//           },
//         ],
//       })
//       .expect('Content-Type', /json/)
//       .expect(200);
//     const xiaomiManager = new XiaomiManager(gladys, 'de051f90-f34a-4fd5-be2e-e502339ec9bx');
//     await xiaomiManager.addMotionSensor(1, true, 50);
//   })
// })