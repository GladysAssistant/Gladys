const { spy, assert, fake } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();

const ArduinoMock = require('../ArduinoMock.test');
const SerialPortMock = require('../SerialPortMock.test');
const AvrgirlMock = require('../AvrgirlMock.test');

const arduinoData = require('./data/arduinoData.json');
const deviceData = require('./data/deviceData.json');
const dhtData = require('./data/dhtData.json');

const ArduinoManager = proxyquire('../../../../services/arduino/lib', {
  serialport: SerialPortMock,
  'avrgirl-arduino': AvrgirlMock,
});

const deviceManager = {
  get: fake.resolves([arduinoData, deviceData, dhtData]),
  getBySelector: fake.resolves(arduinoData),
  setValue: fake.resolves(null),
};

const gladys = {
  event: new EventEmitter(),
  device: deviceManager,
  variable: {
    getValue: () => Promise.resolve('test'),
  },
};

describe.only('configure function', async () => {
  const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  arduinoManager.gladys = gladys;
  it('should configure the device (dht)', async () => {
    const configureSpy = spy(arduinoManager, 'configure');
    arduinoManager.configure(dhtData);
    assert.calledOnce(configureSpy);
    configureSpy.restore();
  });
  it('should configure the device (chacon) and return an error', async () => {
    const configureSpy = spy(arduinoManager, 'configure');
    arduinoManager.configure(deviceData);
    assert.calledOnce(configureSpy);
    configureSpy.restore();
  });
});
