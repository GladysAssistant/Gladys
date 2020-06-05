const { spy, assert, fake } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');
const ReadLineMock = require('../ReadLineMock.test');

const ArduinoMock = require('../ArduinoMock.test');
const arduinoData = require('./data/arduinoData.json');

const ArduinoManager = proxyquire('../../../../services/arduino/lib', {
  serialport: SerialPortMock,
  '@serialport/parser-readline': ReadLineMock,
});

const deviceManager = {
  get: fake.resolves([arduinoData]),
  getBySelector: fake.resolves([arduinoData]),
  setValue: fake.resolves(null),
};

const gladys = {
  event: new EventEmitter(),
  device: deviceManager,
  variable: {
    getValue: () => Promise.resolve('test'),
  },
};

describe('listen function', async () => {
  const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  arduinoManager.gladys = gladys;
  arduinoManager.arduinoParsers = { '/dev/ttyACM0': null };
  it('should listen to arduino device', async () => {
    const listenSpy = spy(arduinoManager, 'listen');
    arduinoManager.listen(arduinoData);
    assert.calledOnce(listenSpy);
    listenSpy.restore();
  });
  it('should be unable to listen to arduino device', () => {
    const listenSpy = spy(arduinoManager, 'listen');
    arduinoManager.listen(arduinoData);
    assert.calledOnce(listenSpy);
    listenSpy.restore();
  });
});
