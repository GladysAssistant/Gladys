// const { expect } = require('chai');
const { spy, assert, fake } = require('sinon');
const EventEmitter = require('events');

const ArduinoManager = require('../../../../services/arduino/lib');
const ArduinoMock = require('../ArduinoMock.test');
// const arduinoData = require('./data/arduinoData.json');
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

const deviceManager = {
  get: fake.resolves([arduinoData]),
  getBySelector: fake.resolves([arduinoData]),
};

const gladys = {
  event: new EventEmitter(),
  device: deviceManager,
  variable: {
    getValue: () => Promise.resolve('test'),
  },
};

describe('setup method', async () => {
  const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  it('Should upload an arduino code in the board', async () => {
    const setupSpy = spy(arduinoManager, 'setup');
    arduinoManager.gladys = gladys;
    arduinoManager.setup(arduinoData);
    assert.calledOnce(setupSpy);
  });
});
