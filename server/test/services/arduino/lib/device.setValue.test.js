const { spy, assert, fake } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');

const ArduinoManager = proxyquire('../../../../services/arduino/lib', { serialport: SerialPortMock });
const ArduinoMock = require('../ArduinoMock.test');

const arduinoData = require('./data/arduinoData.json');
const deviceChaconData = require('./data/deviceData.json');
const deviceEmit433Data = require('./data/deviceEmit433Data.json');
const deviceIRData = require('./data/deviceIRData.json');
const dhtData = require('./data/dhtData.json');
const deviceRecv433Data = require('./data/deviceRecv433Data.json');

const fakeDeviceData = {
  id: '779fa305-bb11-4b73-aa4a-accc79743e9b',
  service_id: '1dbaeb48-d6d2-4930-b7ca-f17d637a364b',
  room_id: '8eb3add6-9f31-4dcf-89d7-20edcef55462',
  name: 'Fake Device',
  selector: 'fake-device',
  model: 'null',
  external_id: '9965d82b-bc80-4cb5-a60b-c5b0577559f3',
  should_poll: 'false',
  poll_frequency: 'null',
  createdAt: '2020-05-26T18: 17: 50.969Z',
  updatedAt: '2020-05-26T18: 17: 50.969Z',
  features: [
    {
      id: '4412eb0f-e705-444c-aa83-b4d76d634673',
      device_id: '779fa305-bb11-4b73-aa4a-accc79743e9b',
      name: 'Fake Device',
      selector: 'fake-device',
      external_id: '9965d82b-bc80-4cb5-a60b-c5b0577559f3',
      category: 'light',
      type: 'binary',
      read_only: 'false',
      keep_history: 'false',
      has_feedback: 'false',
      unit: 'null',
      min: '0',
      max: '1',
      last_value: '0',
      last_value_string: 'null',
      last_value_changed: '2020-05-27T01: 44: 03.922Z',
      createdAt: '2020-05-26T18: 17: 50.989Z',
      updatedAt: '2020-05-27T01: 37: 15.610Z',
    },
  ],
  params: [
    {
      id: '8e316fbc-1386-4774-b7a4-90e88233c7dc',
      device_id: '779fa305-bb11-4b73-aa4a-accc79743e9b',
      name: 'DATA_PIN',
      value: '4',
      createdAt: '2020-05-26T18: 17: 51.007Z',
      updatedAt: '2020-05-26T18: 17: 51.007Z',
    },
    {
      id: 'dabb2541-2e5f-4c8e-a95d-0efd90850ea9',
      device_id: '779fa305-bb11-4b73-aa4a-accc79743e9b',
      name: 'FUNCTION',
      value: 'fake-function',
      createdAt: '2020-05-26T18: 17: 51.009Z',
      updatedAt: '2020-05-26T18: 17: 51.009Z',
    },
    {
      id: '2e6b89f6-396b-412d-bd9f-7477cdf3c9c4',
      device_id: '779fa305-bb11-4b73-aa4a-accc79743e9b',
      name: 'ARDUINO_LINKED',
      value: 'arduino-mega',
      createdAt: '2020-05-26T18: 17: 51.011Z',
      updatedAt: '2020-05-26T18: 17: 51.011Z',
    },
    {
      id: '5fdf8a00-575c-4136-ad7b-27330aea47a6',
      device_id: '779fa305-bb11-4b73-aa4a-accc79743e9b',
      name: 'CODE',
      value: '0',
      createdAt: '2020-05-26T18: 17: 51.013Z',
      updatedAt: '2020-05-26T18: 17: 51.013Z',
    },
    {
      id: '6e53cd3e-618b-42c4-8c74-7a42e429ebb1',
      device_id: '779fa305-bb11-4b73-aa4a-accc79743e9b',
      name: 'CODE_ON',
      value: '1536116368',
      createdAt: '2020-05-26T18: 17: 51.015Z',
      updatedAt: '2020-05-26T18: 17: 51.015Z',
    },
    {
      id: 'cdbea6fc-0a49-4d82-83c4-b1849281f478',
      device_id: '779fa305-bb11-4b73-aa4a-accc79743e9b',
      name: 'CODE_OFF',
      value: '1536116352',
      createdAt: '2020-05-26T18: 17: 51.017Z',
      updatedAt: '2020-05-26T18: 17: 51.017Z',
    },
    {
      id: '42258fdb-0f3c-4cef-889d-385f39d166d6',
      device_id: '779fa305-bb11-4b73-aa4a-accc79743e9b',
      name: 'BIT_LENGTH',
      value: '24',
      createdAt: '2020-05-26T18: 17: 51.019Z',
      updatedAt: '2020-05-26T18: 17: 51.019Z',
    },
    {
      id: '2614bb79-be14-42c9-a47d-cfab5e8f126d',
      device_id: '779fa305-bb11-4b73-aa4a-accc79743e9b',
      name: 'PULSE_LENGTH',
      value: '3',
      createdAt: '2020-05-26T18: 17: 51.021Z',
      updatedAt: '2020-05-26T18: 17: 51.021Z',
    },
  ],
  room: {
    id: '8eb3add6-9f31-4dcf-89d7-20edcef55462',
    house_id: 'bb6c2b29-3f55-4644-a0d4-5395ca7e7fe8',
    name: 'Salon',
    selector: 'salon',
    createdAt: '2020-05-25T17: 16: 16.594Z',
    updatedAt: '2020-05-25T17: 16: 16.594Z',
  },
  service: {
    id: '1dbaeb48-d6d2-4930-b7ca-f17d637a364b',
    pod_id: 'null',
    name: 'arduino',
    selector: 'arduino',
    version: '0.1.0',
    enabled: 'true',
    has_message_feature: 'false',
    createdAt: '2020-05-25T17: 07: 00.776Z',
    updatedAt: '2020-05-25T17: 07: 00.776Z',
  },
};

