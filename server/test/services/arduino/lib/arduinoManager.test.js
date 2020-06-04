const { spy, assert, fake } = require('sinon');
const EventEmitter = require('events');

const ArduinoManager = require('../../../../services/arduino/lib');
const SerialPort = require('../SerialPortMock.test');
const ArduinoMock = require('../ArduinoMock.test');
const arduinoData = require('./data/arduinoData.json');
const deviceData = require('./data/deviceData.json');
const dhtData = require('./data/dhtData.json');
const messageData = require('./data/messageData.json');

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

describe('arduinoManager commands', async () => {
  const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  arduinoManager.gladys = gladys;
  arduinoManager.arduinoParsers = { '/dev/ttyACM0': new SerialPort() };
  arduinoManager.arduinosPorts = { '/dev/ttyACM0': new SerialPort() };
  it('should listen to arduino devices', async () => {
    const listenSpy = spy(arduinoManager, 'listen');
    await arduinoManager.listen(arduinoData);
    assert.calledOnce(listenSpy);
  });
  it('should send a JSON to the arduino', async () => {
    const sendSpy = spy(arduinoManager, 'send');
    await arduinoManager.send('/dev/ttyACM0', messageData, 1);
    assert.calledOnce(sendSpy);
  });
  it('should configure reception of an arduino (DHT)', async () => {
    const configureSpy = spy(arduinoManager, 'configure');
    await arduinoManager.configure(dhtData);
    assert.calledOnce(configureSpy);
  });
  it('should set the value of a feature', async () => {
    const setValueSpy = spy(arduinoManager, 'setValue');
    await arduinoManager.setValue(deviceData, deviceData.features[0], 1);
    assert.calledOnce(setValueSpy);
  });
  it('should flash an arduino card', async () => {
    const setupSpy = spy(arduinoManager, 'setup');
    await arduinoManager.setup(arduinoData);
    assert.calledOnce(setupSpy);
  });
});
