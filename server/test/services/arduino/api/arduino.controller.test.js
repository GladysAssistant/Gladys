const { fake } = require('sinon');
const EventEmitter = require('events');
const ArduinoController = require('../../../../services/arduino/api/arduino.controller');
const ArduinoManager = require('../../../../services/arduino/lib');
const ArduinoMock = require('../ArduinoMock.test');

/* const ports = [
  {
    comName: '/dev/tty.HC-05-DevB',
    manufacturer: undefined,
    serialNumber: undefined,
    pnpId: undefined,
    locationId: undefined,
    vendorId: undefined,
    productId: undefined,
  },
]; */

const event = new EventEmitter();

const arduinoManager = new ArduinoManager(ArduinoMock, event, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');

const dhtData = require('../lib/dhtData.json');

const res = {
  json: fake.returns(null),
};

describe('post /api/v1/service/arduino/listen', () => {
  it('should send a message to the arduino', async () => {
    const req = {};
    await ArduinoController['post /api/v1/service/arduino/listen'].controller(req, res);
    // assert.calledWith('/dev/ttyACM0', );
  });
});

describe('post /api/v1/service/arduino/send', () => {
  it('should init the devices', async () => {
    const arduinoController = ArduinoController(arduinoManager);
    const req = {};
    await arduinoController['post /api/v1/service/arduino/send'].controller(req, res);
    // assert.calledOnce();
  });
});

describe('post /api/v1/service/arduino/configure', () => {
  it('should init the devices', async () => {
    const req = dhtData;
    await ArduinoController['post /api/v1/service/arduino/configure'].controller(req, res);
    // assert.calledOnce();
  });
});

describe('post /api/v1/service/arduino/setup', () => {
  it('should init the devices', async () => {
    const req = {};
    await ArduinoController['post /api/v1/service/arduino/setup'].controller(req, res);
    // assert.calledOnce();
  });
});
