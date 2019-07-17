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
    const data = {
      temperature: 22.88,
      humidity: 56.12,
      voltage: 44,
    };
    await xiaomiManager.addTemperatureSensor(123460, 21, 50, 10, 50);
    await xiaomiManager.updateTemperatureSensor(123460, data);
  });
  it('shoud add motion sensor', async () => {
    const xiaomiManager = new XiaomiManager(gladysMotion, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    await xiaomiManager.addMotionSensor(123461, true);
    await xiaomiManager.updateBooleanSensor(123461, true);
    await xiaomiManager.addMotionSensor(123462, false);
    await xiaomiManager.updateBooleanSensor(123462, false);
  });
  it('shoud add magnet sensor', async () => {
    const xiaomiManager = new XiaomiManager(gladysMagnet, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    await xiaomiManager.addMagnetSensor(123463, true, 10);
    await xiaomiManager.updateBooleanSensor(123463, true);
    await xiaomiManager.addMagnetSensor(123464, false, 10);
    await xiaomiManager.updateBooleanSensor(123464, true);
  });
  it('shoud add th sensor', async () => {
    const xiaomiManager = new XiaomiManager(gladysTh, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    await xiaomiManager.addThSensor(123465, 21, 50, 50);
  });
  it('should get error', async () => {
    const xiaomiManager = new XiaomiManager(gladysTh, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    await xiaomiManager.getError('error');
  });
  it('shoud send message from for switch', async () => {
    const xiaomiManager = new XiaomiManager(gladysTh, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    let msg = {
      model: 'switch',
    };
    msg = JSON.stringify(msg);
    const rsinfo = '';
    await xiaomiManager.onMessage(msg, rsinfo);
  });
  it('shoud send message from for double click wireless', async () => {
    const xiaomiManager = new XiaomiManager(gladysTh, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    let msg = {
      model: 'remote.b286acn01',
    };
    msg = JSON.stringify(msg);
    const rsinfo = '';
    await xiaomiManager.onMessage(msg, rsinfo);
  });
  it('shoud send message from xiaomi for magnet aqara', async () => {
    const xiaomiManager = new XiaomiManager(gladysTh, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    let msg = {
      model: 'sensor_magnet.aq2',
      sid: '1234',
      data: {
        status: true,
      },
    };
    msg = JSON.stringify(msg);
    const rsinfo = '';
    await xiaomiManager.onMessage(msg, rsinfo);
  });
  it('shoud send message from xiaomi for motion aqara', async () => {
    const xiaomiManager = new XiaomiManager(gladysTh, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    let msg = {
      model: 'sensor_motion.aq2',
      sid: '1234',
      data: {
        status: true,
      },
    };
    msg = JSON.stringify(msg);
    const rsinfo = '';
    await xiaomiManager.onMessage(msg, rsinfo);
  });
  it('shoud send message from xiaomi for motion', async () => {
    const xiaomiManager = new XiaomiManager(gladysTh, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    let msg = {
      model: 'motion',
      sid: '1234',
      data: {
        status: true,
      },
    };
    msg = JSON.stringify(msg);
    const rsinfo = '';
    await xiaomiManager.onMessage(msg, rsinfo);
  });
  it('shoud send message from xiaomi for motion', async () => {
    const xiaomiManager = new XiaomiManager(gladysTh, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    let msg = {
      model: 'magnet',
      sid: '1234',
      data: {
        status: true,
      },
    };
    msg = JSON.stringify(msg);
    const rsinfo = '';
    await xiaomiManager.onMessage(msg, rsinfo);
  });
  it('shoud send message from xiaomi for weather', async () => {
    const xiaomiManager = new XiaomiManager(gladysTh, 'de051f90-f34a-4fd5-be2e-e502339ec9bd');
    let msg = {
      model: 'weather.v1',
      sid: '1234',
      data: {
        temperature: 2450,
        humidity: 4325,
        voltage: 2984,
      },
    };
    msg.data = JSON.stringify(msg.data);
    msg = JSON.stringify(msg);
    const rsinfo = '';
    await xiaomiManager.onMessage(msg, rsinfo);
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
  it('should get all sensor', async () => {
    const sensor = await xiaomiManager.getSensor();
    expect(sensor).to.be.instanceOf(Object);
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
