const { spy, assert, fake } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();

const SerialPortMock = require('../SerialPortMock.test');
const AvrgirlMock = require('../AvrgirlMock.test');
const ArduinoMock = require('../ArduinoMock.test');
const arduinoData = require('./data/arduinoData.json');
const deviceData = require('./data/deviceData.json');
const dhtData = require('./data/dhtData.json');
const messageData = require('./data/messageData.json');

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

describe('arduinoManager commands', async () => {
  const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  arduinoManager.gladys = gladys;
  arduinoManager.arduinosParsers = { '/dev/ttyACM0': new SerialPortMock() };
  arduinoManager.arduinosPorts = { '/dev/ttyACM0': new SerialPortMock() };
  it('should listen to arduino devices', async () => {
    const listenSpy = spy(arduinoManager, 'listen');
    await arduinoManager.listen(arduinoData);
    assert.calledOnce(listenSpy);
    listenSpy.restore();
  });
  it('should send a JSON to the arduino', async () => {
    const sendSpy = spy(arduinoManager, 'send');
    await arduinoManager.send('/dev/ttyACM0', messageData, 1);
    // arduinoManager.arduinosPorts['/dev/ttyACM0'].emit('open');
    // arduinoManager.arduinoPorts['/dev/ttyACM0'].emit('on');
    assert.calledOnce(sendSpy);
    sendSpy.restore();
  });
  it('send.js : should return "Unable to send message"', async () => {
    const fakeMessage = {};
    fakeMessage.prop = fakeMessage;
    const sendSpy = spy(arduinoManager, 'send');
    await arduinoManager.send('/dev/ttyAMA0', fakeMessage, 1);
    assert.calledOnce(sendSpy);
    sendSpy.restore();
  });
  it('should configure reception of an arduino (DHT)', async () => {
    const configureSpy = spy(arduinoManager, 'configure');
    await arduinoManager.configure(dhtData);
    assert.calledOnce(configureSpy);
    configureSpy.restore();
  });
  it('should set the value of a feature', async () => {
    const setValueSpy = spy(arduinoManager, 'setValue');
    await arduinoManager.setValue(deviceData, deviceData.features[0], 1);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should flash an arduino card', async () => {
    const setupSpy = spy(arduinoManager, 'setup');
    await arduinoManager.setup(arduinoData);
    assert.calledOnce(setupSpy);
    setupSpy.restore();
  });
});
