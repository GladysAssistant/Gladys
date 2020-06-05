const { spy, assert, fake } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');

const ArduinoManager = proxyquire('../../../../services/arduino/lib', { serialport: SerialPortMock });

const ArduinoMock = require('../ArduinoMock.test');
const arduinoData = require('./data/arduinoData.json');
const deviceData = require('./data/deviceData.json');
const dhtData = require('./data/dhtData.json');

const deviceManager = {
  get: fake.resolves([arduinoData, deviceData, dhtData]),
};

const gladys = {
  event: new EventEmitter(),
  device: deviceManager,
  variable: {
    getValue: () => Promise.resolve('test'),
  },
};

const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
arduinoManager.gladys = gladys;

describe.only('init method', async () => {
  it('Should init the connection with the arduino devices', async () => {
    const initSpy = spy(arduinoManager, 'init');
    await arduinoManager.init();
    assert.calledOnce(initSpy);
    initSpy.restore();
  });
  it('Should return "Unable to init device"', async () => {
    // arduinoData.model = null;
    // dhtData.model = 'card';
    const initSpy = spy(arduinoManager, 'init');
    await arduinoManager.init();
    assert.calledOnce(initSpy);
    initSpy.restore();
    // arduinoData.model = 'card';
    // dhtData.model = null;
  });
});
