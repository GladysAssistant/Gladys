const { spy, assert, fake } = require('sinon');
const EventEmitter = require('events');

const ArduinoManager = require('../../../../services/arduino/lib');
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

describe('init method', async () => {
  const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  arduinoManager.gladys = gladys;
  it('Should init the connection with the arduino devices', () => {
    const initSpy = spy(arduinoManager, 'init');
    arduinoManager.init();
    assert.calledOnce(initSpy);
  });
});