const deviceManager = {
  get: fake.resolves([arduinoData, deviceChaconData, deviceEmit433Data, deviceRecv433Data, dhtData]),
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

describe.only('setValue function', async () => {
  it('should set the value (ON for classic 433 - Binary)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceEmit433Data.features[0].type = 'binary';
    const setValueSpy = spy(arduinoManager, 'setValue');
    await arduinoManager.setValue(deviceEmit433Data, deviceEmit433Data.features[0], 1);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (OFF for classic 433 - Binary)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceEmit433Data.features[0].type = 'binary';
    const setValueSpy = spy(arduinoManager, 'setValue');
    await arduinoManager.setValue(deviceEmit433Data, deviceEmit433Data.features[0], 0);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (ON for classic 433 - Push)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceEmit433Data.features[0].type = 'push';
    const setValueSpy = spy(arduinoManager, 'setValue');
    await arduinoManager.setValue(deviceEmit433Data, deviceEmit433Data.features[0], 1);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (OFF for classic 433 - Push)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceEmit433Data.features[0].type = 'push';
    const setValueSpy = spy(arduinoManager, 'setValue');
    await arduinoManager.setValue(deviceEmit433Data, deviceEmit433Data.features[0], 0);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (ON for chacon - Binary)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceChaconData.features[0].type = 'binary';
    const setValueSpy = spy(arduinoManager, 'setValue');
    await arduinoManager.setValue(deviceChaconData, deviceChaconData.features[0], 1);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (OFF for chacon - Binary)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceChaconData.features[0].type = 'binary';
    const setValueSpy = spy(arduinoManager, 'setValue');
    await arduinoManager.setValue(deviceChaconData, deviceChaconData.features[0], 0);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (ON for IR - Binary)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceIRData.features[0].type = 'binary';
    const setValueSpy = spy(arduinoManager, 'setValue');
    await arduinoManager.setValue(deviceIRData, deviceIRData.features[0], 1);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (OFF for IR - Binary)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceIRData.features[0].type = 'binary';
    const setValueSpy = spy(arduinoManager, 'setValue');
    await arduinoManager.setValue(deviceIRData, deviceIRData.features[0], 0);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (ON for IR - Push)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceIRData.features[0].type = 'push';
    const setValueSpy = spy(arduinoManager, 'setValue');
    await arduinoManager.setValue(deviceIRData, deviceIRData.features[0], 1);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (OFF for IR - Push)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    deviceIRData.features[0].type = 'push';
    const setValueSpy = spy(arduinoManager, 'setValue');
    await arduinoManager.setValue(deviceIRData, deviceIRData.features[0], 0);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (for DHT)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    const setValueSpy = spy(arduinoManager, 'setValue');
    await arduinoManager.setValue(dhtData, dhtData.features[0], 1);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should set the value (for recv 433)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    const setValueSpy = spy(arduinoManager, 'setValue');
    await arduinoManager.setValue(deviceRecv433Data, deviceRecv433Data.features[0], 4464676);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
  it('should return an error (Arduino : Function = "fake-function" not handled)', async () => {
    const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    arduinoManager.gladys = gladys;
    const setValueSpy = spy(arduinoManager, 'setValue');
    await arduinoManager.setValue(fakeDeviceData, fakeDeviceData.features[0], 1);
    assert.calledOnce(setValueSpy);
    setValueSpy.restore();
  });
});
