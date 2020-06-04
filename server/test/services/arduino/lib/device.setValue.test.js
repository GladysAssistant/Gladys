const { spy, assert, fake } = require('sinon');
const EventEmitter = require('events');
const ArduinoManager = require('../../../../services/arduino/lib');
const ArduinoMock = require('../ArduinoMock.test');

const arduinoData = require('./data/arduinoData.json');
const deviceChaconData = require('./data/deviceData.json');
const deviceEmit433Data = require('./data/deviceEmit433Data.json');
const deviceIRData = require('./data/deviceIRData.json');
const dhtData = require('./data/dhtData.json');
const deviceRecv433Data = require('./data/deviceRecv433Data.json');

const deviceManager = {
  get: fake.resolves([arduinoData, deviceChaconData, deviceEmit433Data, deviceRecv433Data, dhtData]),
  getBySelector: fake.resolves(arduinoData),
};

const gladys = {
  event: new EventEmitter(),
  device: deviceManager,
  variable: {
    getValue: () => Promise.resolve('test'),
  },
};

describe('setValue function', async () => {
  it('should set the value (ON for classic 433 - Binary)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceEmit433Data.features[0].type = 'binary';
    const setValueSpy = spy(arduinoManager, 'setValue');
    arduinoManager.setValue(deviceEmit433Data, deviceEmit433Data.features[0], 1);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (OFF for classic 433 - Binary)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceEmit433Data.features[0].type = 'binary';
    const setValueSpy = spy(arduinoManager, 'setValue');
    arduinoManager.setValue(deviceEmit433Data, deviceEmit433Data.features[0], 0);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (ON for classic 433 - Push)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceEmit433Data.features[0].type = 'push';
    const setValueSpy = spy(arduinoManager, 'setValue');
    arduinoManager.setValue(deviceEmit433Data, deviceEmit433Data.features[0], 1);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (OFF for classic 433 - Push)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceEmit433Data.features[0].type = 'push';
    const setValueSpy = spy(arduinoManager, 'setValue');
    arduinoManager.setValue(deviceEmit433Data, deviceEmit433Data.features[0], 0);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (ON for chacon - Binary)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceChaconData.features[0].type = 'binary';
    const setValueSpy = spy(arduinoManager, 'setValue');
    arduinoManager.setValue(deviceChaconData, deviceChaconData.features[0], 1);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (OFF for chacon - Binary)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceChaconData.features[0].type = 'binary';
    const setValueSpy = spy(arduinoManager, 'setValue');
    arduinoManager.setValue(deviceChaconData, deviceChaconData.features[0], 0);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (ON for IR - Binary)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceIRData.features[0].type = 'binary';
    const setValueSpy = spy(arduinoManager, 'setValue');
    arduinoManager.setValue(deviceIRData, deviceIRData.features[0], 1);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (OFF for IR - Binary)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceIRData.features[0].type = 'binary';
    const setValueSpy = spy(arduinoManager, 'setValue');
    arduinoManager.setValue(deviceIRData, deviceIRData.features[0], 0);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (ON for IR - Push)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceIRData.features[0].type = 'push';
    const setValueSpy = spy(arduinoManager, 'setValue');
    arduinoManager.setValue(deviceIRData, deviceIRData.features[0], 1);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (OFF for IR - Push)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceIRData.features[0].type = 'push';
    const setValueSpy = spy(arduinoManager, 'setValue');
    arduinoManager.setValue(deviceIRData, deviceIRData.features[0], 0);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (for DHT)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    const setValueSpy = spy(arduinoManager, 'setValue');
    arduinoManager.setValue(deviceIRData, deviceIRData.features[0], 1);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (for recv 433)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    const setValueSpy = spy(arduinoManager, 'setValue');
    arduinoManager.setValue(deviceRecv433Data, deviceRecv433Data.features[0], 4464676);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
});
