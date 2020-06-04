// const { expect } = require('chai');
const { spy, assert, fake } = require('sinon');
const EventEmitter = require('events');

const ArduinoManager = require('../../../../services/arduino/lib');
const SerialPort = require('../SerialPortMock.test');
const ArduinoMock = require('../ArduinoMock.test');
// const arduinoData = require('./data/arduinoData.json');
// const deviceData = require('./data/deviceData.json');
// const dhtData = require('./data/dhtData.json');
const arduinoData = {
  id: '8e25bf9a-4b24-4099-a08d-f4afe323c3a7',
  service_id: '1dbaeb48-d6d2-4930-b7ca-f17d637a364b',
  room_id: 'null',
  name: 'Arduino Mega',
  selector: 'arduino-mega',
  model: 'card',
  external_id: '51bc71ad-816c-4682-9bc2-6840a5036b74',
  should_poll: 'false',
  poll_frequency: '30000',
  createdAt: '2020-05-25T17: 25: 45.129Z',
  updatedAt: '2020-05-25T17: 25: 45.129Z',
  features: [],
  params: [
    {
      id: '5b6c5d6f-8756-46af-bfca-f40bb74a14b4',
      device_id: '8e25bf9a-4b24-4099-a08d-f4afe323c3a7',
      name: 'ARDUINO_PATH',
      value: '/dev/ttyACM0',
      createdAt: '2020-05-25T17: 25: 45.168Z',
      updatedAt: '2020-05-25T17: 25: 45.168Z',
    },
    {
      id: '371e873b-b39e-4b84-a87e-e401ce3678ec',
      device_id: '8e25bf9a-4b24-4099-a08d-f4afe323c3a7',
      name: 'ARDUINO_MODEL',
      value: 'mega',
      createdAt: '2020-05-25T17: 25: 45.169Z',
      updatedAt: '2020-05-25T17: 25: 45.169Z',
    },
  ],
  room: 'null',
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

const deviceData = {
  id: '779fa305-bb11-4b73-aa4a-accc79743e9b',
  service_id: '1dbaeb48-d6d2-4930-b7ca-f17d637a364b',
  room_id: '8eb3add6-9f31-4dcf-89d7-20edcef55462',
  name: 'Lampe Salon',
  selector: 'lampe-salon',
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
      name: 'Lampe Salon',
      selector: 'lampe-salon',
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
      value: 'emit_433_chacon',
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

const dhtData = {
  id: '67804a09-804d-45df-be98-0e4a51056ea8',
  service_id: '1dbaeb48-d6d2-4930-b7ca-f17d637a364b',
  room_id: '8eb3add6-9f31-4dcf-89d7-20edcef55462',
  name: 'Temperature',
  selector: 'temperature',
  model: null,
  external_id: 'f0546382-5132-49e4-aaad-5e49fe78af0b',
  should_poll: false,
  poll_frequency: null,
  createdAt: '2020-05-25T17:28:53.170Z',
  updatedAt: '2020-05-25T17:28:53.170Z',
  features: [
    {
      id: '196129b3-5aae-44bc-8ab8-3e3fe31be144',
      device_id: '67804a09-804d-45df-be98-0e4a51056ea8',
      name: 'Temperature',
      selector: 'temperature',
      external_id: 'f0546382-5132-49e4-aaad-5e49fe78af0b',
      category: 'temperature-sensor',
      type: 'decimal',
      read_only: true,
      keep_history: false,
      has_feedback: false,
      unit: 'celsius',
      min: 0,
      max: 100,
      last_value: 26,
      last_value_string: null,
      last_value_changed: '2020-05-27T04:56:18.108Z',
      createdAt: '2020-05-25T17:28:53.180Z',
      updatedAt: '2020-05-27T04:56:18.118Z',
    },
  ],
  params: [
    {
      id: '4604c9f7-4b23-468b-bee0-2f925ab51f47',
      device_id: '67804a09-804d-45df-be98-0e4a51056ea8',
      name: 'DATA_PIN',
      value: '8',
      createdAt: '2020-05-25T17:28:53.191Z',
      updatedAt: '2020-05-25T17:28:53.191Z',
    },
    {
      id: '70088af5-e527-4b7d-9dd1-92868f2a6fe1',
      device_id: '67804a09-804d-45df-be98-0e4a51056ea8',
      name: 'FUNCTION',
      value: 'dht_temperature',
      createdAt: '2020-05-25T17:28:53.193Z',
      updatedAt: '2020-05-25T17:28:53.193Z',
    },
    {
      id: '22c9a314-9076-47bd-b099-2fc10449c787',
      device_id: '67804a09-804d-45df-be98-0e4a51056ea8',
      name: 'ARDUINO_LINKED',
      value: 'arduino-mega',
      createdAt: '2020-05-25T17:28:53.194Z',
      updatedAt: '2020-05-25T17:28:53.194Z',
    },
    {
      id: 'd5b8c0f9-7d55-4ce2-b28d-e797752fba12',
      device_id: '67804a09-804d-45df-be98-0e4a51056ea8',
      name: 'CODE',
      value: '0',
      createdAt: '2020-05-25T17:28:53.195Z',
      updatedAt: '2020-05-25T17:28:53.195Z',
    },
    {
      id: 'a0350656-c79a-4677-90b9-df201254c499',
      device_id: '67804a09-804d-45df-be98-0e4a51056ea8',
      name: 'CODE_ON',
      value: '0',
      createdAt: '2020-05-25T17:28:53.196Z',
      updatedAt: '2020-05-25T17:28:53.196Z',
    },
    {
      id: '92fdfcf1-4352-43bd-9f22-9a7115b4f771',
      device_id: '67804a09-804d-45df-be98-0e4a51056ea8',
      name: 'CODE_OFF',
      value: '0',
      createdAt: '2020-05-25T17:28:53.197Z',
      updatedAt: '2020-05-25T17:28:53.197Z',
    },
    {
      id: '387908b1-d956-44c6-8bad-3174361cd748',
      device_id: '67804a09-804d-45df-be98-0e4a51056ea8',
      name: 'BIT_LENGTH',
      value: '32',
      createdAt: '2020-05-25T17:28:53.198Z',
      updatedAt: '2020-05-25T17:28:53.198Z',
    },
    {
      id: 'a2470072-0c62-43be-ad3d-0748e8ee2dac',
      device_id: '67804a09-804d-45df-be98-0e4a51056ea8',
      name: 'PULSE_LENGTH',
      value: '1',
      createdAt: '2020-05-25T17:28:53.199Z',
      updatedAt: '2020-05-25T17:28:53.199Z',
    },
  ],
  room: {
    id: '8eb3add6-9f31-4dcf-89d7-20edcef55462',
    house_id: 'bb6c2b29-3f55-4644-a0d4-5395ca7e7fe8',
    name: 'Salon',
    selector: 'salon',
    createdAt: '2020-05-25T17:16:16.594Z',
    updatedAt: '2020-05-25T17:16:16.594Z',
  },
  service: {
    id: '1dbaeb48-d6d2-4930-b7ca-f17d637a364b',
    pod_id: null,
    name: 'arduino',
    selector: 'arduino',
    version: '0.1.0',
    enabled: true,
    has_message_feature: false,
    createdAt: '2020-05-25T17:07:00.776Z',
    updatedAt: '2020-05-25T17:07:00.776Z',
  },
};

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
    await arduinoManager.send(
      '/dev/ttyACM0',
      { function_name: 'emit_433_chacon', parameters: { data_pin: '4', code: '1536116368' } },
      1,
    );
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
