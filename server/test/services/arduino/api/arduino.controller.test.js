const { fake, assert, spy } = require('sinon');
const EventEmitter = require('events');
const ArduinoController = require('../../../../services/arduino/api/arduino.controller');
const ArduinoManager = require('../../../../services/arduino/lib');
const ArduinoMock = require('../ArduinoMock.test');

const arduinoData = require('../lib/data/arduinoData.json');
const dhtData = require('../lib/data/dhtData.json');

/* const ports = [
  {
    comPath: '/dev/ttyACM0',
    comName: '/dev/ttyACM0',
    manufacturer: undefined,
    serialNumber: undefined,
  },
]; */

const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');

const deviceManager = {
  get: fake.resolves([arduinoData, dhtData]),
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
