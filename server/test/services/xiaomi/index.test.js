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

const gladysTh = {
  event: new EventEmitter(),
  device: {
    get: () =>
      Promise.resolve([
        {
          service_id: 'de051f90-f34a-4fd5-be2e-e502339ec9bd',
          name: `xiaomi-123465-sensor-temp-hum-pression`,
          external_id: `xiaomi:123465`,
          should_poll: false,
          features: [
            {
              name: `xiaomi-123465-temperature`,
              external_id: `xiaomitemperature:123465:decimal:temperature`,
              category: 'temperature-sensor',
              type: 'decimal',
              unit: 'celsius',
              read_only: true,
              keep_history: true,
              has_feedback: false,
              min: -20,
              max: 100,
            },
            {
              name: `xiaomi-123465-humidity`,
              external_id: `xiaomihumidity:123465:decimal`,
              category: 'humidity-sensor',
              type: 'decimal',
              unit: '%',
              read_only: true,
              keep_history: true,
              has_feedback: false,
              min: 0,
              max: 100,
            },
          ],
        },
      ]),
  },
};

const gladysTemperature = {
  event: new EventEmitter(),
  device: {
    get: () =>
      Promise.resolve([
        {
          service_id: 'de051f90-f34a-4fd5-be2e-e502339ec9bd',
          name: `xiaomi-123460-sensor-temp-hum-pression`,
          external_id: `xiaomi:123460`,
          should_poll: false,
          features: [
            {
              name: `xiaomi-123460-temperature`,
              external_id: `xiaomitemperature:123460:decimal:temperature`,
              category: 'temperature-sensor',
              type: 'decimal',
              unit: 'celsius',
              read_only: true,
              keep_history: true,
              has_feedback: false,
              min: -20,
              max: 100,
            },
            {
              name: `xiaomi-123460-humidity`,
              external_id: `xiaomihumidity:123460:decimal`,
              category: 'humidity-sensor',
              type: 'decimal',
              unit: '%',
              read_only: true,
              keep_history: true,
              has_feedback: false,
              min: 0,
              max: 100,
            },
          ],
        },
      ]),
  },
};

const gladysMagnet = {
  event: new EventEmitter(),
  device: {
    get: () =>
      Promise.resolve([
        {
          service_id: 'de051f90-f34a-4fd5-be2e-e502339ec9bd',
          name: `xiaomi-123463-sensor-temp-hum-pression`,
          external_id: `xiaomi:123463`,
          should_poll: false,
          features: [
            {
              name: `xiaomi-123463-temperature`,
              external_id: `xiaomitemperature:123463:decimal:temperature`,
              category: 'temperature-sensor',
              type: 'decimal',
              unit: 'celsius',
              read_only: true,
              keep_history: true,
              has_feedback: false,
              min: -20,
              max: 100,
            },
            {
              name: `xiaomi-123463-humidity`,
              external_id: `xiaomihumidity:123463:decimal`,
              category: 'humidity-sensor',
              type: 'decimal',
              unit: '%',
              read_only: true,
              keep_history: true,
              has_feedback: false,
              min: 0,
              max: 100,
            },
          ],
        },
      ]),
  },
};

const gladysMotion = {
  event: new EventEmitter(),
  device: {
    get: () =>
      Promise.resolve([
        {
          service_id: 'de051f90-f34a-4fd5-be2e-e502339ec9bd',
          name: `xiaomi-123461-sensor-temp-hum-pression`,
          external_id: `xiaomi:123461`,
          should_poll: false,
          features: [
            {
              name: `xiaomi-123461-temperature`,
              external_id: `xiaomitemperature:123461:decimal:temperature`,
              category: 'temperature-sensor',
              type: 'decimal',
              unit: 'celsius',
              read_only: true,
              keep_history: true,
              has_feedback: false,
              min: -20,
              max: 100,
            },
            {
              name: `xiaomi-123461-humidity`,
              external_id: `xiaomihumidity:123461:decimal`,
              category: 'humidity-sensor',
              type: 'decimal',
              unit: '%',
              read_only: true,
              keep_history: true,
              has_feedback: false,
              min: 0,
              max: 100,
            },
          ],
        },
      ]),
  },
};

describe('Xioami events', () => {
  it('shoud add temperature sensor', async () => {
    const xiaomiManager = new XiaomiManager(gladysTemperature, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    await xiaomiManager.addTemperatureSensor(123460, 21, 50, 10, 50);
  });
  it('shoud add motion sensor', async () => {
    const xiaomiManager = new XiaomiManager(gladysMotion, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    await xiaomiManager.addMotionSensor(123461, true, 50);
    await xiaomiManager.addMotionSensor(123462, false, 50);
  });
  it('shoud add magnet sensor', async () => {
    const xiaomiManager = new XiaomiManager(gladysMagnet, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    await xiaomiManager.addMagnetSensor(123463, true, 10);
    await xiaomiManager.addMagnetSensor(123464, false, 10);
  });
  it('shoud add th sensor', async () => {
    const xiaomiManager = new XiaomiManager(gladysTh, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    await xiaomiManager.addThSensor(123465, 21, 50, 50);
  });
  it('should get error', async () => {
    const xiaomiManager = new XiaomiManager(gladysTh, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    await xiaomiManager.getError('error');
  });
});

const gladys = {
  event: new EventEmitter(),
  device: {
    get: () => Promise.resolve('log'),
  },
};

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
