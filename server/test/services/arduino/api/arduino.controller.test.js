const { fake, assert, spy } = require('sinon');
const EventEmitter = require('events');
const ArduinoController = require('../../../../services/arduino/api/arduino.controller');
const ArduinoManager = require('../../../../services/arduino/lib');
const ArduinoMock = require('../ArduinoMock.test');

/* const ports = [
  {
    comPath: '/dev/ttyACM0',
    comName: '/dev/ttyACM0',
    manufacturer: undefined,
    serialNumber: undefined,
  },
]; */

const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');

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
  get: fake.resolves([arduinoData, dhtData]),
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

arduinoManager.gladys = gladys;

const res = {
  json: fake.returns(null),
};

describe('post /api/v1/service/arduino/listen', async () => {
  it('should listen to arduino devices', async () => {
    const arduinoController = ArduinoController(arduinoManager);
    const arduinoSpy = spy(arduinoController['post /api/v1/service/arduino/listen'], 'controller');
    const req = arduinoData;
    await arduinoController['post /api/v1/service/arduino/listen'].controller(req, res);
    assert.calledOnce(arduinoSpy);
  });
});

describe('post /api/v1/service/arduino/configure', () => {
  it('should configure a device', async () => {
    const arduinoController = ArduinoController(arduinoManager);
    const arduinoSpy = spy(arduinoController['post /api/v1/service/arduino/configure'], 'controller');
    const req = dhtData;
    await arduinoController['post /api/v1/service/arduino/configure'].controller(req, res);
    assert.calledOnce(arduinoSpy);
  });
});

describe('post /api/v1/service/arduino/setup', async () => {
  it('should upload an arduino code in the card', async () => {
    const arduinoController = ArduinoController(arduinoManager);
    const arduinoSpy = spy(arduinoController['post /api/v1/service/arduino/setup'], 'controller');
    const req = arduinoData;
    await arduinoController['post /api/v1/service/arduino/setup'].controller(req, res);
    assert.calledOnce(arduinoSpy);
  });
});
